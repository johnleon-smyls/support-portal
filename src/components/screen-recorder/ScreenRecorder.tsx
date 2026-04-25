'use client';

import { useState } from 'react';
import { Monitor, Square, Trash2, Upload, Loader2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useScreenRecorder } from '@/hooks/use-screen-recorder';
import { uploadFile, type UploadProgress } from '@/lib/services/file-service';

interface ScreenRecorderProps {
  /** Called when a recording is uploaded and ready to attach */
  onRecordingReady: (fileUrl: string, fileName: string) => void;
  /** Optional doctype/docname for linking the file in Frappe */
  doctype?: string;
  docname?: string;
  disabled?: boolean;
}

export function ScreenRecorder({ onRecordingReady, doctype, docname, disabled }: ScreenRecorderProps) {
  const {
    isRecording,
    duration,
    blob,
    previewUrl,
    error,
    startRecording,
    stopRecording,
    discardRecording,
    formatDuration,
  } = useScreenRecorder();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const handleUpload = async () => {
    if (!blob) return;

    // 100MB limit — Frappe defaults to 10MB but we'll configure higher for recordings
    const MAX_SIZE = 100 * 1024 * 1024;
    if (blob.size > MAX_SIZE) {
      setUploadError(`Recording is too large (${Math.round(blob.size / 1024 / 1024)}MB). Maximum is 100MB.`);
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `screen-recording-${timestamp}.webm`;

      const file = await uploadFile(blob, {
        filename,
        doctype,
        docname,
        isPrivate: false,
        onProgress: setUploadProgress,
      });

      // Prepend Frappe URL so the link resolves correctly from the portal
      const frappeUrl = process.env.NEXT_PUBLIC_FRAPPE_BASE_URL || '';
      const fullUrl = file.file_url.startsWith('http') ? file.file_url : `${frappeUrl}${file.file_url}`;
      onRecordingReady(fullUrl, filename);
      discardRecording();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  // Compact button when not recording and no preview
  if (!isRecording && !previewUrl) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={startRecording}
        disabled={disabled}
        className="gap-1.5"
      >
        <Monitor className="h-3.5 w-3.5" />
        Record Screen
      </Button>
    );
  }

  return (
    <Card className="border-dashed">
      <CardContent className="p-4">
        {/* Recording in progress */}
        {isRecording && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Circle className="h-3 w-3 text-status-red-500 fill-status-red-500 animate-pulse" />
              <span className="text-sm font-medium text-foreground">
                Recording — {formatDuration(duration)}
              </span>
            </div>
            <Button type="button" variant="destructive" size="sm" onClick={stopRecording}>
              <Square className="h-3 w-3 mr-1.5 fill-current" />
              Stop
            </Button>
          </div>
        )}

        {/* Preview */}
        {previewUrl && !isRecording && (
          <div className="space-y-3">
            <video
              src={previewUrl}
              controls
              className="w-full rounded-md border border-border max-h-64"
            />

            {(error || uploadError) && (
              <p className="text-sm text-destructive">{error || uploadError}</p>
            )}

            {isUploading && uploadProgress && (
              <div className="space-y-1">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${uploadProgress.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-right">
                  {uploadProgress.percentage}%
                </p>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              {confirmDiscard ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => { discardRecording(); setConfirmDiscard(false); }}
                  disabled={isUploading}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Confirm Discard
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDiscard(true)}
                  disabled={isUploading}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Discard
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                onClick={handleUpload}
                disabled={isUploading}
              >
                {isUploading ? (
                  <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Uploading...</>
                ) : (
                  <><Upload className="h-3.5 w-3.5 mr-1.5" />Attach Recording</>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
