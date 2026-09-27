import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const DAILY_LINK_LIMIT = 100; // per user, generous but prevents runaway abuse

// Public: a signer submits their drawn signature. No auth — anyone with a
// valid token can call this, so we use the service-role client and validate
// the token/state ourselves rather than relying on RLS.
export async function POST(req: NextRequest) {
  const { token, dataUrl, signerName } = await req.json();

  if (!token || !dataUrl) {
    return NextResponse.json({ error: 'Missing token or dataUrl' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: request, error: findError } = await supabase
    .from('signature_requests')
    .select('id, status')
    .eq('token', token)
    .single();

  if (findError || !request) {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 });
  }

  if (request.status === 'signed') {
    return NextResponse.json({ error: 'This link has already been used' }, { status: 409 });
  }

  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
  const buffer = Buffer.from(base64, 'base64');
  const path = `${token}.png`;

  const { error: uploadError } = await supabase.storage
    .from('signatures')
    .upload(path, buffer, { contentType: 'image/png', upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicUrl } = supabase.storage.from('signatures').getPublicUrl(path);

  const { error: updateError } = await supabase
    .from('signature_requests')
    .update({
      status: 'signed',
      signature_url: publicUrl.publicUrl,
      signed_at: new Date().toISOString(),
      ...(signerName ? { signer_name: signerName } : {}),
    })
    .eq('token', token);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, url: publicUrl.publicUrl });
}

// Authenticated: the logged-in owner generates a new signing link.
// Uses the session-bound client, so RLS enforces user_id = auth.uid() itself.
export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('signature_requests')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', since);

  if ((count ?? 0) >= DAILY_LINK_LIMIT) {
    return NextResponse.json(
      { error: `Daily limit of ${DAILY_LINK_LIMIT} links reached. Try again tomorrow.` },
      { status: 429 }
    );
  }

  const { signer_name, signer_email } = await req.json();

  const { data, error } = await supabase
    .from('signature_requests')
    .insert({ user_id: user.id, signer_name, signer_email })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    token: data.token,
    link: `${process.env.NEXT_PUBLIC_SITE_URL}/sign/${data.token}`,
  });
}
