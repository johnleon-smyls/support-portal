// Mock API client for demo/presentation mode.
// Implements the same interface as FrappeAPIClient but returns dummy data.

import {
  DEMO_USER,
  DEMO_TICKETS,
  DEMO_REPLIES,
  DEMO_ARTICLES,
} from './demo-data';
import { HDTicket, HDCommunication } from '@/types/frappe';

// In-memory stores so creates/replies persist during the session
let sessionTickets = [...DEMO_TICKETS];
const sessionReplies: Record<string, HDCommunication[]> = JSON.parse(
  JSON.stringify(DEMO_REPLIES)
);

function delay(ms = 300) {
  return new Promise((r) => setTimeout(r, ms));
}

export class DemoAPIClient {
  // Auth
  async login(_usr: string, _pwd: string) {
    await delay(400);
    return { full_name: DEMO_USER.full_name, message: 'Logged In' };
  }

  async logout() {
    await delay(100);
    return { message: 'Logged Out' };
  }

  async getCurrentUser() {
    await delay(100);
    return { message: DEMO_USER.email };
  }

  async getUserDetails(_email: string) {
    await delay(100);
    return {
      message: {
        name: DEMO_USER.name,
        full_name: DEMO_USER.full_name,
        first_name: DEMO_USER.first_name,
        last_name: DEMO_USER.last_name,
        email: DEMO_USER.email,
        enabled: 1,
        user_type: DEMO_USER.user_type,
      },
    };
  }

  // Tickets
  async getTickets(_filters?: Record<string, unknown>) {
    await delay(350);
    return { data: sessionTickets };
  }

  async getTicket(ticketId: string) {
    await delay(250);
    const ticket = sessionTickets.find((t) => t.name === ticketId);
    if (!ticket) throw { status: 404, message: 'Ticket not found' };
    return { data: ticket };
  }

  async createTicket(ticketData: Record<string, unknown>) {
    await delay(400);
    const newTicket: HDTicket = {
      name: `TKT-${Date.now()}`,
      subject: (ticketData.subject as string) || 'New Ticket',
      description: (ticketData.description as string) || '',
      status: 'Open',
      priority: (ticketData.priority as HDTicket['priority']) || 'Medium',
      ticket_type: (ticketData.ticket_type as string) || 'Support',
      raised_by: DEMO_USER.email,
      creation: new Date().toISOString(),
      modified: new Date().toISOString(),
      owner: DEMO_USER.email,
    };
    sessionTickets = [newTicket, ...sessionTickets];
    return { data: newTicket };
  }

  async updateTicket(ticketId: string, ticketData: Record<string, unknown>) {
    await delay(300);
    sessionTickets = sessionTickets.map((t) =>
      t.name === ticketId ? { ...t, ...ticketData, modified: new Date().toISOString() } as HDTicket : t
    );
    const updated = sessionTickets.find((t) => t.name === ticketId);
    return { data: updated };
  }

  // Replies
  async getTicketReplies(ticketId: string) {
    await delay(250);
    return { data: sessionReplies[ticketId] || [] };
  }

  async addTicketReply(ticketId: string, content: string, sender?: string) {
    await delay(350);
    const reply: HDCommunication = {
      name: `REPLY-${Date.now()}`,
      content,
      sender: sender || DEMO_USER.email,
      sender_full_name: DEMO_USER.full_name,
      communication_type: 'Communication',
      sent_or_received: 'Received',
      reference_doctype: 'HD Ticket',
      reference_name: ticketId,
      creation: new Date().toISOString(),
      modified: new Date().toISOString(),
      owner: sender || DEMO_USER.email,
    };
    if (!sessionReplies[ticketId]) sessionReplies[ticketId] = [];
    sessionReplies[ticketId].push(reply);
    return { data: reply };
  }

  // Knowledge Base
  async getArticles() {
    await delay(300);
    return { data: DEMO_ARTICLES };
  }

  async getArticle(articleId: string) {
    await delay(200);
    const article = DEMO_ARTICLES.find((a) => a.name === articleId);
    if (!article) throw { status: 404, message: 'Article not found' };
    return { data: article };
  }

  // Search
  async searchTickets(query: string) {
    await delay(300);
    const q = query.toLowerCase();
    const results = sessionTickets.filter(
      (t) =>
        t.subject.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
    );
    return { data: results };
  }

  async searchArticles(query: string) {
    await delay(300);
    const q = query.toLowerCase();
    const results = DEMO_ARTICLES.filter(
      (a) =>
        a.status === 'Published' &&
        (a.title.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q))
    );
    return { data: results };
  }

  // Password reset
  async resetPassword(_email: string) {
    await delay(500);
    return { message: 'Password reset link sent' };
  }

  // User management (no-ops in demo)
  async signUp(_userData: { email: string; full_name: string; password: string }) {
    await delay(300);
    return { message: 'Demo: Sign up successful' };
  }

  async assignRole(_user: string, _role: string) {
    await delay(100);
    return { data: {} };
  }

  // Invite system (no-ops in demo)
  async validateInviteToken(_key: string) {
    await delay(200);
    return { message: { valid: true, email: 'invited@demo.com', first_name: 'Demo' } };
  }

  async acceptInvite(_data: { key: string; password: string; first_name: string; last_name?: string }) {
    await delay(300);
    return { message: { success: true, email: 'invited@demo.com' } };
  }

  // Generic methods (for any direct calls)
  async get<T>(url: string, _config?: unknown): Promise<T> {
    await delay(200);
    return { data: [] } as T;
  }

  async post<T>(url: string, _data?: unknown, _config?: unknown): Promise<T> {
    await delay(200);

    if (url.includes('login')) return this.login('', '') as T;
    if (url.includes('logout')) return this.logout() as T;

    return { data: {} } as T;
  }

  async put<T>(_url: string, _data?: unknown, _config?: unknown): Promise<T> {
    await delay(200);
    return { data: {} } as T;
  }

  async delete<T>(_url: string, _config?: unknown): Promise<T> {
    await delay(200);
    return { data: {} } as T;
  }
}
