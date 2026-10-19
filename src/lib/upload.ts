export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export interface StagedUpload {
  id: string;
  originalName: string;
  ext: string;
  uploaderId: string;
  uploadedAt: string;
  status: 'STAGED';
}

export function validateUpload(file: File): string | undefined {
  if (!/\.(pdf|md|txt)$/i.test(file.name)) return 'Choose a .pdf, .md or .txt file.';
  if (!file.size) return 'The file is empty. Choose a nonempty file.';
  if (file.size > MAX_UPLOAD_BYTES) return 'The file exceeds the 5 MiB limit.';
}

function isStaged(value: unknown): value is StagedUpload {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;
  return typeof data.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.id)
    && typeof data.originalName === 'string' && data.originalName.length > 0
    && typeof data.ext === 'string' && /^\.(pdf|md|txt)$/i.test(data.ext)
    && typeof data.uploaderId === 'string'
    && typeof data.uploadedAt === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(data.uploadedAt)
    && Number.isFinite(Date.parse(data.uploadedAt)) && data.status === 'STAGED';
}

// Transport only: never starts ingestion or supplies an invented user identity.
export function uploadDocument(
  file: File,
  onProgress: (percent: number | undefined) => void,
  onWaiting: () => void,
): { result: Promise<StagedUpload>; abort: () => void } {
  const xhr = new XMLHttpRequest();
  const result = new Promise<StagedUpload>((resolve, reject) => {
    xhr.open('POST', '/api/upload');
    xhr.timeout = 120_000;
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(Math.min(100, Math.floor(event.loaded / event.total * 100)));
        if (event.loaded >= event.total) onWaiting();
      } else onProgress(undefined);
    };
    xhr.upload.onload = onWaiting;
    xhr.onerror = () => reject(new Error('Network error. Upload could not be confirmed.'));
    xhr.ontimeout = () => reject(new Error('The request timed out. Upload could not be confirmed.'));
    xhr.onabort = () => reject(new Error('The request was interrupted. Upload could not be confirmed.'));
    xhr.onload = () => {
      let data: unknown;
      try { data = JSON.parse(xhr.responseText); } catch { /* Handle proxy/invalid JSON below. */ }
      if (xhr.status >= 200 && xhr.status < 300) {
        if (isStaged(data)) resolve(data);
        else reject(new Error('The server returned an invalid confirmation. Upload could not be confirmed.'));
      } else if (xhr.status === 413) {
        reject(new Error('Server rejected the request as too large (413). Multipart overhead can make even a 5 MiB file exceed the server limit. Choose a smaller file.'));
      } else {
        const detail = data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
          ? ` ${data.error.slice(0, 300)}` : '';
        reject(new Error(`Upload failed (HTTP ${xhr.status}).${detail}`));
      }
    };
    const body = new FormData();
    body.append('file', file);
    xhr.send(body);
  });
  return { result, abort: () => xhr.abort() };
}
