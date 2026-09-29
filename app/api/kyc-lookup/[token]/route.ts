import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('kyc_requests')
    .select('full_name, email, phone, status, user_id')
    .eq('token', token)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', data.user_id)
    .single();

  return NextResponse.json({
    full_name: data.full_name,
    email: data.email,
    phone: data.phone,
    status: data.status,
    requested_by: profile?.display_name || null,
  });
}
