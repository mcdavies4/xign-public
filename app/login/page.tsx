'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Brand from '@/components/Brand';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sendLink = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  };

  return (
    <div className="wrap">
      <style>{`
        * { box-sizing: border-box; }
        .wrap {
          max-width: 380px;
          margin: 80px auto;
          padding: 0 20px;
          font-family: system-ui, -apple-system, sans-serif;
          text-align: center;
        }
        h1 { font-size: 22px; margin-bottom: 8px; }
        p { color: #555; font-size: 14px; margin-bottom: 24px; }
        input {
          width: 100%;
          padding: 14px;
          font-size: 16px;
          border: 1px solid #ccc;
          border-radius: 8px;
          margin-bottom: 12px;
        }
        button {
          width: 100%;
          padding: 14px;
          font-size: 16px;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          background: #111;
          color: #fff;
          cursor: pointer;
        }
        button:disabled { background: #999; cursor: not-allowed; }
        .error { color: #a30000; font-size: 14px; margin-top: 12px; }
        .sent { color: #1a7a1a; font-size: 15px; }
        .brand-row { margin-bottom: 32px; display: flex; justify-content: center; }
      `}</style>
      <div className="brand-row"><Brand /></div>
      <h1>Sign in</h1>
      {sent ? (
        <p className="sent">Check your email for a sign-in link.</p>
      ) : (
        <>
          <p>Enter your email — we'll send you a link to sign in, no password needed.</p>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendLink()}
          />
          <button onClick={sendLink} disabled={loading}>
            {loading ? 'Sending...' : 'Send sign-in link'}
          </button>
          {error && <p className="error">{error}</p>}
        </>
      )}
    </div>
  );
}
