import { sql, query } from '@/lib/db';
import type {
  Contact,
  ContactTag,
  ContactNote,
  ContactActivity,
  ContactListParams,
  ContactStats,
  ContactStatus,
} from './types';

// ============================================================================
// CONTACT CRUD
// ============================================================================

export async function getContacts(params: ContactListParams = {}): Promise<{
  contacts: Contact[];
  total: number;
}> {
  const {
    page = 1,
    limit = 50,
    search,
    status = 'all',
    tags = [],
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = params;

  const offset = (page - 1) * limit;

  // Build WHERE conditions
  const conditions: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (status !== 'all') {
    conditions.push(`c.status = $${paramIndex++}`);
    values.push(status);
  }

  if (search) {
    conditions.push(`(
      c.email ILIKE $${paramIndex} OR
      c.first_name ILIKE $${paramIndex} OR
      c.last_name ILIKE $${paramIndex} OR
      c.company ILIKE $${paramIndex}
    )`);
    values.push(`%${search}%`);
    paramIndex++;
  }

  if (tags.length > 0) {
    conditions.push(`EXISTS (
      SELECT 1 FROM contact_tag_assignments cta
      JOIN contact_tags ct ON ct.id = cta.tag_id
      WHERE cta.contact_id = c.id AND ct.slug = ANY($${paramIndex}::text[])
    )`);
    values.push(tags);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Valid sort columns
  const sortColumns: Record<string, string> = {
    created_at: 'c.created_at',
    lifetime_value: 'c.lifetime_value',
    last_order_at: 'c.last_order_at',
    order_count: 'c.order_count',
  };
  const sortColumn = sortColumns[sortBy] || 'c.created_at';
  const sortDir = sortOrder === 'asc' ? 'ASC' : 'DESC';

  // Get total count
  const countQuery = `SELECT COUNT(*) as total FROM contacts c ${whereClause}`;
  const countResult = await query(countQuery, values);
  const total = parseInt(countResult.rows[0]?.total || '0');

  // Get contacts
  const contactsQuery = `
    SELECT
      c.id,
      c.user_id as "userId",
      c.email,
      c.first_name as "firstName",
      c.last_name as "lastName",
      c.phone,
      c.company,
      c.address_line1 as "addressLine1",
      c.address_line2 as "addressLine2",
      c.city,
      c.state,
      c.postal_code as "postalCode",
      c.country,
      c.custom_fields as "customFields",
      c.lifetime_value as "lifetimeValue",
      c.order_count as "orderCount",
      c.last_order_at as "lastOrderAt",
      c.first_order_at as "firstOrderAt",
      c.average_order_value as "averageOrderValue",
      c.emails_sent as "emailsSent",
      c.emails_opened as "emailsOpened",
      c.emails_clicked as "emailsClicked",
      c.last_email_sent_at as "lastEmailSentAt",
      c.last_email_opened_at as "lastEmailOpenedAt",
      c.status,
      c.email_subscribed as "emailSubscribed",
      c.sms_subscribed as "smsSubscribed",
      c.source,
      c.source_details as "sourceDetails",
      c.utm_source as "utmSource",
      c.utm_medium as "utmMedium",
      c.utm_campaign as "utmCampaign",
      c.created_at as "createdAt",
      c.updated_at as "updatedAt"
    FROM contacts c
    ${whereClause}
    ORDER BY ${sortColumn} ${sortDir}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  const contactsResult = await query(contactsQuery, [...values, limit, offset]);
  const contacts = contactsResult.rows as Contact[];

  // Get tags for all contacts
  if (contacts.length > 0) {
    const contactIds = contacts.map((c) => c.id);
    const tagsResult = await sql`
      SELECT
        cta.contact_id as "contactId",
        ct.id,
        ct.name,
        ct.slug,
        ct.color,
        ct.description
      FROM contact_tag_assignments cta
      JOIN contact_tags ct ON ct.id = cta.tag_id
      WHERE cta.contact_id = ANY(${contactIds}::int[])
    `;

    const tagsByContactId = new Map<number, ContactTag[]>();
    for (const row of tagsResult) {
      const contactId = row.contactId as number;
      if (!tagsByContactId.has(contactId)) {
        tagsByContactId.set(contactId, []);
      }
      tagsByContactId.get(contactId)!.push({
        id: row.id as number,
        name: row.name as string,
        slug: row.slug as string,
        color: row.color as string,
        description: row.description as string | null,
        autoRules: null,
        contactCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    for (const contact of contacts) {
      contact.tags = tagsByContactId.get(contact.id) || [];
    }
  }

  return { contacts, total };
}

export async function getContactById(id: number): Promise<Contact | null> {
  const [contact] = await sql`
    SELECT
      id,
      user_id as "userId",
      email,
      first_name as "firstName",
      last_name as "lastName",
      phone,
      company,
      address_line1 as "addressLine1",
      address_line2 as "addressLine2",
      city,
      state,
      postal_code as "postalCode",
      country,
      custom_fields as "customFields",
      lifetime_value as "lifetimeValue",
      order_count as "orderCount",
      last_order_at as "lastOrderAt",
      first_order_at as "firstOrderAt",
      average_order_value as "averageOrderValue",
      emails_sent as "emailsSent",
      emails_opened as "emailsOpened",
      emails_clicked as "emailsClicked",
      last_email_sent_at as "lastEmailSentAt",
      last_email_opened_at as "lastEmailOpenedAt",
      status,
      email_subscribed as "emailSubscribed",
      sms_subscribed as "smsSubscribed",
      source,
      source_details as "sourceDetails",
      utm_source as "utmSource",
      utm_medium as "utmMedium",
      utm_campaign as "utmCampaign",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM contacts
    WHERE id = ${id}
  ` as Contact[];

  if (!contact) return null;

  // Get tags
  const tags = await sql`
    SELECT
      ct.id,
      ct.name,
      ct.slug,
      ct.color,
      ct.description
    FROM contact_tag_assignments cta
    JOIN contact_tags ct ON ct.id = cta.tag_id
    WHERE cta.contact_id = ${id}
  `;

  contact.tags = tags as ContactTag[];

  return contact;
}

export async function getContactByEmail(email: string): Promise<Contact | null> {
  const [contact] = await sql`
    SELECT id FROM contacts WHERE email = ${email.toLowerCase()}
  ` as { id: number }[];

  if (!contact) return null;
  return getContactById(contact.id);
}

export async function createContact(data: {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  userId?: number;
  source?: string;
  sourceDetails?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}): Promise<Contact> {
  const [contact] = await sql`
    INSERT INTO contacts (
      email,
      first_name,
      last_name,
      phone,
      company,
      user_id,
      source,
      source_details,
      utm_source,
      utm_medium,
      utm_campaign
    ) VALUES (
      ${data.email.toLowerCase()},
      ${data.firstName || null},
      ${data.lastName || null},
      ${data.phone || null},
      ${data.company || null},
      ${data.userId || null},
      ${data.source || 'manual'},
      ${data.sourceDetails || null},
      ${data.utmSource || null},
      ${data.utmMedium || null},
      ${data.utmCampaign || null}
    )
    ON CONFLICT (email) DO UPDATE SET
      first_name = COALESCE(EXCLUDED.first_name, contacts.first_name),
      last_name = COALESCE(EXCLUDED.last_name, contacts.last_name),
      phone = COALESCE(EXCLUDED.phone, contacts.phone),
      user_id = COALESCE(EXCLUDED.user_id, contacts.user_id),
      updated_at = NOW()
    RETURNING id
  ` as { id: number }[];

  return getContactById(contact.id) as Promise<Contact>;
}

export async function updateContact(
  id: number,
  data: Partial<{
    firstName: string;
    lastName: string;
    phone: string;
    company: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    customFields: Record<string, unknown>;
    status: ContactStatus;
    emailSubscribed: boolean;
    smsSubscribed: boolean;
  }>
): Promise<Contact | null> {
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (data.firstName !== undefined) {
    updates.push(`first_name = $${paramIndex++}`);
    values.push(data.firstName);
  }
  if (data.lastName !== undefined) {
    updates.push(`last_name = $${paramIndex++}`);
    values.push(data.lastName);
  }
  if (data.phone !== undefined) {
    updates.push(`phone = $${paramIndex++}`);
    values.push(data.phone);
  }
  if (data.company !== undefined) {
    updates.push(`company = $${paramIndex++}`);
    values.push(data.company);
  }
  if (data.addressLine1 !== undefined) {
    updates.push(`address_line1 = $${paramIndex++}`);
    values.push(data.addressLine1);
  }
  if (data.city !== undefined) {
    updates.push(`city = $${paramIndex++}`);
    values.push(data.city);
  }
  if (data.state !== undefined) {
    updates.push(`state = $${paramIndex++}`);
    values.push(data.state);
  }
  if (data.postalCode !== undefined) {
    updates.push(`postal_code = $${paramIndex++}`);
    values.push(data.postalCode);
  }
  if (data.status !== undefined) {
    updates.push(`status = $${paramIndex++}`);
    values.push(data.status);
  }
  if (data.emailSubscribed !== undefined) {
    updates.push(`email_subscribed = $${paramIndex++}`);
    values.push(data.emailSubscribed);
  }
  if (data.smsSubscribed !== undefined) {
    updates.push(`sms_subscribed = $${paramIndex++}`);
    values.push(data.smsSubscribed);
  }
  if (data.customFields !== undefined) {
    updates.push(`custom_fields = $${paramIndex++}`);
    values.push(JSON.stringify(data.customFields));
  }

  if (updates.length === 0) {
    return getContactById(id);
  }

  updates.push(`updated_at = NOW()`);
  values.push(id);

  const updateQuery = `
    UPDATE contacts
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING id
  `;

  await query(updateQuery, values);
  return getContactById(id);
}

// ============================================================================
// CONTACT STATS
// ============================================================================

export async function getContactStats(): Promise<ContactStats> {
  const [stats] = await sql`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'active') as active,
      COUNT(*) FILTER (WHERE status = 'unsubscribed') as unsubscribed,
      COALESCE(SUM(lifetime_value), 0) as total_lifetime_value,
      COALESCE(AVG(lifetime_value), 0) as average_lifetime_value,
      COALESCE(SUM(order_count), 0) as total_orders,
      COUNT(*) FILTER (WHERE order_count > 0) as with_orders,
      COUNT(*) FILTER (WHERE order_count = 0) as without_orders,
      COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW())) as new_this_month
    FROM contacts
  ` as {
    total: string;
    active: string;
    unsubscribed: string;
    total_lifetime_value: string;
    average_lifetime_value: string;
    total_orders: string;
    with_orders: string;
    without_orders: string;
    new_this_month: string;
  }[];

  return {
    total: parseInt(stats.total),
    active: parseInt(stats.active),
    unsubscribed: parseInt(stats.unsubscribed),
    totalLifetimeValue: parseFloat(stats.total_lifetime_value),
    averageLifetimeValue: parseFloat(stats.average_lifetime_value),
    totalOrders: parseInt(stats.total_orders),
    withOrders: parseInt(stats.with_orders),
    withoutOrders: parseInt(stats.without_orders),
    newThisMonth: parseInt(stats.new_this_month),
  };
}

// ============================================================================
// TAGS
// ============================================================================

export async function getTags(): Promise<ContactTag[]> {
  const tags = await sql`
    SELECT
      id,
      name,
      slug,
      color,
      description,
      auto_rules as "autoRules",
      contact_count as "contactCount",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM contact_tags
    ORDER BY name
  `;

  return tags as ContactTag[];
}

export async function addTagToContact(
  contactId: number,
  tagSlug: string,
  assignedBy: 'manual' | 'automation' | 'import' | 'rule' = 'manual',
  assignedByUserId?: number
): Promise<void> {
  await sql`
    INSERT INTO contact_tag_assignments (contact_id, tag_id, assigned_by, assigned_by_user_id)
    SELECT ${contactId}, id, ${assignedBy}, ${assignedByUserId || null}
    FROM contact_tags
    WHERE slug = ${tagSlug}
    ON CONFLICT (contact_id, tag_id) DO NOTHING
  `;

  // Update tag count
  await sql`
    UPDATE contact_tags
    SET contact_count = (
      SELECT COUNT(*) FROM contact_tag_assignments WHERE tag_id = contact_tags.id
    )
    WHERE slug = ${tagSlug}
  `;

  // Log activity
  await logContactActivity(contactId, 'tag_added', `Tag "${tagSlug}" added`, { tag: tagSlug });
}

export async function removeTagFromContact(contactId: number, tagSlug: string): Promise<void> {
  await sql`
    DELETE FROM contact_tag_assignments
    WHERE contact_id = ${contactId}
      AND tag_id = (SELECT id FROM contact_tags WHERE slug = ${tagSlug})
  `;

  // Update tag count
  await sql`
    UPDATE contact_tags
    SET contact_count = (
      SELECT COUNT(*) FROM contact_tag_assignments WHERE tag_id = contact_tags.id
    )
    WHERE slug = ${tagSlug}
  `;

  // Log activity
  await logContactActivity(contactId, 'tag_removed', `Tag "${tagSlug}" removed`, { tag: tagSlug });
}

// ============================================================================
// NOTES
// ============================================================================

export async function getContactNotes(contactId: number): Promise<ContactNote[]> {
  const notes = await sql`
    SELECT
      id,
      contact_id as "contactId",
      note,
      note_type as "noteType",
      created_by_user_id as "createdByUserId",
      created_by_name as "createdByName",
      is_pinned as "isPinned",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM contact_notes
    WHERE contact_id = ${contactId}
    ORDER BY is_pinned DESC, created_at DESC
  `;

  return notes as ContactNote[];
}

export async function addContactNote(
  contactId: number,
  note: string,
  noteType: ContactNote['noteType'] = 'general',
  createdByUserId?: number,
  createdByName?: string
): Promise<ContactNote> {
  const [result] = await sql`
    INSERT INTO contact_notes (contact_id, note, note_type, created_by_user_id, created_by_name)
    VALUES (${contactId}, ${note}, ${noteType}, ${createdByUserId || null}, ${createdByName || null})
    RETURNING
      id,
      contact_id as "contactId",
      note,
      note_type as "noteType",
      created_by_user_id as "createdByUserId",
      created_by_name as "createdByName",
      is_pinned as "isPinned",
      created_at as "createdAt",
      updated_at as "updatedAt"
  ` as ContactNote[];

  // Log activity
  await logContactActivity(contactId, 'note_added', 'Note added', { noteId: result.id });

  return result;
}

// ============================================================================
// ACTIVITY
// ============================================================================

export async function getContactActivity(
  contactId: number,
  limit: number = 50
): Promise<ContactActivity[]> {
  const activities = await sql`
    SELECT
      id,
      contact_id as "contactId",
      activity_type as "activityType",
      title,
      description,
      metadata,
      order_id as "orderId",
      email_id as "emailId",
      automation_id as "automationId",
      icon,
      created_at as "createdAt"
    FROM contact_activity
    WHERE contact_id = ${contactId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;

  return activities as ContactActivity[];
}

export async function logContactActivity(
  contactId: number,
  activityType: string,
  title: string,
  metadata: Record<string, unknown> = {},
  options: {
    description?: string;
    orderId?: number;
    emailId?: number;
    automationId?: number;
    icon?: string;
  } = {}
): Promise<void> {
  await sql`
    INSERT INTO contact_activity (
      contact_id,
      activity_type,
      title,
      description,
      metadata,
      order_id,
      email_id,
      automation_id,
      icon
    ) VALUES (
      ${contactId},
      ${activityType},
      ${title},
      ${options.description || null},
      ${JSON.stringify(metadata)},
      ${options.orderId || null},
      ${options.emailId || null},
      ${options.automationId || null},
      ${options.icon || null}
    )
  `;
}

// ============================================================================
// SYNC FROM ORDERS
// ============================================================================

export async function syncContactFromOrder(
  orderId: number,
  email: string,
  firstName?: string,
  lastName?: string,
  phone?: string
): Promise<Contact> {
  // Create or update contact
  const contact = await createContact({
    email,
    firstName,
    lastName,
    phone,
    source: 'checkout',
    sourceDetails: `Order #${orderId}`,
  });

  // Update metrics from orders
  await sql`
    UPDATE contacts
    SET
      lifetime_value = COALESCE((
        SELECT SUM(total_amount)
        FROM orders
        WHERE (user_id = contacts.user_id OR billing_email = contacts.email)
          AND payment_status = 'paid'
      ), 0),
      order_count = COALESCE((
        SELECT COUNT(*)
        FROM orders
        WHERE (user_id = contacts.user_id OR billing_email = contacts.email)
          AND payment_status = 'paid'
      ), 0),
      last_order_at = (
        SELECT MAX(created_at)
        FROM orders
        WHERE (user_id = contacts.user_id OR billing_email = contacts.email)
          AND payment_status = 'paid'
      ),
      first_order_at = COALESCE(first_order_at, (
        SELECT MIN(created_at)
        FROM orders
        WHERE (user_id = contacts.user_id OR billing_email = contacts.email)
          AND payment_status = 'paid'
      )),
      updated_at = NOW()
    WHERE id = ${contact.id}
  `;

  // Calculate average order value
  await sql`
    UPDATE contacts
    SET average_order_value = CASE
      WHEN order_count > 0 THEN lifetime_value / order_count
      ELSE 0
    END
    WHERE id = ${contact.id}
  `;

  // Log activity
  await logContactActivity(
    contact.id,
    'order_placed',
    `Order #${orderId} placed`,
    { orderId },
    { orderId, icon: 'shopping-bag' }
  );

  return getContactById(contact.id) as Promise<Contact>;
}
