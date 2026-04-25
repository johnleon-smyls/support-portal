import type { HDTicket, HDCommunication, CreateTicketData } from '@/types/frappe';
import type { ITicketService } from './types';
import { DEMO_TICKETS, DEMO_REPLIES } from '@/lib/demo-data';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// In-memory session state
const sessionTickets = [...DEMO_TICKETS];
const sessionReplies: Record<string, HDCommunication[]> = JSON.parse(
  JSON.stringify(DEMO_REPLIES)
);

export class DemoTicketService implements ITicketService {
  async getTickets(): Promise<HDTicket[]> {
    await delay(200);
    return sessionTickets;
  }

  async getTicket(id: string): Promise<HDTicket> {
    await delay(150);
    const ticket = sessionTickets.find((t) => t.name === id);
    if (!ticket) throw new Error('Ticket not found');
    return ticket;
  }

  async createTicket(data: CreateTicketData): Promise<HDTicket> {
    await delay(300);
    const ticket: HDTicket = {
      name: `TKT-${Date.now()}`,
      subject: data.subject,
      description: data.description,
      status: 'Open',
      priority: data.priority || 'Medium',
      ticket_type: data.ticket_type || 'Question',
      raised_by: data.raised_by || 'demo@example.com',
      owner: data.raised_by || 'demo@example.com',
      creation: new Date().toISOString(),
      modified: new Date().toISOString(),
    };
    sessionTickets.unshift(ticket);
    return ticket;
  }

  async updateTicket(id: string, data: Partial<HDTicket>): Promise<HDTicket> {
    await delay(200);
    const idx = sessionTickets.findIndex((t) => t.name === id);
    if (idx === -1) throw new Error('Ticket not found');
    sessionTickets[idx] = { ...sessionTickets[idx], ...data };
    return sessionTickets[idx];
  }

  async searchTickets(query: string): Promise<HDTicket[]> {
    await delay(200);
    const q = query.toLowerCase();
    return sessionTickets.filter(
      (t) =>
        t.subject.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
    );
  }

  async getTicketReplies(ticketId: string): Promise<HDCommunication[]> {
    await delay(150);
    return sessionReplies[ticketId] || [];
  }

  async addTicketReply(ticketId: string, content: string): Promise<HDCommunication> {
    await delay(300);
    const reply: HDCommunication = {
      name: `REPLY-${Date.now()}`,
      content,
      sender: 'demo@example.com',
      communication_type: 'Communication',
      sent_or_received: 'Received',
      reference_doctype: 'HD Ticket',
      reference_name: ticketId,
      owner: 'demo@example.com',
      creation: new Date().toISOString(),
      modified: new Date().toISOString(),
    };
    if (!sessionReplies[ticketId]) sessionReplies[ticketId] = [];
    sessionReplies[ticketId].push(reply);
    return reply;
  }
}
