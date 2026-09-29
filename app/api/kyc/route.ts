import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { sendKycLinkEmail } from '@/lib/resend';

const DAILY_LINK_LIMIT = 100;
const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB per file, generous for a phone photo/scan

type Upload = { dataUrl: string; docType: string };

function decodeDataUrl(dataUrl: string) {
  const match = /^data:(.+);base64,(.*)$/.exec(dataUrl);
  if (!match) return null;
  const [, mime, base64] = match;
  const buffer = Buffer.from(base64, 'base64');
  if (buffer.byteLength > MAX_FILE_BYTES) return null;
  const ext = mime.split('/')[1]?.split('+')[0] || 'bin';
  return { buffer, mime, ext };
}

// Public: the person submits their name, photo, and ID document. No auth —
// service-role client only, files go straight into the PRIVATE bucket.
export async function POST(req: NextRequest) {
  const { token, fullName, phone, photo, idDocType, idDocument, consentGiven } = await req.json();

  if (!token || !photo || !idDocument || !idDocType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (!consentGiven) {
    return NextResponse.json({ error: 'Consent is required to submit' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: request, error: findError } = await supabase
    .from('kyc_requests')
    .select('id, user_id, status')
    .eq('token', token)
    .single();

  if (findError || !request) {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 });
  }
  if (request.status === 'submitted') {
    return NextResponse.json({ error: 'This link has already been used' }, { status: 409 });
  }

  const uploads: Upload[] = [
    { dataUrl: photo, docType: 'photo' },
    { dataUrl: idDocument, docType: idDocType },
  ];

  for (const upload of uploads) {
    const decoded = decodeDataUrl(upload.dataUrl);
    if (!decoded) {
      return NextResponse.json({ error: 'A file was invalid or too large (max 8MB each)' }, { status: 400 });
    }

    const path = `${request.user_id}/${token}/${upload.docType}.${decoded.ext}`;
    const { error: uploadError } = await supabase.storage
      .from('kyc-uploads')
      .upload(path, decoded.buffer, { contentType: decoded.mime, upsert: true });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { error: docError } = await supabase.from('kyc_documents').insert({
      request_id: request.id,
      user_id: request.user_id,
      doc_type: upload.docType,
      storage_path: path,
    });
    if (docError) {
      return NextResponse.json({ error: docError.message }, { status: 500 });
    }
  }

  const { error: updateError } = await supabase
    .from('kyc_requests')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      ...(fullName ? { full_name: fullName } : {}),
      ...(phone ? { phone } : {}),
      consent_given: true,
    })
    .eq('token', token);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// Authenticated: owner generates a new ID/document request link.
export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('kyc_requests')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', since);

  if ((count ?? 0) >= DAILY_LINK_LIMIT) {
    return NextResponse.json(
      { error: `Daily limit of ${DAILY_LINK_LIMIT} links reached. Try again tomorrow.` },
      { status: 429 }
    );
  }

  const { full_name, email, phone } = await req.json();

  const { data, error } = await supabase
    .from('kyc_requests')
    .insert({ user_id: user.id, full_name: full_name || null, email: email || null, phone: phone || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const link = `${process.env.NEXT_PUBLIC_SITE_URL}/kyc/${data.token}`;
  let emailStatus: { skipped: boolean; error?: string | null } = { skipped: true };

  if (email) {
    emailStatus = await sendKycLinkEmail(email, link, full_name);
  }

  return NextResponse.json({
    token: data.token,
    link,
    emailSent: !emailStatus.skipped && !emailStatus.error,
  });
}
