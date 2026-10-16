'use client';

import { useEffect, useRef, useState } from 'react';
import { StagedUpload, uploadDocument, validateUpload } from '@/lib/upload';
import styles from './DocumentUpload.module.css';

type Row = {
  key: number;
  file: File;
  state: 'selected' | 'uploading' | 'waiting' | 'staged' | 'error';
  percent?: number;
  error?: string;
  metadata?: StagedUpload;
};

function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes.toLocaleString()} bytes`;
  return `${(bytes / (bytes < 1024 * 1024 ? 1024 : 1024 * 1024)).toLocaleString(undefined, { maximumFractionDigits: 1 })} ${bytes < 1024 * 1024 ? 'KiB' : 'MiB'}`;
}

function uploadedAt(timestamp: string) {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  }).format(new Date(timestamp));
}

export default function DocumentUpload() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const picker = useRef<HTMLInputElement>(null);
  const sequence = useRef(0);
  const active = useRef<(() => void) | null>(null);
  const busy = rows.some(row => row.state === 'uploading' || row.state === 'waiting');
  useEffect(() => () => { active.current?.(); }, []);

  function select(files: FileList | null) {
    setDragging(false);
    if (!files?.length) return;
    if (busy || active.current) { setError('Wait for the current upload to finish before choosing another file.'); return; }
    if (files.length !== 1) { setError('Choose one file at a time. You can upload another afterwards.'); return; }
    const file = files[0];
    const validation = validateUpload(file);
    if (validation) { setError(validation); return; }
    setError('');
    setRows(previous => [...previous.filter(row => row.state !== 'selected'), { key: ++sequence.current, file, state: 'selected' }]);
  }

  async function send(row: Row) {
    if (active.current) return;
    const update = (patch: Partial<Row>) => setRows(previous => previous.map(item => item.key === row.key ? { ...item, ...patch } : item));
    update({ state: 'uploading', percent: undefined, error: undefined });
    try {
      const request = uploadDocument(row.file, percent => update({ percent }), () => update({ state: 'waiting' }));
      active.current = request.abort;
      const metadata = await request.result;
      update({ state: 'staged', metadata });
    } catch (failure) {
      update({ state: 'error', error: failure instanceof Error ? failure.message : 'Upload could not be confirmed.' });
    } finally { active.current = null; }
  }

  function remove(row: Row) {
    setRows(previous => previous.filter(item => item.key !== row.key));
    setAnnouncement(`${row.file.name} removed from this visit's list. No server file was deleted.`);
    picker.current?.focus();
  }

  return (
    <details className={styles.section}>
      <summary>Upload documents</summary>
      <div className={styles.content}>
        <p id="upload-rules">One PDF, Markdown or text file at a time, up to 5 MiB. Saved files await separate processing and are not yet available to Zoe. Files near the limit may be rejected by the server.</p>
        <div className={`${styles.dropzone} ${dragging && !busy ? styles.dragging : ''} ${busy ? styles.busy : ''}`}
          onDragOver={event => { event.preventDefault(); setDragging(true); }}
          onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }}
          onDrop={event => { event.preventDefault(); select(event.dataTransfer.files); }}>
          <label htmlFor="document-file">{busy ? 'Upload in progress — file selection paused' : 'Choose a document or drop it here'}</label>
          <input ref={picker} id="document-file" type="file" accept=".pdf,.md,.txt" disabled={busy}
            aria-describedby="upload-rules upload-error" aria-invalid={!!error}
            onChange={event => { select(event.currentTarget.files); event.currentTarget.value = ''; }} />
        </div>
        <p id="upload-error" role="alert" className={styles.validation}>{error}</p>
        <h3>Uploads this visit</h3>
        <p id="upload-list-help" className={styles.listHelp}>This list clears when you leave or reload. “Remove from list” only hides an entry here; it does not delete a file from the server.</p>
        <p role="status" className={styles.srOnly}>{announcement}</p>
        {rows.length === 0 && <p className={styles.empty}>No documents selected yet.</p>}
        <ul className={styles.list}>
          {rows.map(row => (
            <li key={row.key} className={`${styles.row} ${row.state === 'staged' ? styles.success : row.state === 'error' ? styles.failure : ''}`}>
              <div className={styles.fileHeader}>
                <svg className={styles.fileIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" focusable="false">
                  <path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8l-5-5Z" /><path d="M14 3v5h5M8 12h8M8 16h6" />
                </svg>
                <div className={styles.fileInfo}>
                  <strong className={styles.filename}>{row.file.name}</strong>
                  <span className={styles.fileDetails} title={`${row.file.size.toLocaleString()} bytes`}>
                    {({ pdf: 'PDF', md: 'Markdown', txt: 'Text' } as Record<string, string>)[row.file.name.split('.').pop()?.toLowerCase() || '']} · {fileSize(row.file.size)}
                  </span>
                  {row.metadata && <p className={styles.timestamp}>Uploaded at <time dateTime={row.metadata.uploadedAt}>{uploadedAt(row.metadata.uploadedAt)}</time></p>}
                </div>
              </div>
              <div className={styles.status} role="status" aria-live="polite" aria-atomic="true">
                <span className={styles.srOnly}>{row.file.name}: </span>
                {(row.state === 'uploading' || row.state === 'waiting') && <span className={styles.spinner} aria-hidden="true" />}
                {row.state === 'staged' && <span className={styles.statusIcon} aria-hidden="true">✓</span>}
                {row.state === 'error' && <span className={styles.statusIcon} aria-hidden="true">!</span>}
                <span>
                {row.state === 'selected' && 'Selected — ready to upload'}
                {row.state === 'uploading' && `Uploading${row.percent === undefined ? '…' : ` — ${row.percent}% transferred`}`}
                {row.state === 'waiting' && 'Waiting for server confirmation…'}
                {row.state === 'staged' && 'File saved — awaiting processing'}
                {row.state === 'error' && <>Upload not confirmed. {row.error} Before retrying, check with the service owner: the file may already be stored and retrying could create a duplicate.</>}
                </span>
              </div>
              {(row.state === 'uploading' || row.state === 'waiting') && <progress aria-label={`${row.file.name}: ${row.state === 'waiting' ? 'waiting for server confirmation' : 'transfer progress'}`} max={100} value={row.state === 'uploading' ? row.percent : undefined} />}
              <div className={styles.actions}>
                {(row.state === 'selected' || row.state === 'error') && <button type="button" disabled={busy} onClick={() => void send(row)} aria-label={`${row.state === 'error' ? 'Retry upload (may duplicate)' : 'Upload'} ${row.file.name}`}>{row.state === 'error' ? 'Retry upload (may duplicate)' : 'Upload'}</button>}
                {(row.state === 'selected' || row.state === 'error' || row.state === 'staged') && <button className={styles.remove} type="button" disabled={busy} onClick={() => remove(row)} aria-label={`Remove ${row.file.name} from list`} aria-describedby="upload-list-help">Remove from list</button>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
