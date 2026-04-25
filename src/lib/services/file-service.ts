import axios from 'axios';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface FrappeFile {
  name: string;
  file_name: string;
  file_url: string;
  file_size: number;
}

/**
 * Upload a file to Frappe via the upload_file method.
 * Uses a separate axios instance because the main apiClient
 * hardcodes Content-Type to JSON — file uploads need multipart/form-data.
 */
export async function uploadFile(
  file: File | Blob,
  options: {
    filename?: string;
    doctype?: string;
    docname?: string;
    isPrivate?: boolean;
    onProgress?: (progress: UploadProgress) => void;
  } = {}
): Promise<FrappeFile> {
  const formData = new FormData();
  const filename = options.filename || (file instanceof File ? file.name : 'recording.webm');
  formData.append('file', file, filename);
  formData.append('is_private', options.isPrivate ? '1' : '0');

  if (options.doctype) formData.append('doctype', options.doctype);
  if (options.docname) formData.append('docname', options.docname);

  const response = await axios.post('/api/frappe/method/upload_file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    withCredentials: true,
    onUploadProgress: (event) => {
      if (options.onProgress && event.total) {
        options.onProgress({
          loaded: event.loaded,
          total: event.total,
          percentage: Math.round((event.loaded / event.total) * 100),
        });
      }
    },
  });

  return response.data?.message?.file_url
    ? response.data.message
    : response.data;
}
