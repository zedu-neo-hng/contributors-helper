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

export default function DocumentUpload() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
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

  return (
    <details className={styles.section}>
      <summary>Upload documents</summary>
      <div className={styles.content}>
        <p id="upload-rules">One .pdf, .md or .txt file at a time, up to 5 MiB. Uploads await separate ingestion and are not yet available to chat. Files near the limit may be rejected by the server.</p>
        <div className={`${styles.dropzone} ${dragging ? styles.dragging : ''}`}
          onDragOver={event => { event.preventDefault(); setDragging(true); }}
          onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }}
          onDrop={event => { event.preventDefault(); select(event.dataTransfer.files); }}>
          <label htmlFor="document-file">Choose a document or drop it here</label>
          <input id="document-file" type="file" accept=".pdf,.md,.txt" disabled={busy}
            aria-describedby="upload-rules upload-error" aria-invalid={!!error}
            onChange={event => { select(event.currentTarget.files); event.currentTarget.value = ''; }} />
        </div>
        <p id="upload-error" role="alert" className={styles.error}>{error}</p>
        <h3>Uploads this visit</h3>
        <p>This list is local to this page visit and clears when you leave or reload.</p>
        {rows.length === 0 && <p>No documents selected yet.</p>}
        <ul className={styles.list}>
          {rows.map(row => (
            <li key={row.key} className={styles.row}>
              <strong>{row.file.name}</strong> <span>({row.file.size.toLocaleString()} bytes)</span>
              <div role="status" aria-live="polite">
                {row.state === 'selected' && 'Selected — ready to upload'}
                {row.state === 'uploading' && `Uploading${row.percent === undefined ? '…' : ` — ${row.percent}% transferred`}`}
                {row.state === 'waiting' && 'Waiting for server confirmation…'}
                {row.state === 'staged' && 'Uploaded — awaiting ingestion'}
                {row.state === 'error' && <span className={styles.error}>{row.error} Before retrying, check with the service owner: the file may already be stored and retrying could create a duplicate.</span>}
              </div>
              {(row.state === 'uploading' || row.state === 'waiting') && <progress aria-label={`${row.file.name}: ${row.state === 'waiting' ? 'waiting for server confirmation' : 'transfer progress'}`} max={100} value={row.state === 'uploading' ? row.percent : undefined} />}
              {row.metadata && <p>ID: {row.metadata.id}<br />Confirmed: <time dateTime={row.metadata.uploadedAt}>{row.metadata.uploadedAt}</time></p>}
              <div className={styles.actions}>
                {(row.state === 'selected' || row.state === 'error') && <button type="button" disabled={busy} onClick={() => void send(row)} aria-label={`${row.state === 'error' ? 'Retry upload (may duplicate)' : 'Upload'} ${row.file.name}`}>{row.state === 'error' ? 'Retry upload (may duplicate)' : 'Upload'}</button>}
                {(row.state === 'selected' || row.state === 'error') && <button type="button" onClick={() => setRows(previous => previous.filter(item => item.key !== row.key))} aria-label={`Remove ${row.file.name} from local list`}>Remove from local list</button>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
