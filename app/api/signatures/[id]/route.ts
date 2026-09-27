import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendSigningLinkEmail } from '@/lib/resend';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  // RLS ensures this only succeeds for rows the caller actually owns.
  const { error } = await supabase.from('signature_requests').delete().eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const { data: row, error } = await supabase
    .from('signature_requests')
    .select('token, signer_name, signer_email, status')
    .eq('id', id)
    .single();

  if (error || !row) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  if (!row.signer_email) return NextResponse.json({ error: 'No email on file for this request' }, { status: 400 });
  if (row.status === 'signed') return NextResponse.json({ error: 'Already signed' }, { status: 409 });

  const link = `${process.env.NEXT_PUBLIC_SITE_URL}/sign/${row.token}`;
  const result = await sendSigningLinkEmail(row.signer_email, link, row.signer_name || undefined);

  if (result.error) return NextResponse.json({ error: result.error }, { status: 500 });
  if (result.skipped) return NextResponse.json({ error: 'Email sending is not configured yet' }, { status: 400 });

  return NextResponse.json({ ok: true });
}
