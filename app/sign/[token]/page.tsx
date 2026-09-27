'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import SignaturePad from '@/components/SignaturePad';
import Brand from '@/components/Brand';

export default function SignPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'loading' | 'pending' | 'signed' | 'invalid'>('loading');
  const [signerName, setSignerName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [requestedBy, setRequestedBy] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/signatures/${token}`);
      if (!res.ok) return setStatus('invalid');
      const data = await res.json();
      setSignerName(data.signer_name || '');
      setNameInput(data.signer_name || '');
      setRequestedBy(data.requested_by || null);
      setStatus(data.status === 'signed' ? 'signed' : 'pending');
    })();
  }, [token]);

  const handleSave = async (dataUrl: string) => {
    setSaving(true);
    setError(null);
    const res = await fetch('/api/signatures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, dataUrl, signerName: nameInput.trim() }),
    });
    setSaving(false);
    if (res.ok) {
      setStatus('signed');
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Something went wrong. Please try again.');
    }
  };

  const styleTag = (
    <style>{`
      * { box-sizing: border-box; }
      body { margin: 0; }
      .sign-wrap {
        max-width: 480px;
        margin: 0 auto;
        padding: 32px 16px 48px;
        font-family: system-ui, -apple-system, sans-serif;
      }
      .sign-wrap h1 { font-size: 20px; margin: 0 0 6px; }
      .sign-wrap .hint { color: #555; font-size: 14px; margin: 0 0 20px; }
      .name-input {
        width: 100%;
        padding: 14px;
        margin-bottom: 20px;
        border: 1px solid #ccc;
        border-radius: 8px;
        font-size: 16px;
      }
      .locked-hint { color: #999; font-size: 14px; }
      .brand-row { margin-bottom: 24px; }
      .requested-by {
        display: inline-block;
        background: #f5f5f5;
        color: #555;
        font-size: 13px;
        padding: 6px 12px;
        border-radius: 999px;
        margin-bottom: 16px;
      }
      .error-banner {
        background: #fdecea;
        color: #a30000;
        padding: 10px;
        border-radius: 8px;
        font-size: 14px;
        margin-top: 12px;
      }
      .centered {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 70vh;
        text-align: center;
        padding: 24px;
        font-size: 18px;
        font-family: system-ui, -apple-system, sans-serif;
      }
    `}</style>
  );

  if (status === 'loading')
    return (
      <>
        {styleTag}
        <div className="centered">Loading...</div>
      </>
    );
  if (status === 'invalid')
    return (
      <>
        {styleTag}
        <div className="centered">This link isn't valid.</div>
      </>
    );
  if (status === 'signed')
    return (
      <>
        {styleTag}
        <div className="centered">
          Thanks{signerName ? `, ${signerName}` : ''} - your signature has been received.
        </div>
      </>
    );

  return (
    <>
      {styleTag}
      <div className="sign-wrap">
        <div className="brand-row"><Brand compact /></div>
        {requestedBy && <div className="requested-by">Requested by {requestedBy}</div>}
        <h1>Sign here</h1>
        <p className="hint">Enter your name, then draw your signature below.</p>
        <input
          className="name-input"
          placeholder="Your full name"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          autoFocus
        />
        {nameInput.trim() ? (
          <SignaturePad onSave={handleSave} saving={saving} />
        ) : (
          <p className="locked-hint">Enter your name to unlock the signature pad.</p>
        )}
        {error && <p className="error-banner">{error}</p>}
      </div>
    </>
  );
}
