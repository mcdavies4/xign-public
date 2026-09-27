export default function PrivacyPage() {
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
      <h1>Privacy Policy</h1>
      <p className="updated">Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

      <h2>What this service does</h2>
      <p>
        This tool lets an account holder ("the sender") request a signature from someone else
        ("the signer") via a one-time link. The signer draws their signature on a blank pad and
        submits it; the sender can then view and download it as an image.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>From the sender: an email address, used only for signing in.</li>
        <li>From the signer: a name they type in, and the signature image they draw. An email address is only collected if the sender chose to provide one when generating the link.</li>
      </ul>

      <h2>How it's used</h2>
      <p>
        Signature images and names are stored so the sender can view and download them. If an
        email was provided, it may be used to send the signing link automatically. We do not
        sell or share this data with third parties, and we do not use it for advertising.
      </p>

      <h2>Where it's stored</h2>
      <p>
        Data is stored using Supabase, a third-party database and storage provider. Signature
        images are stored in a storage bucket and are accessible via a direct link to anyone who
        has that link — links are not indexed or made public elsewhere.
      </p>

      <h2>How long we keep it</h2>
      <p>
        Data is kept until the sender's account is deleted or they request removal of a specific
        request. There is currently no automatic deletion schedule.
      </p>

      <h2>Your rights</h2>
      <p>
        If you signed a request and want your signature or name removed, contact the sender who
        sent you the link directly, or reach out to us using the contact details below and we'll
        assist.
      </p>

      <h2>Contact</h2>
      <p>Questions about this policy can be sent to the operator of this service.</p>
    </div>
  );
}
