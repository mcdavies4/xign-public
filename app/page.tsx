import Link from 'next/link';
import Brand from '@/components/Brand';

export default function Home() {
  return (
    <div className="wrap">
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        .wrap {
          max-width: 560px;
          margin: 0 auto;
          padding: 40px 20px 80px;
          font-family: system-ui, -apple-system, sans-serif;
          text-align: center;
        }
        .brand-row { text-align: left; margin-bottom: 60px; }
        h1 { font-size: 28px; margin-bottom: 12px; }
        p { color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 32px; }
        a.cta {
          display: inline-block;
          padding: 14px 28px;
          background: #111;
          color: #fff;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 16px;
        }
      `}</style>
      <div className="brand-row"><Brand /></div>
      <h1>Collect a signature. Nothing else.</h1>
      <p>
        Send a link. They type their name and draw their signature. You get the image back —
        no document to sign, no account for them to make.
      </p>
      <Link className="cta" href="/login">Get started</Link>
      <p style={{ marginTop: 32, fontSize: 13 }}>
        <Link href="/privacy" style={{ color: '#999' }}>Privacy</Link>
        {' · '}
        <Link href="/terms" style={{ color: '#999' }}>Terms</Link>
      </p>
    </div>
  );
}
