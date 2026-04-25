// === FRAPPE TYPE DEFINITIONS ===
// Shared TypeScript interfaces for Frappe Helpdesk doctypes (HD Ticket, HD Article, etc.)
// and API response wrappers used across the portal.

// Frappe API response wrapper
export interface FrappeResponse<T> {
  data: T[];
}

export interface FrappeDoc {
  name: string;
  creation: string;
  modified: string;
  modified_by?: string;
  owner: string;
  docstatus?: number;
}

// === HD TICKET (FR-04: Ticket Creation, FR-08: Ticket Details View) ===
export interface HDTicket extends FrappeDoc {
  subject: string;
  description: string;
  status: 'Open' | 'Replied' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  ticket_type?: string;
  customer?: string;
  contact?: string;
  raised_by: string;
  assigned_to?: string;
  resolution?: string;
  first_response_time?: string;
  first_responded_on?: string;
  resolution_time?: string;
  resolution_date?: string;
  feedback_rating?: number;
  feedback_text?: string;
  template?: string;
  custom_fields?: Record<string, unknown>;
}

export interface CreateTicketData {
  subject: string;
  description: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  ticket_type?: string;
  raised_by?: string;
}

// === COMMUNICATION (Ticket Replies — via Frappe Communication doctype) ===
export interface HDCommunication extends FrappeDoc {
  content: string;
  sender: string;
  sender_full_name?: string;
  recipients?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  communication_type: 'Communication' | 'Comment' | 'Automated Message';
  communication_medium?: 'Email' | 'Chat' | 'Phone' | 'SMS' | 'Other';
  sent_or_received: 'Sent' | 'Received';
  reference_doctype?: string;
  reference_name?: string;
}

// === HD TICKET COMMENT (Internal agent comments only) ===
export interface HDTicketComment extends FrappeDoc {
  content: string;
  commented_by: string;
  reference_ticket: string;
  is_pinned?: number;
}

// === HD ARTICLE (FR-10: Knowledge Base Browsing, FR-12: Article Detail View) ===
export interface HDArticle extends FrappeDoc {
  title: string;
  content: string;
  category?: string;
  author?: string;
  status: 'Draft' | 'Published' | 'Archived';
  is_public?: boolean;
  helpful_count?: number;
  not_helpful_count?: number;
  views?: number;
  tags?: string;
  meta_title?: string;
  meta_description?: string;
  route?: string;
}

// User types
export interface FrappeUserDoc extends FrappeDoc {
  email: string;
  first_name: string;
  last_name?: string;
  full_name: string;
  username?: string;
  user_image?: string;
  mobile_no?: string;
  phone?: string;
  location?: string;
  bio?: string;
  interest?: string;
  enabled: boolean;
  user_type: 'System User' | 'Website User';
  roles?: UserRole[];
}

export interface UserRole {
  role: string;
  parent: string;
}

// Signup data
export interface SignUpData {
  email: string;
  full_name: string;
  password: string;
  user_type?: 'Website User';
}

// API filter types
export interface FrappeFilter {
  [key: string]: unknown[] | string | number | boolean;
}

export interface FrappeListOptions {
  filters?: FrappeFilter;
  fields?: string[];
  order_by?: string;
  limit?: number;
  limit_start?: number;
}

// Ticket status colors and labels
export const TICKET_STATUS_CONFIG = {
  'Open': { color: 'blue', label: 'Open' },
  'Replied': { color: 'cyan', label: 'Replied' },
  'Resolved': { color: 'green', label: 'Resolved' },
  'Closed': { color: 'gray', label: 'Closed' },
} as const;

export const TICKET_PRIORITY_CONFIG = {
  'Low': { color: 'green', label: 'Low' },
  'Medium': { color: 'yellow', label: 'Medium' },
  'High': { color: 'orange', label: 'High' },
  'Urgent': { color: 'red', label: 'Urgent' },
} as const;