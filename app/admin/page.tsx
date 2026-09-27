'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

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

  const load = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return router.push('/login');
    setUserEmail(user.email || '');

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

  return (
    <div className="wrap">
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        .wrap {
          max-width: 720px;
          margin: 0 auto;
          padding: 20px 16px 60px;
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
        .user-email { font-size: 13px; color: #888; }
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
        .sig-cell { display: flex; align-items: center; gap: 10px; }
        .sig-cell img { height: 36px; max-width: 90px; object-fit: contain; background: #fff; border: 1px solid #eee; border-radius: 4px; }
        .status-pill {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
        }
        .status-pill.signed { background: #e6f7e6; color: #1a7a1a; }
        .status-pill.pending { background: #fff4e0; color: #a35b00; }
      `}</style>

      <div className="top-row">
        <h1>Signature requests</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="user-email">{userEmail}</span>
          <button className="signout-btn" onClick={signOut}>Sign out</button>
        </div>
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
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.signer_name || '(unnamed)'}</td>
                <td>
                  <span className={`status-pill ${r.status}`}>{r.status}</span>
                </td>
                <td>
                  {r.signature_url ? (
                    <div className="sig-cell">
                      <img src={r.signature_url} alt="" />
                      <a href={r.signature_url} download>
                        Download
                      </a>
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', color: '#999', padding: 24 }}>
                  No requests yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
