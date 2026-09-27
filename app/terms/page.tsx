export default function TermsPage() {
  return (
    <div className="wrap">
      <style>{`
        * { box-sizing: border-box; }
        .wrap { max-width: 640px; margin: 0 auto; padding: 40px 20px 80px; font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; }
        h1 { font-size: 24px; }
        h2 { font-size: 17px; margin-top: 28px; }
        p, li { color: #333; font-size: 15px; }
        .updated { color: #888; font-size: 13px; }
      `}</style>
      <h1>Terms of Service</h1>
      <p className="updated">Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

      <h2>What this is</h2>
      <p>
        This is a free tool for collecting a hand-drawn signature image from someone via a
        one-time link. It is provided as-is, without warranty, and may change or be discontinued
        at any time.
      </p>

      <h2>Acceptable use</h2>
      <p>You agree not to use this service to:</p>
      <ul>
        <li>Collect signatures fraudulently, or to impersonate someone else's consent</li>
        <li>Collect signatures from anyone without their knowledge that they are signing</li>
        <li>Send abusive, spam, or unsolicited links at volume</li>
        <li>Attempt to access, scrape, or disrupt other users' data</li>
      </ul>

      <h2>No legal validity guaranteed</h2>
      <p>
        A signature image collected through this tool is not a substitute for a legally binding
        e-signature service where that is required (for contracts, deeds, or other documents with
        legal signing requirements). Use this tool only where a plain signature image is
        sufficient for your purpose.
      </p>

      <h2>Accounts</h2>
      <p>
        You're responsible for the links you generate and how they're used. We may suspend
        accounts found violating these terms.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        This service is provided free and as-is. We are not liable for any loss arising from its
        use, including data loss, downtime, or misuse of collected signatures.
      </p>

      <h2>Changes</h2>
      <p>These terms may be updated from time to time. Continued use after a change means you accept the updated terms.</p>
    </div>
  );
}
