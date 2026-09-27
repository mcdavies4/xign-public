import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  const { token, reason } = await req.json();

  if (!token || !reason || !reason.trim()) {
    return NextResponse.json({ error: 'Missing token or reason' }, { status: 400 });
  }

  if (!process.env.REPORT_EMAIL || !process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Reporting is not configured yet' }, { status: 503 });
  }

  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from('signature_requests')
    .select('user_id, signer_name')
    .eq('token', token)
    .single();

  let requesterEmail = 'unknown';
  if (row?.user_id) {
    const { data: userData } = await supabase.auth.admin.getUserById(row.user_id);
    requesterEmail = userData?.user?.email || 'unknown';
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: 'Xign reports <onboarding@resend.dev>',
    to: process.env.REPORT_EMAIL,
    subject: 'A signing link was reported',
    html: `
      <p>A signing link was flagged by the person who received it.</p>
      <p><strong>Token:</strong> ${token}</p>
      <p><strong>Requested by account:</strong> ${requesterEmail}</p>
      <p><strong>Signer name given:</strong> ${row?.signer_name || '(none)'}</p>
      <p><strong>Reason given:</strong><br>${reason.trim()}</p>
    `,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
