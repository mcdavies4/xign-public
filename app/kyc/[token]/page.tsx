'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Brand from '@/components/Brand';

const MAX_BYTES = 8 * 1024 * 1024;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function KycPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'loading' | 'pending' | 'submitted' | 'invalid'>('loading');
  const [requestedBy, setRequestedBy] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [idDocType, setIdDocType] = useState('national_id');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/kyc-lookup/${token}`);
      if (!res.ok) return setStatus('invalid');
      const data = await res.json();
      setFullName(data.full_name || '');
      setPhone(data.phone || '');
      setRequestedBy(data.requested_by || null);
      setStatus(data.status === 'submitted' ? 'submitted' : 'pending');
    })();
  }, [token]);

  const validFile = (f: File) => f.size <= MAX_BYTES;

  const submit = async () => {
    setError(null);
    if (!fullName.trim()) return setError('Please enter your full name');
    if (!photoFile) return setError('Please add a photo of yourself');
    if (!idFile) return setError('Please add a photo of your ID document');
    if (!validFile(photoFile) || !validFile(idFile)) return setError('Each file must be under 8MB');
    if (!consent) return setError('Please confirm you consent before submitting');

    setSaving(true);
    try {
      const [photoData, idData] = await Promise.all([fileToDataUrl(photoFile), fileToDataUrl(idFile)]);
      const res = await fetch('/api/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          fullName: fullName.trim(),
          phone: phone.trim() || undefined,
          photo: photoData,
          idDocType,
          idDocument: idData,
          consentGiven: consent,
        }),
      });
      setSaving(false);
      if (res.ok) {
        setStatus('submitted');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setSaving(false);
      setError('Something went wrong reading your files. Please try again.');
    }
  };

  const styleTag = (
    <style>{`
      * { box-sizing: border-box; }
      body { margin: 0; }
      .wrap {
        max-width: 480px;
        margin: 0 auto;
        padding: max(32px, env(safe-area-inset-top)) 16px calc(48px + env(safe-area-inset-bottom));
        font-family: system-ui, -apple-system, sans-serif;
      }
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
      h1 { font-size: 20px; margin: 0 0 6px; }
      .hint { color: #555; font-size: 14px; margin: 0 0 20px; }
      .notice {
        background: #f5f5f5;
        border-radius: 8px;
        padding: 14px;
        font-size: 13px;
        color: #555;
        line-height: 1.5;
        margin-bottom: 24px;
      }
      label { display: block; font-size: 13px; font-weight: 600; color: #333; margin: 16px 0 6px; }
      input[type="text"], input[type="tel"], select {
        width: 100%;
        padding: 12px;
        border: 1px solid #ccc;
        border-radius: 8px;
        font-size: 16px;
      }
      .file-input {
        display: block;
        width: 100%;
        padding: 12px;
        border: 1px dashed #ccc;
        border-radius: 8px;
        font-size: 14px;
        background: #fafafa;
      }
      .consent-row {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        margin-top: 24px;
        font-size: 13px;
        color: #555;
      }
      .consent-row input { margin-top: 3px; }
      .submit-btn {
        width: 100%;
        margin-top: 20px;
        padding: 14px;
        font-size: 16px;
        font-weight: 600;
        border: none;
        border-radius: 8px;
        background: #111;
        color: #fff;
        cursor: pointer;
      }
      .submit-btn:disabled { background: #999; cursor: not-allowed; }
      .error-banner {
        background: #fdecea;
        color: #a30000;
        padding: 10px;
        border-radius: 8px;
        font-size: 14px;
        margin-top: 14px;
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
  if (status === 'submitted')
    return (
      <>
        {styleTag}
        <div className="centered">Thanks — your details have been received.</div>
      </>
    );

  return (
    <>
      {styleTag}
      <div className="wrap">
        <div className="brand-row"><Brand compact /></div>
        {requestedBy && <div className="requested-by">Requested by {requestedBy}</div>}
        <h1>Verify your identity</h1>
        <p className="hint">Please provide your details, a photo of yourself, and a photo of an ID document.</p>

        <div className="notice">
          What's collected: your name, phone number (optional), a photo of you, and a photo of one
          ID document. This is stored securely and only visible to the person who requested it. We
          do not ask for your BVN — never share it here or with anyone claiming to need it for this.
        </div>

        <label htmlFor="fullName">Full name</label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <label htmlFor="phone">Phone number (optional)</label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <label htmlFor="photo">A photo of you</label>
        <input
          id="photo"
          className="file-input"
          type="file"
          accept="image/*"
          capture="user"
          onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
        />

        <label htmlFor="idDocType">ID document type</label>
        <select id="idDocType" value={idDocType} onChange={(e) => setIdDocType(e.target.value)}>
          <option value="national_id">National ID</option>
          <option value="passport">Passport</option>
          <option value="drivers_license">Driver's license</option>
          <option value="other">Other</option>
        </select>

        <label htmlFor="idDoc">Photo of your ID document</label>
        <input
          id="idDoc"
          className="file-input"
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => setIdFile(e.target.files?.[0] || null)}
        />

        <div className="consent-row">
          <input
            type="checkbox"
            id="consent"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <label htmlFor="consent" style={{ margin: 0, fontWeight: 400 }}>
            I consent to sharing this information and these documents with the person who requested
            them, for identity verification purposes.
          </label>
        </div>

        <button className="submit-btn" onClick={submit} disabled={saving}>
          {saving ? 'Submitting...' : 'Submit'}
        </button>

        {error && <p className="error-banner">{error}</p>}
      </div>
    </>
  );
}
