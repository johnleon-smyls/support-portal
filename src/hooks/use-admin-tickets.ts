'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminTicketService, type AdminTicketFilters } from '@/lib/services/admin-ticket-service';

export function useAdminTickets(filters?: AdminTicketFilters) {
  return useQuery({
    queryKey: ['admin-tickets', filters],
    queryFn: () => adminTicketService.getTickets(filters),
  });
}

export function useAdminTicket(id: string) {
  return useQuery({
    queryKey: ['admin-ticket', id],
    queryFn: () => adminTicketService.getTicket(id),
    enabled: !!id,
  });
}

export function useCustomers() {
  return useQuery({
    queryKey: ['hd-customers'],
    queryFn: () => adminTicketService.getCustomers(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAgents(enabled: boolean = true) {
  return useQuery({
    queryKey: ['hd-agents'],
    queryFn: () => adminTicketService.getAgents(),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

export function useReplyToCustomer(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => adminTicketService.replyToCustomer(ticketId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ticket', ticketId] });
    },
  });
}

export function useAddInternalNote(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => adminTicketService.addInternalNote(ticketId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ticket', ticketId] });
    },
  });
}

export function useUpdateTicket(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => adminTicketService.updateTicket(ticketId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
    },
  });
}

export function useAssignTicket(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (agentEmail: string) => adminTicketService.assignTicket(ticketId, agentEmail),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
    },
  });
}
