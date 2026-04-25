import { apiClient } from '@/lib/api';
import type { HDTicket, HDCommunication, FrappeResponse } from '@/types/frappe';

const ADMIN_TICKET_FIELDS = [
  'name', 'subject', 'description', 'status', 'priority',
  'customer', 'raised_by', 'contact', 'creation', 'modified',
  'owner', 'ticket_type', '_assign',
] as const;

export interface AdminTicketFilters {
  status?: string;
  priority?: string;
  customer?: string;
  page?: number;
  pageSize?: number;
}

export interface HDCustomer {
  name: string;
  customer_name: string;
}

export interface HDAgent {
  name: string;
  agent_name: string;
  user: string;
}

export class AdminTicketService {
  async getTickets(filters?: AdminTicketFilters): Promise<{ data: HDTicket[]; total: number }> {
    const frappeFilters: [string, string, string][] = [];
    if (filters?.status && filters.status !== 'All') {
      frappeFilters.push(['status', '=', filters.status]);
    }
    if (filters?.priority && filters.priority !== 'All') {
      frappeFilters.push(['priority', '=', filters.priority]);
    }
    if (filters?.customer && filters.customer !== 'All') {
      frappeFilters.push(['customer', '=', filters.customer]);
    }

    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;

    const [listResponse, countResponse] = await Promise.all([
      apiClient.get<FrappeResponse<HDTicket>>('/resource/HD Ticket', {
        params: {
          fields: JSON.stringify(ADMIN_TICKET_FIELDS),
          filters: JSON.stringify(frappeFilters),
          order_by: 'modified desc',
          limit_page_length: pageSize,
          limit_start: (page - 1) * pageSize,
        },
      }),
      apiClient.get<{ message: number }>('/method/frappe.client.get_count', {
        params: {
          doctype: 'HD Ticket',
          filters: JSON.stringify(frappeFilters),
        },
      }),
    ]);

    return {
      data: listResponse.data,
      total: (countResponse as { message?: number })?.message || 0,
    };
  }

  async getTicket(id: string): Promise<Record<string, unknown>> {
    const response = await apiClient.get<{ message: Record<string, unknown> }>(
      '/method/helpdesk.helpdesk.doctype.hd_ticket.api.get_one',
      { params: { name: id } }
    );
    return response.message;
  }

  async updateTicket(id: string, data: Partial<HDTicket>): Promise<HDTicket> {
    const response = await apiClient.put<{ data: HDTicket }>(`/resource/HD Ticket/${id}`, data);
    return response.data;
  }

  async replyToCustomer(ticketId: string, message: string): Promise<void> {
    await apiClient.post('/method/run_doc_method', {
      dt: 'HD Ticket',
      dn: ticketId,
      method: 'reply_via_agent',
      args: JSON.stringify({ message }),
    });
  }

  async addInternalNote(ticketId: string, content: string): Promise<void> {
    await apiClient.post('/method/run_doc_method', {
      dt: 'HD Ticket',
      dn: ticketId,
      method: 'new_comment',
      args: JSON.stringify({ content }),
    });
  }

  async getCustomers(): Promise<HDCustomer[]> {
    const response = await apiClient.get<FrappeResponse<HDCustomer>>('/resource/HD Customer', {
      params: {
        fields: JSON.stringify(['name', 'customer_name']),
        limit_page_length: 0,
      },
    });
    return response.data;
  }

  async getAgents(): Promise<HDAgent[]> {
    const response = await apiClient.get<FrappeResponse<HDAgent>>('/resource/HD Agent', {
      params: {
        fields: JSON.stringify(['name', 'agent_name', 'user']),
        limit_page_length: 0,
      },
    });
    return response.data;
  }

  async assignTicket(ticketId: string, agentEmail: string): Promise<void> {
    await apiClient.post('/method/frappe.desk.form.utils.assign_to.add', {
      doctype: 'HD Ticket',
      name: ticketId,
      assign_to: [agentEmail],
    });
  }
}

export const adminTicketService = new AdminTicketService();
