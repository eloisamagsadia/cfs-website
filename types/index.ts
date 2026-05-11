// ─── DATABASE TYPES ───────────────────────────────────────────────────────────
// These mirror the Supabase schema. Update when schema changes.

export type UserRole = "member" | "admin";
export type PaymentStatus = "pending" | "paid" | "free" | "cancelled" | "failed";
export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";
export type EventStatus = "upcoming" | "ongoing" | "completed" | "cancelled";
export type ProjectStatus = "ongoing" | "completed";
export type NotificationType =
  | "event_reminder"
  | "order_update"
  | "community_reply"
  | "community_mention"
  | "badge_earned"
  | "new_report"
  | "donation_ack"
  | "new_follower";

export type ReactionType = "like" | "heart" | "support";
export type DiscountType = "percent" | "fixed";
export type MediaType = "image" | "video";
export type ReportStatus = "pending" | "reviewed" | "resolved";

// ─── PROFILE ──────────────────────────────────────────────────────────────────
export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_public: boolean;
  social_links: Record<string, string> | null;
  role: UserRole;
  created_at: string;
}

// ─── EVENT ────────────────────────────────────────────────────────────────────
export interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  map_url: string | null;
  capacity: number | null;
  price: number;
  is_members_only: boolean;
  banner_url: string | null;
  status: EventStatus;
  category_id: string | null;
  created_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  ticket_type: string | null;
  payment_status: PaymentStatus;
  paymongo_ref: string | null;
  qr_code: string | null;
  created_at: string;
}

// ─── SHOP ─────────────────────────────────────────────────────────────────────
export interface ProductVariant {
  name: string;
  options: string[];
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category_id: string | null;
  images: string[];
  variants: ProductVariant[] | null;
  is_active: boolean;
  created_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  variant: Record<string, string> | null;
  created_at: string;
  product?: Product;
}

export interface ShippingAddress {
  full_name: string;
  phone: string;
  street: string;
  barangay: string;
  city: string;
  province: string;
  region: string;
  zip_code: string;
}

export interface Order {
  id: string;
  user_id: string;
  items: CartItem[];
  subtotal: number;
  shipping_fee: number;
  discount: number;
  total: number;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  paymongo_ref: string | null;
  shipping_address: ShippingAddress;
  promo_code_id: string | null;
  created_at: string;
}

// ─── COMMUNITY ────────────────────────────────────────────────────────────────
export interface CommunityPost {
  id: string;
  user_id: string;
  content: string;
  images: string[];
  category_id: string | null;
  is_pinned: boolean;
  is_hidden: boolean;
  created_at: string;
  updated_at: string | null;
  view_count?: number;
  author?: Profile;
  reactions?: CommunityReaction[];
  comments_count?: number;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  is_hidden: boolean;
  created_at: string;
  author?: Profile;
  replies?: CommunityComment[];
}

export interface CommunityReaction {
  id: string;
  post_id: string;
  user_id: string;
  reaction_type: ReactionType;
  created_at: string;
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

// ─── BADGES ───────────────────────────────────────────────────────────────────
export interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  trigger_type: string;
  threshold_value: number | null;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

// ─── PROMO CODES ──────────────────────────────────────────────────────────────
export interface PromoCode {
  id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

// ─── TRANSPARENCY REPORTS ─────────────────────────────────────────────────────
export interface TransparencyReport {
  id: string;
  title: string;
  year: number;
  quarter: number;
  content: string | null;
  pdf_url: string | null;
  summary: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
}

// ─── UTILS ────────────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
