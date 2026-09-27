'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Brand from '@/components/Brand';

type Req = {
  id: string;
  signer_name: string | null;
  signer_email: string | null;
  status: string;
  signature_url: string | null;
  signed_at: string | null;
  token: string;
};

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState('');
  const [rows, setRows] = useState<Req[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [newLink, setNewLink] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [displayNameSaved, setDisplayNameSaved] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [rowMsg, setRowMsg] = useState<{ id: string; text: string; ok: boolean } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const load = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return router.push('/login');
    setUserEmail(user.email || '');

    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();
    setDisplayName(profile?.display_name || '');

    const { data, error } = await supabase
      .from('signature_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    setRows(data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const saveDisplayName = async () => {
    setSavingName(true);
    setDisplayNameSaved(false);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() || null })
      .eq('id', user.id);
    setSavingName(false);
    setDisplayNameSaved(true);
    setTimeout(() => setDisplayNameSaved(false), 2000);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const addSigner = async () => {
    setError(null);
    setGenerating(true);
    setCopied(false);
    const res = await fetch('/api/signatures', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signer_name: name || null, signer_email: email || null }),
    });
    const data = await res.json();
    setGenerating(false);
    if (!res.ok) {
      setError(data.error || 'Failed to generate link');
      return;
    }
    setNewLink(data.link);
    setEmailSent(data.emailSent);
    setName('');
    setEmail('');
    load();
  };

  const copyLink = async () => {
    if (!newLink) return;
    try {
      await navigator.clipboard.writeText(newLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — link is still shown and tappable
    }
  };

  const deleteRequest = async (id: string) => {
    if (!confirm('Delete this request? This cannot be undone.')) return;
    setRowBusy(id);
    const res = await fetch(`/api/signatures/${id}`, { method: 'DELETE' });
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
    const res = await fetch(`/api/signatures/${id}`, { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    setRowBusy(null);
    setRowMsg({ id, text: res.ok ? 'Email resent' : data.error || 'Failed to resend', ok: res.ok });
    setTimeout(() => setRowMsg(null), 3000);
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
          margin-bottom: 20px;
        }
        h1 { font-size: 22px; margin: 0; }
        .user-info { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .user-email {
          font-size: 13px;
          color: #888;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 45vw;
        }
        .signout-btn {
          padding: 6px 14px;
          font-size: 13px;
          border: 1px solid #ccc;
          border-radius: 6px;
          background: #fff;
          cursor: pointer;
        }
        .form-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 16px;
        }
        .form-row input {
          flex: 1 1 160px;
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
        .banner {
          padding: 12px;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 16px;
          word-break: break-word;
        }
        .banner.error { background: #fdecea; color: #a30000; }
        .banner.success { background: #eef9ee; }
        .link-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .link-row a { word-break: break-all; }
        .copy-btn {
          padding: 6px 12px;
          font-size: 13px;
          border: 1px solid #ccc;
          border-radius: 6px;
          background: #fff;
          cursor: pointer;
          white-space: nowrap;
        }
        .table-scroll {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border: 1px solid #eee;
          border-radius: 8px;
        }
        table { width: 100%; border-collapse: collapse; min-width: 420px; }
        th, td { padding: 12px 10px; text-align: left; font-size: 14px; }
        thead tr { border-bottom: 1px solid #ddd; }
        tbody tr { border-bottom: 1px solid #eee; }
        tbody tr:last-child { border-bottom: none; }
        @media (max-width: 640px) {
          .table-scroll { overflow-x: visible; border: none; }
          table { min-width: 0; }
          thead { display: none; }
          tbody tr {
            display: block;
            border: 1px solid #eee;
            border-radius: 10px;
            padding: 12px;
            margin-bottom: 10px;
          }
          tbody tr:last-child { margin-bottom: 0; }
          td {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 6px 0;
            border-bottom: 1px dashed #f0f0f0;
          }
          td:last-child { border-bottom: none; }
          td::before {
            content: attr(data-label);
            font-size: 12px;
            font-weight: 600;
            color: #999;
            flex: 0 0 auto;
          }
          td[data-label=""]::before { display: none; }
          .empty-cell { display: block !important; text-align: center; }
          .row-actions { justify-content: flex-end; }
        }
        .sig-cell { display: flex; align-items: center; gap: 10px; }
        .sig-cell img { height: 36px; max-width: 90px; object-fit: contain; background: #fff; border: 1px solid #eee; border-radius: 4px; }
        .empty-cell { text-align: center; color: #999; padding: 24px; }
        .status-pill {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
        }
        .status-pill.signed { background: #e6f7e6; color: #1a7a1a; }
        .status-pill.pending { background: #fff4e0; color: #a35b00; }
        .settings-box {
          border: 1px solid #eee;
          border-radius: 8px;
          padding: 14px;
          margin-bottom: 24px;
        }
        .settings-box label { display: block; font-size: 13px; color: #666; margin-bottom: 6px; }
        .settings-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .settings-row input {
          flex: 1 1 200px;
          min-width: 0;
          padding: 10px;
          font-size: 15px;
          border: 1px solid #ccc;
          border-radius: 6px;
        }
        .settings-row button {
          padding: 10px 16px;
          border: 1px solid #111;
          background: #fff;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }
        .settings-hint { font-size: 12px; color: #999; margin-top: 6px; }
        .stats-row { display: flex; gap: 16px; margin-bottom: 14px; font-size: 13px; color: #666; }
        .row-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
        .row-btn {
          padding: 5px 10px;
          font-size: 12px;
          border: 1px solid #ccc;
          border-radius: 6px;
          background: #fff;
          cursor: pointer;
          white-space: nowrap;
        }
        .row-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .row-btn.danger { border-color: #f0c0c0; color: #a30000; }
        .row-msg { font-size: 12px; }
        .row-msg.ok { color: #1a7a1a; }
        .row-msg.err { color: #a30000; }
        .sig-cell img { cursor: zoom-in; }
        .preview-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.75);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
          padding: 20px;
        }
        .preview-overlay img {
          max-width: 100%;
          max-height: 80vh;
          background: #fff;
          border-radius: 8px;
          padding: 20px;
        }
      `}</style>

      <div className="top-row">
        <Brand compact />
        <div className="user-info">
          <span className="user-email">{userEmail}</span>
          <button className="signout-btn" onClick={signOut}>Sign out</button>
        </div>
      </div>

      <div className="settings-box">
        <label htmlFor="displayName">Your name or business, shown to people you request signatures from</label>
        <div className="settings-row">
          <input
            id="displayName"
            placeholder="e.g. Grad Haus, or your name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <button onClick={saveDisplayName} disabled={savingName}>
            {savingName ? 'Saving...' : displayNameSaved ? 'Saved!' : 'Save'}
          </button>
        </div>
        <p className="settings-hint">Shows on the signing page as "Requested by ...". Leave blank to hide it.</p>
      </div>

      <h1 style={{ fontSize: 18, color: '#555', margin: '0 0 8px' }}>Your signature requests</h1>

      <div className="stats-row">
        <span>{rows.length} total</span>
        <span>{rows.filter((r) => r.status === 'signed').length} signed</span>
        <span>{rows.filter((r) => r.status === 'pending').length} pending</span>
      </div>

      <div className="form-row">
        <input
          placeholder="Name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="Email (optional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button onClick={addSigner} disabled={generating}>
          {generating ? 'Generating...' : 'Generate link'}
        </button>
      </div>

      {error && <p className="banner error">{error}</p>}

      {newLink && (
        <div className="banner success">
          <div className="link-row">
            <a href={newLink}>{newLink}</a>
            <button className="copy-btn" onClick={copyLink}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          {emailSent && <div style={{ marginTop: 6, fontSize: 13, color: '#1a7a1a' }}>Emailed to the signer.</div>}
        </div>
      )}

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Signature</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td data-label="Name">{r.signer_name || '(unnamed)'}</td>
                <td data-label="Status">
                  <span className={`status-pill ${r.status}`}>{r.status}</span>
                </td>
                <td data-label="Signature">
                  {r.signature_url ? (
                    <div className="sig-cell">
                      <img src={r.signature_url} alt="" onClick={() => setPreviewUrl(r.signature_url)} />
                      <a href={r.signature_url} download>
                        Download
                      </a>
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td data-label="">
                  <div className="row-actions">
                    {r.status === 'pending' && r.signer_email && (
                      <button
                        className="row-btn"
                        disabled={rowBusy === r.id}
                        onClick={() => resendEmail(r.id)}
                      >
                        Resend
                      </button>
                    )}
                    <button
                      className="row-btn danger"
                      disabled={rowBusy === r.id}
                      onClick={() => deleteRequest(r.id)}
                    >
                      Delete
                    </button>
                    {rowMsg?.id === r.id && (
                      <span className={`row-msg ${rowMsg.ok ? 'ok' : 'err'}`}>{rowMsg.text}</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="empty-cell">
                  No requests yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {previewUrl && (
        <div className="preview-overlay" onClick={() => setPreviewUrl(null)}>
          <img src={previewUrl} alt="Signature" />
        </div>
      )}
    </div>
  );
}
