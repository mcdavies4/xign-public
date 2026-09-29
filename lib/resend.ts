import { Resend } from 'resend';

// Requires RESEND_API_KEY in env vars. Without a verified domain on your
// Resend account, sends only succeed when the recipient is the email address
// on your own Resend account — real recipients need a verified domain first.
// See https://resend.com/domains
export async function sendSigningLinkEmail(to: string, link: string, signerName?: string) {
  if (!process.env.RESEND_API_KEY) {
    // Not configured — caller should treat this as a silent no-op, not an error,
    // since email is optional (the link is always shown/copyable in the dashboard too).
    return { skipped: true };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: 'Signature request <onboarding@resend.dev>',
    to,
    subject: 'Your signature is requested',
    html: `
      <p>Hi${signerName ? ` ${signerName}` : ''},</p>
      <p>You've been asked to provide your signature. It only takes a few seconds — just draw it on the page below.</p>
      <p><a href="${link}" style="display:inline-block;padding:12px 20px;background:#111;color:#fff;text-decoration:none;border-radius:6px;">Sign now</a></p>
      <p style="color:#888;font-size:13px;">Or copy this link: ${link}</p>
    `,
  });

  if (error) return { skipped: false, error: error.message };
  return { skipped: false, error: null };
}

export async function sendKycLinkEmail(to: string, link: string, name?: string) {
  if (!process.env.RESEND_API_KEY) {
    return { skipped: true };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: 'Xign <onboarding@resend.dev>',
    to,
    subject: 'Please verify your identity',
    html: `
      <p>Hi${name ? ` ${name}` : ''},</p>
      <p>You've been asked to provide a quick photo and a copy of an ID document to verify your identity. It only takes a minute.</p>
      <p><a href="${link}" style="display:inline-block;padding:12px 20px;background:#111;color:#fff;text-decoration:none;border-radius:6px;">Verify now</a></p>
      <p style="color:#888;font-size:13px;">Or copy this link: ${link}</p>
    `,
  });

  if (error) return { skipped: false, error: error.message };
  return { skipped: false, error: null };
}
