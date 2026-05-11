-- ═══════════════════════════════════════════════════════════════════════════════
-- CFS Website — Supabase PostgreSQL Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ─────────────────────────────────────────────────────────────────────────────
-- PROFILES
-- Created automatically when a new user registers via auth trigger below
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name    TEXT,
  avatar_url      TEXT,
  bio             TEXT,
  is_public       BOOLEAN NOT NULL DEFAULT true,
  social_links    JSONB,
  role            TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notification_settings (
  user_id         UUID PRIMARY KEY REFERENCES profiles ON DELETE CASCADE,
  events_email    BOOLEAN NOT NULL DEFAULT true,
  orders_email    BOOLEAN NOT NULL DEFAULT true,
  community_email BOOLEAN NOT NULL DEFAULT true,
  badges_email    BOOLEAN NOT NULL DEFAULT true
);

-- Auto-create profile + notification settings on sign up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');

  INSERT INTO public.notification_settings (user_id)
    VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ─────────────────────────────────────────────────────────────────────────────
-- EVENTS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE event_categories (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  TEXT NOT NULL,
  slug  TEXT NOT NULL UNIQUE
);

CREATE TABLE events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT,
  date            TIMESTAMPTZ NOT NULL,
  location        TEXT,
  map_url         TEXT,
  capacity        INT,
  price           NUMERIC NOT NULL DEFAULT 0,
  is_members_only BOOLEAN NOT NULL DEFAULT false,
  banner_url      TEXT,
  status          TEXT NOT NULL DEFAULT 'upcoming'
                    CHECK (status IN ('upcoming','ongoing','completed','cancelled')),
  category_id     UUID REFERENCES event_categories,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE event_registrations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES events ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  ticket_type     TEXT,
  payment_status  TEXT NOT NULL DEFAULT 'pending'
                    CHECK (payment_status IN ('pending','paid','free','cancelled','failed')),
  paymongo_ref    TEXT,
  qr_code         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX idx_events_date ON events (date);
CREATE INDEX idx_events_status ON events (status);
CREATE INDEX idx_event_registrations_user ON event_registrations (user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- SHOP
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE product_categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  thumbnail_url TEXT
);

CREATE TABLE products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  price       NUMERIC NOT NULL,
  stock       INT NOT NULL DEFAULT 0,
  category_id UUID REFERENCES product_categories,
  images      TEXT[] NOT NULL DEFAULT '{}',
  variants    JSONB,     -- [{ "name": "Size", "options": ["S","M","L"] }]
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cart_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products ON DELETE CASCADE,
  quantity    INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  variant     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id, variant)
);

CREATE TABLE promo_codes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT NOT NULL UNIQUE,
  discount_type   TEXT NOT NULL CHECK (discount_type IN ('percent','fixed')),
  discount_value  NUMERIC NOT NULL,
  max_uses        INT,
  used_count      INT NOT NULL DEFAULT 0,
  expires_at      TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  items            JSONB NOT NULL,
  subtotal         NUMERIC NOT NULL,
  shipping_fee     NUMERIC NOT NULL DEFAULT 0,
  discount         NUMERIC NOT NULL DEFAULT 0,
  total            NUMERIC NOT NULL,
  payment_status   TEXT NOT NULL DEFAULT 'pending'
                     CHECK (payment_status IN ('pending','paid','failed','cancelled')),
  order_status     TEXT NOT NULL DEFAULT 'pending'
                     CHECK (order_status IN ('pending','processing','shipped','delivered','cancelled')),
  paymongo_ref     TEXT,
  shipping_address JSONB NOT NULL,
  promo_code_id    UUID REFERENCES promo_codes,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES orders ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products,
  quantity    INT NOT NULL,
  unit_price  NUMERIC NOT NULL,
  variant     JSONB
);

CREATE TABLE user_promo_codes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  promo_code_id  UUID NOT NULL REFERENCES promo_codes ON DELETE CASCADE,
  assigned_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, promo_code_id)
);

CREATE TABLE promo_code_usage (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id  UUID NOT NULL REFERENCES promo_codes ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  order_id       UUID REFERENCES orders,
  used_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_category ON products (category_id);
CREATE INDEX idx_products_active ON products (is_active);
CREATE INDEX idx_orders_user ON orders (user_id);
CREATE INDEX idx_cart_user ON cart_items (user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- TRANSPARENCY REPORTS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE transparency_reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  year         INT NOT NULL,
  quarter      INT NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  content      TEXT,
  pdf_url      TEXT,
  summary      TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tr_reactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tr_id         UUID NOT NULL REFERENCES transparency_reports ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like','heart','support')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tr_id, user_id)
);

CREATE INDEX idx_tr_year ON transparency_reports (year);
CREATE INDEX idx_tr_published ON transparency_reports (is_published);


-- ─────────────────────────────────────────────────────────────────────────────
-- PROJECTS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE projects (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  description      TEXT,
  status           TEXT NOT NULL DEFAULT 'ongoing'
                     CHECK (status IN ('ongoing','completed')),
  cover_image      TEXT,
  start_date       DATE,
  end_date         DATE,
  category         TEXT,
  progress_percent INT DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE project_media (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects ON DELETE CASCADE,
  file_url    TEXT NOT NULL,
  file_type   TEXT NOT NULL CHECK (file_type IN ('image','video')),
  caption     TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_media_project ON project_media (project_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- DONATIONS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE donations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES profiles ON DELETE SET NULL,  -- nullable: anonymous donations
  amount        NUMERIC NOT NULL CHECK (amount > 0),
  message       TEXT,
  is_anonymous  BOOLEAN NOT NULL DEFAULT false,
  paymongo_ref  TEXT,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','completed','failed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_donations_user ON donations (user_id);
CREATE INDEX idx_donations_status ON donations (status);


-- ─────────────────────────────────────────────────────────────────────────────
-- COMMUNITY
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE community_categories (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  TEXT NOT NULL,
  slug  TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#0d9488'
);

CREATE TABLE community_posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  content     TEXT NOT NULL,
  images      TEXT[] NOT NULL DEFAULT '{}',
  category_id UUID REFERENCES community_categories,
  is_pinned   BOOLEAN NOT NULL DEFAULT false,
  is_hidden   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ
);

CREATE TABLE community_comments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id           UUID NOT NULL REFERENCES community_posts ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES community_comments ON DELETE CASCADE,
  content           TEXT NOT NULL,
  is_hidden         BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE community_reactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       UUID NOT NULL REFERENCES community_posts ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like','heart','support')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE community_follows (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id  UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE TABLE community_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  post_id     UUID REFERENCES community_posts ON DELETE CASCADE,
  comment_id  UUID REFERENCES community_comments ON DELETE CASCADE,
  reason      TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','reviewed','resolved')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE community_mentions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id            UUID REFERENCES community_posts ON DELETE CASCADE,
  comment_id         UUID REFERENCES community_comments ON DELETE CASCADE,
  mentioned_user_id  UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_community_posts_user ON community_posts (user_id);
CREATE INDEX idx_community_posts_created ON community_posts (created_at DESC);
CREATE INDEX idx_community_comments_post ON community_comments (post_id);
CREATE INDEX idx_community_follows_follower ON community_follows (follower_id);
CREATE INDEX idx_community_follows_following ON community_follows (following_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- GAMIFICATION / BADGES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE badges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL UNIQUE,
  description     TEXT,
  icon_url        TEXT,
  trigger_type    TEXT NOT NULL,
  threshold_value NUMERIC
);

CREATE TABLE user_badges (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  badge_id  UUID NOT NULL REFERENCES badges ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)  -- idempotent: can't earn same badge twice
);

CREATE INDEX idx_user_badges_user ON user_badges (user_id);

-- Seed default badges
INSERT INTO badges (name, description, trigger_type, threshold_value) VALUES
  ('Early Member',       'Joined within the first 100 members',      'member_count',     100),
  ('Event Goer',         'Attended 3 or more events',                 'event_count',      3),
  ('Super Fan',          'Attended 10 or more events',                'event_count',      10),
  ('Donor',              'Made at least one donation',                'donation_count',   1),
  ('Generous Heart',     'Donated PHP 5,000 or more in total',        'donation_total',   5000),
  ('Community Starter',  'Created your first community post',         'post_count',       1),
  ('Active Voice',       'Posted 10 or more community posts',         'post_count',       10),
  ('Top Supporter',      'Received 50 or more reactions on posts',    'reactions_received', 50),
  ('Shopper',            'Placed your first shop order',              'order_count',      1),
  ('Report Reader',      'Viewed 5 or more transparency reports',     'tr_views',         5);


-- ─────────────────────────────────────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  link       TEXT,
  is_read    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications (user_id);
CREATE INDEX idx_notifications_unread ON notifications (user_id, is_read) WHERE is_read = false;


-- ═══════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE transparency_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE tr_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ── PROFILES ──────────────────────────────────────────────────────────────────
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (is_public = true OR auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- ── EVENTS ────────────────────────────────────────────────────────────────────
CREATE POLICY "Anyone can view events"
  ON events FOR SELECT USING (true);

CREATE POLICY "Admins can manage events"
  ON events FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── EVENT REGISTRATIONS ────────────────────────────────────────────────────────
CREATE POLICY "Members can view own registrations"
  ON event_registrations FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Members can create registrations"
  ON event_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── PRODUCTS ──────────────────────────────────────────────────────────────────
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage products"
  ON products FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── CART ITEMS ────────────────────────────────────────────────────────────────
CREATE POLICY "Members can manage own cart"
  ON cart_items FOR ALL USING (auth.uid() = user_id);

-- ── ORDERS ────────────────────────────────────────────────────────────────────
CREATE POLICY "Members can view own orders"
  ON orders FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Members can create orders"
  ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── TRANSPARENCY REPORTS ──────────────────────────────────────────────────────
CREATE POLICY "Anyone can view published report listings"
  ON transparency_reports FOR SELECT
  USING (is_published = true AND auth.uid() IS NOT NULL OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── PROJECTS ──────────────────────────────────────────────────────────────────
CREATE POLICY "Anyone can view projects"
  ON projects FOR SELECT USING (true);

-- ── PROJECT MEDIA ─────────────────────────────────────────────────────────────
CREATE POLICY "Members can view project media"
  ON project_media FOR SELECT USING (auth.uid() IS NOT NULL);

-- ── DONATIONS ─────────────────────────────────────────────────────────────────
CREATE POLICY "Members can create donations"
  ON donations FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Members can view own donations"
  ON donations FOR SELECT USING (auth.uid() = user_id);

-- ── COMMUNITY ─────────────────────────────────────────────────────────────────
CREATE POLICY "Members can view non-hidden posts"
  ON community_posts FOR SELECT
  USING (is_hidden = false AND auth.uid() IS NOT NULL);

CREATE POLICY "Members can create posts"
  ON community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can update own posts"
  ON community_posts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Members can delete own posts"
  ON community_posts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Members can view comments"
  ON community_comments FOR SELECT
  USING (is_hidden = false AND auth.uid() IS NOT NULL);

CREATE POLICY "Members can create comments"
  ON community_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can manage own reactions"
  ON community_reactions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Members can manage follows"
  ON community_follows FOR ALL USING (auth.uid() = follower_id);

-- ── BADGES ────────────────────────────────────────────────────────────────────
CREATE POLICY "Anyone can view badge definitions"
  ON badges FOR SELECT USING (true);

CREATE POLICY "Members can view own earned badges"
  ON user_badges FOR SELECT USING (auth.uid() = user_id);

-- ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
CREATE POLICY "Members can view own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Members can update own notifications"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ── PROMO CODES ───────────────────────────────────────────────────────────────
CREATE POLICY "Members can view own promo codes"
  ON user_promo_codes FOR SELECT USING (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════════════════════════
-- REALTIME SUBSCRIPTIONS
-- Enable realtime for community and notifications
-- ═══════════════════════════════════════════════════════════════════════════════

-- Run this in Supabase Dashboard → Table Editor → Replication tab
-- Or via: ALTER PUBLICATION supabase_realtime ADD TABLE ...

ALTER PUBLICATION supabase_realtime ADD TABLE community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE community_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE community_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED DATA — Community categories
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO community_categories (name, slug, color) VALUES
  ('General',      'general',      '#0d9488'),
  ('Events',       'events',       '#7c3aed'),
  ('Projects',     'projects',     '#0891b2'),
  ('Fan Art',      'fan-art',      '#f59e0b'),
  ('Introductions','introductions','#16a34a'),
  ('Suggestions',  'suggestions',  '#6b7280');

INSERT INTO product_categories (name, slug) VALUES
  ('Apparel',      'apparel'),
  ('Accessories',  'accessories'),
  ('Photocards',   'photocards'),
  ('Bundles',      'bundles');

INSERT INTO event_categories (name, slug) VALUES
  ('Fan Meeting',  'fan-meeting'),
  ('Viewing Party','viewing-party'),
  ('Community',    'community'),
  ('Online',       'online');
