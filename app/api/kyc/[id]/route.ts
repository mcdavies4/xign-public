import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendKycLinkEmail } from '@/lib/resend';

const SIGNED_URL_EXPIRY = 60 * 5; // 5 minutes — files are never permanently public

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  // RLS ensures this only returns documents the caller actually owns.
  const { data: docs, error } = await supabase
    .from('kyc_documents')
    .select('doc_type, storage_path')
    .eq('request_id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const admin = createAdminClient();
  const signed = await Promise.all(
    (docs || []).map(async (d) => {
      const { data } = await admin.storage
        .from('kyc-uploads')
        .createSignedUrl(d.storage_path, SIGNED_URL_EXPIRY);
      return { doc_type: d.doc_type, url: data?.signedUrl || null };
    })
  );

  return NextResponse.json({ documents: signed });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const { data: docs } = await supabase
    .from('kyc_documents')
    .select('storage_path')
    .eq('request_id', id);

  if (docs && docs.length > 0) {
    const admin = createAdminClient();
    await admin.storage.from('kyc-uploads').remove(docs.map((d) => d.storage_path));
  }

  const { error } = await supabase.from('kyc_requests').delete().eq('id', id);
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
    .from('kyc_requests')
    .select('token, full_name, email, status')
    .eq('id', id)
    .single();

  if (error || !row) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  if (!row.email) return NextResponse.json({ error: 'No email on file for this request' }, { status: 400 });
  if (row.status === 'submitted') return NextResponse.json({ error: 'Already submitted' }, { status: 409 });

  const link = `${process.env.NEXT_PUBLIC_SITE_URL}/kyc/${row.token}`;
  const result = await sendKycLinkEmail(row.email, link, row.full_name || undefined);

  if (result.error) return NextResponse.json({ error: result.error }, { status: 500 });
  if (result.skipped) return NextResponse.json({ error: 'Email sending is not configured yet' }, { status: 400 });

  return NextResponse.json({ ok: true });
}
