'use client';

import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

interface CategorySuggestion {
  ticket_type: string;
  priority: string;
  confidence: number;
  reasoning: string;
}

interface ReplySuggestion {
  label: string;
  content: string;
}

export function useAICategorize() {
  return useMutation({
    mutationFn: async ({ subject, description }: { subject: string; description: string }) => {
      const response = await apiClient.get('/method/support_desk.api.ai.categorize', {
        params: { subject, description },
      });
      return (response as { message: CategorySuggestion }).message;
    },
  });
}

export function useAISuggestReply() {
  return useMutation({
    mutationFn: async (ticketName: string) => {
      const response = await apiClient.get('/method/support_desk.api.ai.suggest_reply', {
        params: { ticket_name: ticketName },
      });
      return ((response as { message: ReplySuggestion[] }).message) || [];
    },
  });
}

export function useAISummarize() {
  return useMutation({
    mutationFn: async (ticketName: string) => {
      const response = await apiClient.get('/method/support_desk.api.ai.summarize', {
        params: { ticket_name: ticketName },
      });
      return ((response as { message: string }).message) || '';
    },
  });
}
