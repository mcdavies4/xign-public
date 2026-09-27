-- Run this in the Supabase SQL editor (additive)

create policy "Owner can delete own requests"
on signature_requests for delete
using (auth.uid() = user_id);
