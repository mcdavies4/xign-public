import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  // Vercel Cron sends this header automatically on scheduled invocations.
  // Rejects anyone else from hitting this route and running up usage.
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  // Any trivial query counts as activity for Supabase's pause-after-inactivity check.
  const { error } = await supabase.from('profiles').select('id').limit(1);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, checkedAt: new Date().toISOString() });
}
