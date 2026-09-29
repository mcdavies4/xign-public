'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Brand from '@/components/Brand';

type Req = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  token: string;
};

type SignedDoc = { doc_type: string; url: string | null };

export default function DocumentsAdminPage() {
  const router = useRouter();
  const supabase = createClient();
  const [rows, setRows] = useState<Req[]>([]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [newLink, setNewLink] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [rowMsg, setRowMsg] = useState<{ id: string; text: string; ok: boolean } | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [viewingDocs, setViewingDocs] = useState<SignedDoc[]>([]);

  const load = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return router.push('/login');

    const { data, error } = await supabase
      .from('kyc_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    setRows(data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const addRequest = async () => {
    setError(null);
    setGenerating(true);
    setCopied(false);
    const res = await fetch('/api/kyc', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName || null, email: email || null, phone: phone || null }),
    });
    const data = await res.json();
    setGenerating(false);
    if (!res.ok) {
      setError(data.error || 'Failed to generate link');
      return;
    }
    setNewLink(data.link);
    setEmailSent(data.emailSent);
    setFullName('');
    setEmail('');
    setPhone('');
    load();
  };

  const copyLink = async () => {
    if (!newLink) return;
    try {
      await navigator.clipboard.writeText(newLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const deleteRequest = async (id: string) => {
    if (!confirm('Delete this request and its uploaded files? This cannot be undone.')) return;
    setRowBusy(id);
    const res = await fetch(`/api/kyc/${id}`, { method: 'DELETE' });
    setRowBusy(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setRowMsg({ id, text: data.error || 'Failed to delete', ok: false });
      return;
    }
    load();
  };

  const resendEmail = async (id: string) => {
    setRowBusy(id);
    setRowMsg(null);
    const res = await fetch(`/api/kyc/${id}`, { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    setRowBusy(null);
    setRowMsg({ id, text: res.ok ? 'Email resent' : data.error || 'Failed to resend', ok: res.ok });
    setTimeout(() => setRowMsg(null), 3000);
  };

  const viewDocuments = async (id: string) => {
    setViewingId(id);
    setViewingDocs([]);
    const res = await fetch(`/api/kyc/${id}`);
    if (res.ok) {
      const data = await res.json();
      setViewingDocs(data.documents || []);
    }
  };

  return (
    <div className="wrap">
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; overflow-x: hidden; }
        html { overflow-x: hidden; }
        .wrap {
          overflow-x: hidden;
          max-width: 720px;
          margin: 0 auto;
          padding: max(20px, env(safe-area-inset-top)) 16px calc(60px + env(safe-area-inset-bottom));
          font-family: system-ui, -apple-system, sans-serif;
        }
        .top-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }
        .nav-link { font-size: 13px; color: #666; text-decoration: none; }
        h1 { font-size: 18px; color: #555; margin: 0 0 16px; }
        .form-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
        .form-row input {
          flex: 1 1 140px;
          min-width: 0;
          padding: 12px;
          font-size: 16px;
          border: 1px solid #ccc;
          border-radius: 8px;
        }
        .form-row button {
          flex: 1 1 100%;
          padding: 14px;
          font-size: 16px;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          background: #111;
          color: #fff;
          cursor: pointer;
        }
        .form-row button:disabled { background: #999; cursor: not-allowed; }
        @media (min-width: 480px) {
          .form-row button { flex: 0 0 auto; padding: 12px 20px; }
        }
        .banner { padding: 12px; border-radius: 8px; font-size: 14px; margin-bottom: 16px; word-break: break-word; }
        .banner.error { background: #fdecea; color: #a30000; }
        .banner.success { background: #eef9ee; }
        .link-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .link-row a { word-break: break-all; }
        .copy-btn { padding: 6px 12px; font-size: 13px; border: 1px solid #ccc; border-radius: 6px; background: #fff; cursor: pointer; white-space: nowrap; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px 10px; text-align: left; font-size: 14px; }
        thead tr { border-bottom: 1px solid #ddd; }
        tbody tr { border-bottom: 1px solid #eee; }
        .status-pill { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 600; }
        .status-pill.submitted { background: #e6f7e6; color: #1a7a1a; }
        .status-pill.pending { background: #fff4e0; color: #a35b00; }
        .row-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
        .row-btn { padding: 5px 10px; font-size: 12px; border: 1px solid #ccc; border-radius: 6px; background: #fff; cursor: pointer; white-space: nowrap; }
        .row-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .row-btn.danger { border-color: #f0c0c0; color: #a30000; }
        .row-msg { font-size: 12px; }
        .row-msg.ok { color: #1a7a1a; }
        .row-msg.err { color: #a30000; }
        .doc-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.75);
          display: flex; align-items: center; justify-content: center; z-index: 50; padding: 20px;
        }
        .doc-panel { background: #fff; border-radius: 10px; padding: 20px; max-width: 420px; width: 100%; max-height: 80vh; overflow-y: auto; }
        .doc-panel h3 { margin: 0 0 4px; font-size: 15px; }
        .doc-panel .note { font-size: 12px; color: #999; margin-bottom: 14px; }
        .doc-item { margin-bottom: 14px; }
        .doc-item .label { font-size: 12px; font-weight: 600; color: #666; margin-bottom: 6px; }
        .doc-item img { max-width: 100%; border-radius: 6px; border: 1px solid #eee; }
        .doc-item a { font-size: 13px; }
        .close-btn { margin-top: 10px; padding: 8px 16px; border: 1px solid #ccc; background: #fff; border-radius: 6px; cursor: pointer; }
        @media (max-width: 640px) {
          table, thead, tbody, th, td, tr { display: block; }
          thead { display: none; }
          tbody tr { border: 1px solid #eee; border-radius: 10px; padding: 12px; margin-bottom: 10px; }
          td { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 6px 0; border-bottom: 1px dashed #f0f0f0; }
          td:last-child { border-bottom: none; }
          td::before { content: attr(data-label); font-size: 12px; font-weight: 600; color: #999; flex: 0 0 auto; }
          td[data-label=""]::before { display: none; }
          .row-actions { justify-content: flex-end; }
        }
      `}</style>

      <div className="top-row">
        <Brand compact />
        <a className="nav-link" href="/admin">← Signature requests</a>
      </div>

      <h1>ID & document requests</h1>

      <div className="form-row">
        <input placeholder="Full name (optional)" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <input placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <button onClick={addRequest} disabled={generating}>
          {generating ? 'Generating...' : 'Generate link'}
        </button>
      </div>

      {error && <p className="banner error">{error}</p>}

      {newLink && (
        <div className="banner success">
          <div className="link-row">
            <a href={newLink}>{newLink}</a>
            <button className="copy-btn" onClick={copyLink}>{copied ? 'Copied!' : 'Copy'}</button>
          </div>
          {emailSent && <div style={{ marginTop: 6, fontSize: 13, color: '#1a7a1a' }}>Emailed to the recipient.</div>}
        </div>
      )}

      <table>
        <thead>
          <tr><th>Name</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td data-label="Name">{r.full_name || '(unnamed)'}</td>
              <td data-label="Status"><span className={`status-pill ${r.status}`}>{r.status}</span></td>
              <td data-label="">
                <div className="row-actions">
                  {r.status === 'submitted' && (
                    <button className="row-btn" onClick={() => viewDocuments(r.id)}>View</button>
                  )}
                  {r.status === 'pending' && r.email && (
                    <button className="row-btn" disabled={rowBusy === r.id} onClick={() => resendEmail(r.id)}>Resend</button>
                  )}
                  <button className="row-btn danger" disabled={rowBusy === r.id} onClick={() => deleteRequest(r.id)}>Delete</button>
                  {rowMsg?.id === r.id && <span className={`row-msg ${rowMsg.ok ? 'ok' : 'err'}`}>{rowMsg.text}</span>}
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={3} style={{ textAlign: 'center', color: '#999', padding: 24 }}>No requests yet</td></tr>
          )}
        </tbody>
      </table>

      {viewingId && (
        <div className="doc-overlay" onClick={() => setViewingId(null)}>
          <div className="doc-panel" onClick={(e) => e.stopPropagation()}>
            <h3>Submitted documents</h3>
            <p className="note">Links expire in 5 minutes for security.</p>
            {viewingDocs.length === 0 && <p style={{ fontSize: 13, color: '#999' }}>Loading...</p>}
            {viewingDocs.map((d, i) => (
              <div className="doc-item" key={i}>
                <div className="label">{d.doc_type}</div>
                {d.url ? (
                  d.url.includes('.pdf') ? (
                    <a href={d.url} target="_blank" rel="noreferrer">Open PDF</a>
                  ) : (
                    <a href={d.url} target="_blank" rel="noreferrer">
                      <img src={d.url} alt={d.doc_type} />
                    </a>
                  )
                ) : (
                  <span style={{ fontSize: 13, color: '#a30000' }}>Unavailable</span>
                )}
              </div>
            ))}
            <button className="close-btn" onClick={() => setViewingId(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
