import type {
  HDTicket,
  HDCommunication,
  HDArticle,
  CreateTicketData,
} from '@/types/frappe';

export interface ITicketService {
  getTickets(filters?: Record<string, unknown>): Promise<HDTicket[]>;
  getTicket(id: string): Promise<HDTicket>;
  createTicket(data: CreateTicketData): Promise<HDTicket>;
  updateTicket(id: string, data: Partial<HDTicket>): Promise<HDTicket>;
  searchTickets(query: string): Promise<HDTicket[]>;
  getTicketReplies(ticketId: string): Promise<HDCommunication[]>;
  addTicketReply(ticketId: string, content: string): Promise<HDCommunication>;
}

export interface IArticleService {
  getArticles(): Promise<HDArticle[]>;
  getArticle(id: string): Promise<HDArticle>;
  searchArticles(query: string): Promise<HDArticle[]>;
}

export interface IAuthService {
  login(email: string, password: string): Promise<unknown>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<string>;
  getUserDetails(email: string): Promise<unknown>;
  signUp(data: { email: string; full_name: string; password: string }): Promise<unknown>;
  resetPassword(email: string): Promise<unknown>;
  validateInviteToken(key: string): Promise<{ message: { valid: boolean; email?: string; first_name?: string; error?: string } }>;
  acceptInvite(data: { key: string; password: string; first_name: string; last_name?: string }): Promise<{ message: { success: boolean; email?: string; error?: string } }>;
}

// Centralized field lists — single source of truth
export const TICKET_FIELDS = [
  'name', 'subject', 'description', 'status', 'priority',
  'raised_by', 'creation', 'modified', 'owner', 'ticket_type',
] as const;

export const ARTICLE_FIELDS = [
  'name', 'title', 'content', 'status', 'category',
  'author', 'creation', 'modified', 'owner',
] as const;

export const REPLY_FIELDS = [
  'name', 'content', 'sender', 'sender_full_name', 'creation', 'modified',
  'communication_type', 'sent_or_received', 'subject', 'owner',
] as const;
