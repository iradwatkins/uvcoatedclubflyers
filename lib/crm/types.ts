// CRM Types

export interface Contact {
  id: number;
  userId: number | null;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  company: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string;
  customFields: Record<string, unknown>;
  lifetimeValue: number;
  orderCount: number;
  lastOrderAt: Date | null;
  firstOrderAt: Date | null;
  averageOrderValue: number;
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  lastEmailSentAt: Date | null;
  lastEmailOpenedAt: Date | null;
  status: ContactStatus;
  emailSubscribed: boolean;
  smsSubscribed: boolean;
  source: string | null;
  sourceDetails: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  createdAt: Date;
  updatedAt: Date;
  tags?: ContactTag[];
}

export type ContactStatus = 'active' | 'lead' | 'inactive' | 'unsubscribed' | 'bounced' | 'spam_complaint';

export interface ContactTag {
  id: number;
  name: string;
  slug: string;
  color: string;
  description: string | null;
  autoRules: Record<string, unknown> | null;
  contactCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactNote {
  id: number;
  contactId: number;
  note: string;
  noteType: 'general' | 'support' | 'sales' | 'complaint';
  createdByUserId: number | null;
  createdByName: string | null;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactActivity {
  id: number;
  contactId: number;
  activityType: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
  orderId: number | null;
  emailId: number | null;
  automationId: number | null;
  icon: string | null;
  createdAt: Date;
}

export interface AutomationEvent {
  id: number;
  eventType: string;
  name: string;
  description: string | null;
  isActive: boolean;
  conditions: Record<string, unknown>;
  actions: AutomationAction[];
  timesTriggered: number;
  lastTriggeredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AutomationAction {
  type: 'send_email' | 'add_tag' | 'remove_tag' | 'send_sms' | 'webhook';
  template?: string;
  tag?: string;
  delayHours?: number;
  webhookUrl?: string;
  data?: Record<string, unknown>;
}

export interface AutomationQueueItem {
  id: number;
  automationEventId: number | null;
  contactId: number;
  actionType: string;
  actionData: Record<string, unknown>;
  scheduledFor: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  attempts: number;
  maxAttempts: number;
  lastAttemptAt: Date | null;
  completedAt: Date | null;
  errorMessage: string | null;
  triggerEvent: string | null;
  triggerData: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ContactStatus | 'all';
  tags?: string[];
  sortBy?: 'created_at' | 'lifetime_value' | 'last_order_at' | 'order_count';
  sortOrder?: 'asc' | 'desc';
}

export interface ContactStats {
  total: number;
  active: number;
  unsubscribed: number;
  totalLifetimeValue: number;
  averageLifetimeValue: number;
  totalOrders: number;
  withOrders: number;
  withoutOrders: number;
  newThisMonth: number;
}
