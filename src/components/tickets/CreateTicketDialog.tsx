'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Loader2, Plus } from 'lucide-react';
import { useCreateTicket } from '@/hooks/use-tickets';
import { stripHtml } from '@/lib/format';
import { useAuth } from '@/lib/auth';
import { ScreenRecorder } from '@/components/screen-recorder/ScreenRecorder';
import { KBSuggestions } from '@/components/kb-suggestions/KBSuggestions';


interface TicketForm {
  subject: string;
  description: string;
  ticketType: string;
}

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTicketDialog({ open, onOpenChange }: CreateTicketDialogProps) {
  const { user } = useAuth();
  const createTicket = useCreateTicket();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [recordings, setRecordings] = useState<{ url: string; name: string }[]>([]);

  const { register, handleSubmit, control, formState: { errors }, setValue, watch, reset } = useForm<TicketForm>({
    defaultValues: {
      subject: '',
      description: '',
      ticketType: 'Support',
    },
  });

  const onSubmit = async (data: TicketForm) => {
    if (!stripHtml(data.description).trim()) {
      setSubmitError('Description is required');
      return;
    }

    setSubmitError(null);

    try {
      await createTicket.mutateAsync({
        subject: data.subject,
        description: data.description,
        ticket_type: data.ticketType || 'Support',
        raised_by: user?.email || '',
      });
      reset();
      setRecordings([]);
      onOpenChange(false);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create ticket.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Support Ticket</DialogTitle>
          <DialogDescription>
            Describe your issue and we&apos;ll get back to you as soon as possible
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {submitError && (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="ticketType">Ticket Type</Label>
            <Controller
              name="ticketType"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={createTicket.isPending}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Support">Support</SelectItem>
                    <SelectItem value="Bug">Bug</SelectItem>
                    <SelectItem value="Question">Question</SelectItem>
                    <SelectItem value="Feature Request">Feature Request</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">
              Subject <span className="text-destructive">*</span>
            </Label>
            <Input
              id="subject"
              placeholder="Brief description of your issue"
              disabled={createTicket.isPending}
              aria-invalid={!!errors.subject}
              {...register('subject', { required: 'Subject is required' })}
            />
            {errors.subject && (
              <p className="text-sm text-destructive">{errors.subject.message}</p>
            )}
          </div>

          <KBSuggestions query={watch('subject')} />

          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  content={field.value}
                  onChange={field.onChange}
                  placeholder="Provide detailed information about your issue."
                  disabled={createTicket.isPending}
                />
              )}
            />
            <p className="text-sm text-muted-foreground">
              Use the toolbar to format text, add images, links, and more
            </p>
          </div>

          <div className="space-y-2">
            <Label>Screen Recording</Label>
            <ScreenRecorder
              onRecordingReady={(url, name) => {
                setRecordings(prev => [...prev, { url, name }]);
                const current = watch('description');
                setValue('description', current + `<p><a href="${url}" target="_blank">Screen Recording: ${name}</a></p>`);
              }}
              disabled={createTicket.isPending}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={createTicket.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTicket.isPending}>
              {createTicket.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</>
              ) : (
                <><Plus className="mr-2 h-4 w-4" />Create Ticket</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
