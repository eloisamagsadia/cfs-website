-- Contact messages: append-only reply thread so /admin/contact can show
-- a conversation history of every reply an admin sent, not just the last
-- one (which is all reply_note holds).
--
-- Each element in the replies array:
--   { body: text, sent_at: iso, sent_by: userId, sent_by_name: text }
--
-- Idempotent: safe to run on databases where the column already exists.
ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS replies JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Backfill: any existing single reply_note becomes the first entry in the
-- thread so we don't lose history for messages already replied to.
UPDATE public.contact_messages
   SET replies = jsonb_build_array(
         jsonb_build_object(
           'body',         reply_note,
           'sent_at',      COALESCE(handled_at, NOW()),
           'sent_by',      handled_by,
           'sent_by_name', NULL
         )
       )
 WHERE reply_note IS NOT NULL
   AND (replies IS NULL OR jsonb_array_length(replies) = 0);
