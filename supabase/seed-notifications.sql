-- Seed test notifications for your account
-- Run in Supabase SQL Editor

INSERT INTO notifications (user_id, type, title, message, link, is_read)
SELECT
  u.id,
  n.type,
  n.title,
  n.message,
  n.link,
  n.is_read
FROM auth.users u
CROSS JOIN (
  VALUES
    ('badge_earned',      'Badge Earned: Early Member! ⭐', 'You earned the Early Member badge for being one of the first to join CFS!', '/members/badges', false),
    ('community_reply',   'New reaction on your post', 'flurry reacted ❤️ to your community post.', '/members/community', false),
    ('order_update',      'Order Shipped! 🛍', 'Your CFS Test Shirt order is on its way. Estimated delivery: 3-5 business days.', '/members/orders', false),
    ('event_reminder',    'Event Reminder 🎫', 'CFS Fam Meet is coming up in 3 days! Don't forget to bring your ticket.', '/members/events', true),
    ('community_mention', 'You were mentioned!', 'iu mentioned you in a community post: "shoutout to @you for being amazing!"', '/members/community', true),
    ('donation_ack',      'Thank you for your donation! ♥', 'Your donation of ₱500 to CFS was received. See your receipt in My Orders.', '/members/orders', true),
    ('new_follower',      'New follower!', 'flurry started following you in the community.', '/members/community/members', false),
    ('new_report',        'New Transparency Report Published 📋', 'Q1 2026 Transparency Report is now live. See how CFS used your support.', '/reports', true)
) AS n(type, title, message, link, is_read)
WHERE u.email = (SELECT email FROM auth.users ORDER BY created_at DESC LIMIT 1)
ON CONFLICT DO NOTHING;

-- Verify
SELECT type, title, is_read FROM notifications ORDER BY created_at DESC;
