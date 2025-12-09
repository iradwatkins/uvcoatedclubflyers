import { sql, query } from '@/lib/db';
import type { AutomationEvent, AutomationQueueItem, AutomationAction } from './types';
import { getContactByEmail, addTagToContact, removeTagFromContact, logContactActivity } from './contacts';

// ============================================================================
// AUTOMATION EVENTS
// ============================================================================

export async function getAutomationEvents(): Promise<AutomationEvent[]> {
  const events = await sql`
    SELECT
      id,
      event_type as "eventType",
      name,
      description,
      is_active as "isActive",
      conditions,
      actions,
      times_triggered as "timesTriggered",
      last_triggered_at as "lastTriggeredAt",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM automation_rules
    ORDER BY name
  `;

  return events as AutomationEvent[];
}

export async function getActiveEventsForType(eventType: string): Promise<AutomationEvent[]> {
  const events = await sql`
    SELECT
      id,
      event_type as "eventType",
      name,
      description,
      is_active as "isActive",
      conditions,
      actions,
      times_triggered as "timesTriggered",
      last_triggered_at as "lastTriggeredAt",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM automation_rules
    WHERE event_type = ${eventType}
      AND is_active = true
  `;

  return events as AutomationEvent[];
}

export async function updateAutomationEvent(
  id: number,
  data: Partial<{
    name: string;
    description: string;
    isActive: boolean;
    conditions: Record<string, unknown>;
    actions: AutomationAction[];
  }>
): Promise<void> {
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (data.name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    values.push(data.name);
  }
  if (data.description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    values.push(data.description);
  }
  if (data.isActive !== undefined) {
    updates.push(`is_active = $${paramIndex++}`);
    values.push(data.isActive);
  }
  if (data.conditions !== undefined) {
    updates.push(`conditions = $${paramIndex++}`);
    values.push(JSON.stringify(data.conditions));
  }
  if (data.actions !== undefined) {
    updates.push(`actions = $${paramIndex++}`);
    values.push(JSON.stringify(data.actions));
  }

  if (updates.length === 0) return;

  updates.push('updated_at = NOW()');
  values.push(id);

  const updateQuery = `
    UPDATE automation_rules
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
  `;

  await query(updateQuery, values);
}

// ============================================================================
// TRIGGER AUTOMATIONS
// ============================================================================

export async function triggerAutomation(
  eventType: string,
  contactEmail: string,
  eventData: Record<string, unknown> = {}
): Promise<void> {
  // Get contact
  const contact = await getContactByEmail(contactEmail);
  if (!contact) {
    console.log(`[Automation] No contact found for email: ${contactEmail}`);
    return;
  }

  // Get active automations for this event type
  const events = await getActiveEventsForType(eventType);

  for (const event of events) {
    // Check conditions
    if (!checkConditions(event.conditions, { contact, eventData })) {
      continue;
    }

    // Queue actions
    for (const action of event.actions) {
      const delayHours = action.delayHours || 0;
      const scheduledFor = new Date(Date.now() + delayHours * 60 * 60 * 1000);

      await sql`
        INSERT INTO automation_queue (
          automation_event_id,
          contact_id,
          action_type,
          action_data,
          scheduled_for,
          trigger_event,
          trigger_data
        ) VALUES (
          ${event.id},
          ${contact.id},
          ${action.type},
          ${JSON.stringify(action)},
          ${scheduledFor},
          ${eventType},
          ${JSON.stringify(eventData)}
        )
      `;
    }

    // Update event stats
    await sql`
      UPDATE automation_rules
      SET
        times_triggered = times_triggered + 1,
        last_triggered_at = NOW()
      WHERE id = ${event.id}
    `;

    // Log activity
    await logContactActivity(
      contact.id,
      'automation_triggered',
      `Automation "${event.name}" triggered`,
      { eventType, automationId: event.id },
      { automationId: event.id, icon: 'zap' }
    );
  }
}

function checkConditions(
  conditions: Record<string, unknown>,
  context: { contact: any; eventData: Record<string, unknown> }
): boolean {
  const { contact, eventData } = context;

  for (const [key, value] of Object.entries(conditions)) {
    switch (key) {
      case 'status':
        if (eventData.status !== value) return false;
        break;
      case 'min_value':
        if ((eventData.totalAmount as number) < (value as number)) return false;
        break;
      case 'is_first_order':
        if (value && contact.orderCount !== 1) return false;
        break;
      case 'order_count':
        if (contact.orderCount !== value) return false;
        break;
      case 'source':
        if (contact.source !== value) return false;
        break;
      case 'days':
        // For scheduled events, always pass - the timing is handled elsewhere
        break;
      case 'order_status':
        // For scheduled events checking order status
        break;
    }
  }

  return true;
}

// ============================================================================
// PROCESS AUTOMATION QUEUE
// ============================================================================

export async function processAutomationQueue(limit: number = 50): Promise<number> {
  // Get pending items that are due
  const items = await sql`
    SELECT
      id,
      automation_event_id as "automationEventId",
      contact_id as "contactId",
      action_type as "actionType",
      action_data as "actionData",
      scheduled_for as "scheduledFor",
      status,
      attempts,
      max_attempts as "maxAttempts",
      trigger_event as "triggerEvent",
      trigger_data as "triggerData"
    FROM automation_queue
    WHERE status = 'pending'
      AND scheduled_for <= NOW()
    ORDER BY scheduled_for ASC
    LIMIT ${limit}
    FOR UPDATE SKIP LOCKED
  ` as AutomationQueueItem[];

  let processed = 0;

  for (const item of items) {
    try {
      // Mark as processing
      await sql`
        UPDATE automation_queue
        SET status = 'processing', last_attempt_at = NOW(), attempts = attempts + 1
        WHERE id = ${item.id}
      `;

      // Execute action
      await executeAction(item);

      // Mark as completed
      await sql`
        UPDATE automation_queue
        SET status = 'completed', completed_at = NOW()
        WHERE id = ${item.id}
      `;

      // Log success
      await sql`
        INSERT INTO automation_log (
          automation_event_id,
          automation_queue_id,
          contact_id,
          action_type,
          action_data,
          status,
          completed_at,
          duration_ms
        ) VALUES (
          ${item.automationEventId},
          ${item.id},
          ${item.contactId},
          ${item.actionType},
          ${JSON.stringify(item.actionData)},
          'success',
          NOW(),
          ${Date.now() - new Date(item.scheduledFor).getTime()}
        )
      `;

      processed++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Check if we should retry
      if (item.attempts < item.maxAttempts) {
        await sql`
          UPDATE automation_queue
          SET status = 'pending', error_message = ${errorMessage}
          WHERE id = ${item.id}
        `;
      } else {
        await sql`
          UPDATE automation_queue
          SET status = 'failed', error_message = ${errorMessage}
          WHERE id = ${item.id}
        `;
      }

      // Log failure
      await sql`
        INSERT INTO automation_log (
          automation_event_id,
          automation_queue_id,
          contact_id,
          action_type,
          action_data,
          status,
          error_message
        ) VALUES (
          ${item.automationEventId},
          ${item.id},
          ${item.contactId},
          ${item.actionType},
          ${JSON.stringify(item.actionData)},
          'failed',
          ${errorMessage}
        )
      `;

      console.error(`[Automation] Failed to process item ${item.id}:`, error);
    }
  }

  return processed;
}

async function executeAction(item: AutomationQueueItem): Promise<void> {
  const actionData = item.actionData as unknown as AutomationAction;

  switch (item.actionType) {
    case 'send_email':
      await executeSendEmail(item.contactId, actionData);
      break;

    case 'add_tag':
      if (actionData.tag) {
        await addTagToContact(item.contactId, actionData.tag, 'automation');
      }
      break;

    case 'remove_tag':
      if (actionData.tag) {
        await removeTagFromContact(item.contactId, actionData.tag);
      }
      break;

    case 'send_sms':
      // SMS integration would go here
      console.log(`[Automation] SMS sending not implemented yet`);
      break;

    case 'webhook':
      if (actionData.webhookUrl) {
        await fetch(actionData.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contactId: item.contactId,
            triggerEvent: item.triggerEvent,
            triggerData: item.triggerData,
            ...actionData.data,
          }),
        });
      }
      break;

    default:
      throw new Error(`Unknown action type: ${item.actionType}`);
  }
}

async function executeSendEmail(contactId: number, action: AutomationAction): Promise<void> {
  // Get contact
  const [contact] = await sql`
    SELECT email, first_name, last_name, email_subscribed
    FROM contacts
    WHERE id = ${contactId}
  ` as { email: string; first_name: string | null; last_name: string | null; email_subscribed: boolean }[];

  if (!contact) {
    throw new Error(`Contact not found: ${contactId}`);
  }

  if (!contact.email_subscribed) {
    console.log(`[Automation] Contact ${contactId} is unsubscribed, skipping email`);
    return;
  }

  // TODO: Integrate with email sending system
  // For now, just log it
  console.log(`[Automation] Would send email template "${action.template}" to ${contact.email}`);

  // Update contact email stats
  await sql`
    UPDATE contacts
    SET
      emails_sent = emails_sent + 1,
      last_email_sent_at = NOW()
    WHERE id = ${contactId}
  `;

  // Log activity
  await logContactActivity(
    contactId,
    'email_sent',
    `Automation email sent: ${action.template}`,
    { template: action.template },
    { icon: 'mail' }
  );
}

// ============================================================================
// SCHEDULED EVENTS (Days After Order, Win-back, etc.)
// ============================================================================

export async function checkScheduledAutomations(): Promise<void> {
  // Check "days_after_order" events
  const daysAfterOrderEvents = await sql`
    SELECT id, conditions, actions
    FROM automation_rules
    WHERE event_type = 'days_after_order'
      AND is_active = true
  ` as { id: number; conditions: Record<string, unknown>; actions: AutomationAction[] }[];

  for (const event of daysAfterOrderEvents) {
    const days = event.conditions.days as number;
    const orderStatus = event.conditions.order_status as string;

    // Find orders that match the criteria and haven't triggered this automation
    const eligibleContacts = await sql`
      SELECT DISTINCT c.id as contact_id, c.email
      FROM contacts c
      JOIN orders o ON (o.user_id = c.user_id OR o.billing_email = c.email)
      WHERE o.status = ${orderStatus}
        AND o.created_at::date = (CURRENT_DATE - INTERVAL '${sql.unsafe(days.toString())} days')::date
        AND NOT EXISTS (
          SELECT 1 FROM automation_queue aq
          WHERE aq.contact_id = c.id
            AND aq.automation_event_id = ${event.id}
            AND aq.trigger_data->>'orderId' = o.id::text
        )
    `;

    for (const contact of eligibleContacts) {
      await triggerAutomation('days_after_order', contact.email as string, {
        automationEventId: event.id,
        days,
      });
    }
  }

  // Check "days_since_last_order" events (win-back)
  const winbackEvents = await sql`
    SELECT id, conditions, actions
    FROM automation_rules
    WHERE event_type = 'days_since_last_order'
      AND is_active = true
  ` as { id: number; conditions: Record<string, unknown>; actions: AutomationAction[] }[];

  for (const event of winbackEvents) {
    const days = event.conditions.days as number;

    // Find contacts who haven't ordered in X days and haven't triggered this automation recently
    const eligibleContacts = await sql`
      SELECT c.id as contact_id, c.email
      FROM contacts c
      WHERE c.last_order_at IS NOT NULL
        AND c.last_order_at < (CURRENT_DATE - INTERVAL '${sql.unsafe(days.toString())} days')
        AND c.email_subscribed = true
        AND NOT EXISTS (
          SELECT 1 FROM automation_queue aq
          WHERE aq.contact_id = c.id
            AND aq.automation_event_id = ${event.id}
            AND aq.created_at > (CURRENT_DATE - INTERVAL '30 days')
        )
    `;

    for (const contact of eligibleContacts) {
      await triggerAutomation('days_since_last_order', contact.email as string, {
        automationEventId: event.id,
        days,
      });
    }
  }
}
