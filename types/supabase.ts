// AUTO-GENERATED — do not edit by hand.
//
// Generated from the live PostgREST schema (GET /rest/v1/), which publishes
// every table, column, format, primary key and foreign key. The Supabase CLI
// is the usual generator but requires a login; this produces the same shape.
//
// To regenerate after a migration:
//   curl -sS -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
//        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
//        "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/" -o /tmp/openapi.json
//   python3 scripts/gen-supabase-types.py /tmp/openapi.json types/supabase.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string;
          created_at: string | null;
          details: Json | null;
          id: string;
          ip_address: string | null;
          target_id: string | null;
          target_type: string | null;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string | null;
          details?: Json | null;
          id?: string;
          ip_address?: string | null;
          target_id?: string | null;
          target_type?: string | null;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string | null;
          details?: Json | null;
          id?: string;
          ip_address?: string | null;
          target_id?: string | null;
          target_type?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_log_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      badges: {
        Row: {
          description: string | null;
          icon_url: string | null;
          id: string;
          name: string;
          threshold_value: number | null;
          trigger_type: string;
        };
        Insert: {
          description?: string | null;
          icon_url?: string | null;
          id?: string;
          name: string;
          threshold_value?: number | null;
          trigger_type: string;
        };
        Update: {
          description?: string | null;
          icon_url?: string | null;
          id?: string;
          name?: string;
          threshold_value?: number | null;
          trigger_type?: string;
        };
        Relationships: [];
      };
      cart_items: {
        Row: {
          created_at: string;
          id: string;
          product_id: string;
          quantity: number;
          user_id: string;
          variant: Json | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          product_id: string;
          quantity?: number;
          user_id: string;
          variant?: Json | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          product_id?: string;
          quantity?: number;
          user_id?: string;
          variant?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      chat_members: {
        Row: {
          id: string;
          joined_at: string | null;
          last_read_at: string | null;
          nickname: string | null;
          room_id: string | null;
          user_id: string;
        };
        Insert: {
          id?: string;
          joined_at?: string | null;
          last_read_at?: string | null;
          nickname?: string | null;
          room_id?: string | null;
          user_id: string;
        };
        Update: {
          id?: string;
          joined_at?: string | null;
          last_read_at?: string | null;
          nickname?: string | null;
          room_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_members_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "chat_rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      chat_messages: {
        Row: {
          content: string;
          created_at: string | null;
          edited_at: string | null;
          id: string;
          image_url: string | null;
          is_pinned: boolean | null;
          reply_to_id: string | null;
          room_id: string | null;
          sender_id: string;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          edited_at?: string | null;
          id?: string;
          image_url?: string | null;
          is_pinned?: boolean | null;
          reply_to_id?: string | null;
          room_id?: string | null;
          sender_id: string;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          edited_at?: string | null;
          id?: string;
          image_url?: string | null;
          is_pinned?: boolean | null;
          reply_to_id?: string | null;
          room_id?: string | null;
          sender_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_messages_reply_to_id_fkey";
            columns: ["reply_to_id"];
            isOneToOne: false;
            referencedRelation: "chat_messages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "chat_rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      chat_nicknames: {
        Row: {
          created_at: string | null;
          id: string;
          nickname: string;
          room_id: string | null;
          set_by: string;
          target_user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          nickname: string;
          room_id?: string | null;
          set_by: string;
          target_user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          nickname?: string;
          room_id?: string | null;
          set_by?: string;
          target_user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_nicknames_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "chat_rooms";
            referencedColumns: ["id"];
          },
        ];
      };
      chat_reactions: {
        Row: {
          created_at: string | null;
          emoji: string;
          id: string;
          message_id: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          emoji: string;
          id?: string;
          message_id?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          emoji?: string;
          id?: string;
          message_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_reactions_message_id_fkey";
            columns: ["message_id"];
            isOneToOne: false;
            referencedRelation: "chat_messages";
            referencedColumns: ["id"];
          },
        ];
      };
      chat_rooms: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          created_by: string | null;
          id: string;
          is_group: boolean | null;
          name: string | null;
          pinned_message_id: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          is_group?: boolean | null;
          name?: string | null;
          pinned_message_id?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          is_group?: boolean | null;
          name?: string | null;
          pinned_message_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "chat_rooms_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_rooms_pinned_message_id_fkey";
            columns: ["pinned_message_id"];
            isOneToOne: false;
            referencedRelation: "chat_messages";
            referencedColumns: ["id"];
          },
        ];
      };
      community_categories: {
        Row: {
          color: string;
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          color?: string;
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          color?: string;
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      community_comments: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          is_hidden: boolean;
          parent_comment_id: string | null;
          post_id: string;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          is_hidden?: boolean;
          parent_comment_id?: string | null;
          post_id: string;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          is_hidden?: boolean;
          parent_comment_id?: string | null;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "community_comments_parent_comment_id_fkey";
            columns: ["parent_comment_id"];
            isOneToOne: false;
            referencedRelation: "community_comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "community_comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "community_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "community_comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      community_follows: {
        Row: {
          created_at: string;
          follower_id: string;
          following_id: string;
          id: string;
        };
        Insert: {
          created_at?: string;
          follower_id: string;
          following_id: string;
          id?: string;
        };
        Update: {
          created_at?: string;
          follower_id?: string;
          following_id?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "community_follows_follower_id_fkey";
            columns: ["follower_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "community_follows_following_id_fkey";
            columns: ["following_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      community_mentions: {
        Row: {
          comment_id: string | null;
          created_at: string;
          id: string;
          mentioned_user_id: string;
          post_id: string | null;
        };
        Insert: {
          comment_id?: string | null;
          created_at?: string;
          id?: string;
          mentioned_user_id: string;
          post_id?: string | null;
        };
        Update: {
          comment_id?: string | null;
          created_at?: string;
          id?: string;
          mentioned_user_id?: string;
          post_id?: string | null;
        };
        Relationships: [];
      };
      community_posts: {
        Row: {
          category_id: string | null;
          content: string;
          created_at: string;
          id: string;
          images: string[];
          is_hidden: boolean;
          is_pinned: boolean;
          updated_at: string | null;
          user_id: string;
          video_embed_url: string | null;
          video_platform: string | null;
          video_url: string | null;
          view_count: number | null;
        };
        Insert: {
          category_id?: string | null;
          content: string;
          created_at?: string;
          id?: string;
          images: string[];
          is_hidden?: boolean;
          is_pinned?: boolean;
          updated_at?: string | null;
          user_id: string;
          video_embed_url?: string | null;
          video_platform?: string | null;
          video_url?: string | null;
          view_count?: number | null;
        };
        Update: {
          category_id?: string | null;
          content?: string;
          created_at?: string;
          id?: string;
          images?: string[];
          is_hidden?: boolean;
          is_pinned?: boolean;
          updated_at?: string | null;
          user_id?: string;
          video_embed_url?: string | null;
          video_platform?: string | null;
          video_url?: string | null;
          view_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "community_posts_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "community_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "community_posts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      community_reactions: {
        Row: {
          created_at: string;
          id: string;
          post_id: string;
          reaction_type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          post_id: string;
          reaction_type: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          post_id?: string;
          reaction_type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "community_reactions_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "community_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "community_reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      community_reports: {
        Row: {
          comment_id: string | null;
          created_at: string;
          id: string;
          post_id: string | null;
          reason: string;
          reporter_id: string;
          resolution_note: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: string;
        };
        Insert: {
          comment_id?: string | null;
          created_at?: string;
          id?: string;
          post_id?: string | null;
          reason: string;
          reporter_id: string;
          resolution_note?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
        };
        Update: {
          comment_id?: string | null;
          created_at?: string;
          id?: string;
          post_id?: string | null;
          reason?: string;
          reporter_id?: string;
          resolution_note?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "community_reports_comment_id_fkey";
            columns: ["comment_id"];
            isOneToOne: false;
            referencedRelation: "community_comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "community_reports_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "community_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "community_reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      community_reposts: {
        Row: {
          created_at: string | null;
          id: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "community_reposts_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "community_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "community_reposts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      contact_messages: {
        Row: {
          created_at: string;
          email: string;
          handled_at: string | null;
          handled_by: string | null;
          id: string;
          ip: string | null;
          message: string;
          name: string;
          replies: Json;
          reply_note: string | null;
          status: string;
          topic: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          email: string;
          handled_at?: string | null;
          handled_by?: string | null;
          id?: string;
          ip?: string | null;
          message: string;
          name: string;
          replies: Json;
          reply_note?: string | null;
          status?: string;
          topic?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string;
          handled_at?: string | null;
          handled_by?: string | null;
          id?: string;
          ip?: string | null;
          message?: string;
          name?: string;
          replies?: Json;
          reply_note?: string | null;
          status?: string;
          topic?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      donation_drive_allocations: {
        Row: {
          amount: number;
          created_at: string;
          donation_id: string;
          drive_id: string;
          id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          donation_id: string;
          drive_id: string;
          id?: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          donation_id?: string;
          drive_id?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "donation_drive_allocations_donation_id_fkey";
            columns: ["donation_id"];
            isOneToOne: false;
            referencedRelation: "donations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "donation_drive_allocations_drive_id_fkey";
            columns: ["drive_id"];
            isOneToOne: false;
            referencedRelation: "donation_drives";
            referencedColumns: ["id"];
          },
        ];
      };
      donation_drives: {
        Row: {
          category: string;
          cover_url: string | null;
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          name: string;
          slug: string;
          sort_order: number;
          target_amount: number | null;
          updated_at: string | null;
        };
        Insert: {
          category?: string;
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          slug: string;
          sort_order?: number;
          target_amount?: number | null;
          updated_at?: string | null;
        };
        Update: {
          category?: string;
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          slug?: string;
          sort_order?: number;
          target_amount?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      donations: {
        Row: {
          amount: number;
          created_at: string;
          donation_amount: number | null;
          drive_ids: string[];
          id: string;
          is_anonymous: boolean;
          is_manual: boolean;
          manual_reference: string | null;
          message: string | null;
          payment_channel: string | null;
          payment_method: string | null;
          paymongo_ref: string | null;
          status: string;
          user_id: string | null;
        };
        Insert: {
          amount: number;
          created_at?: string;
          donation_amount?: number | null;
          drive_ids: string[];
          id?: string;
          is_anonymous?: boolean;
          is_manual?: boolean;
          manual_reference?: string | null;
          message?: string | null;
          payment_channel?: string | null;
          payment_method?: string | null;
          paymongo_ref?: string | null;
          status?: string;
          user_id?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string;
          donation_amount?: number | null;
          drive_ids?: string[];
          id?: string;
          is_anonymous?: boolean;
          is_manual?: boolean;
          manual_reference?: string | null;
          message?: string | null;
          payment_channel?: string | null;
          payment_method?: string | null;
          paymongo_ref?: string | null;
          status?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      email_deliveries: {
        Row: {
          bounce_type: string | null;
          bounced_at: string | null;
          broadcast_id: string | null;
          clicked_at: string | null;
          complained_at: string | null;
          delivered_at: string | null;
          email: string;
          id: string;
          kind: string;
          message_id: string | null;
          meta: Json | null;
          opened_at: string | null;
          sent_at: string;
          subject: string | null;
        };
        Insert: {
          bounce_type?: string | null;
          bounced_at?: string | null;
          broadcast_id?: string | null;
          clicked_at?: string | null;
          complained_at?: string | null;
          delivered_at?: string | null;
          email: string;
          id?: string;
          kind?: string;
          message_id?: string | null;
          meta?: Json | null;
          opened_at?: string | null;
          sent_at?: string;
          subject?: string | null;
        };
        Update: {
          bounce_type?: string | null;
          bounced_at?: string | null;
          broadcast_id?: string | null;
          clicked_at?: string | null;
          complained_at?: string | null;
          delivered_at?: string | null;
          email?: string;
          id?: string;
          kind?: string;
          message_id?: string | null;
          meta?: Json | null;
          opened_at?: string | null;
          sent_at?: string;
          subject?: string | null;
        };
        Relationships: [];
      };
      email_manual_templates: {
        Row: {
          created_at: string;
          html: string;
          id: string;
          is_builtin: boolean;
          name: string;
          subject: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          html: string;
          id?: string;
          is_builtin?: boolean;
          name: string;
          subject: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          html?: string;
          id?: string;
          is_builtin?: boolean;
          name?: string;
          subject?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      email_templates: {
        Row: {
          html: string;
          id: string;
          key: string;
          sections: Json | null;
          subject: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          html: string;
          id?: string;
          key: string;
          sections?: Json | null;
          subject: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          html?: string;
          id?: string;
          key?: string;
          sections?: Json | null;
          subject?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      event_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      event_fan_submissions: {
        Row: {
          caption: string | null;
          created_at: string | null;
          event_id: string | null;
          id: string;
          platform: string | null;
          status: string | null;
          thumbnail_url: string | null;
          url: string;
          user_id: string | null;
          username: string | null;
        };
        Insert: {
          caption?: string | null;
          created_at?: string | null;
          event_id?: string | null;
          id?: string;
          platform?: string | null;
          status?: string | null;
          thumbnail_url?: string | null;
          url: string;
          user_id?: string | null;
          username?: string | null;
        };
        Update: {
          caption?: string | null;
          created_at?: string | null;
          event_id?: string | null;
          id?: string;
          platform?: string | null;
          status?: string | null;
          thumbnail_url?: string | null;
          url?: string;
          user_id?: string | null;
          username?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "event_fan_submissions_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_fan_submissions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      event_registrations: {
        Row: {
          created_at: string;
          event_id: string;
          id: string;
          payment_status: string;
          paymongo_ref: string | null;
          qr_code: string | null;
          ticket_type: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          event_id: string;
          id?: string;
          payment_status?: string;
          paymongo_ref?: string | null;
          qr_code?: string | null;
          ticket_type?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          event_id?: string;
          id?: string;
          payment_status?: string;
          paymongo_ref?: string | null;
          qr_code?: string | null;
          ticket_type?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_registrations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      event_ticket_templates: {
        Row: {
          accent_color: string | null;
          bg_color: string | null;
          bg_image_url: string | null;
          created_at: string | null;
          custom_message: string | null;
          event_id: string | null;
          id: string;
          logo_url: string | null;
        };
        Insert: {
          accent_color?: string | null;
          bg_color?: string | null;
          bg_image_url?: string | null;
          created_at?: string | null;
          custom_message?: string | null;
          event_id?: string | null;
          id?: string;
          logo_url?: string | null;
        };
        Update: {
          accent_color?: string | null;
          bg_color?: string | null;
          bg_image_url?: string | null;
          created_at?: string | null;
          custom_message?: string | null;
          event_id?: string | null;
          id?: string;
          logo_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "event_ticket_templates_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      event_tickets: {
        Row: {
          bundle_id: string | null;
          checked_in_at: string | null;
          checked_in_by: string | null;
          created_at: string | null;
          event_id: string | null;
          id: string;
          payment_id: string | null;
          payment_status: string | null;
          qr_data: Json | null;
          status: string | null;
          ticket_number: string | null;
          tier_id: string | null;
          user_id: string | null;
        };
        Insert: {
          bundle_id?: string | null;
          checked_in_at?: string | null;
          checked_in_by?: string | null;
          created_at?: string | null;
          event_id?: string | null;
          id?: string;
          payment_id?: string | null;
          payment_status?: string | null;
          qr_data?: Json | null;
          status?: string | null;
          ticket_number?: string | null;
          tier_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          bundle_id?: string | null;
          checked_in_at?: string | null;
          checked_in_by?: string | null;
          created_at?: string | null;
          event_id?: string | null;
          id?: string;
          payment_id?: string | null;
          payment_status?: string | null;
          qr_data?: Json | null;
          status?: string | null;
          ticket_number?: string | null;
          tier_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "event_tickets_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_tickets_tier_id_fkey";
            columns: ["tier_id"];
            isOneToOne: false;
            referencedRelation: "event_tiers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_tickets_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      event_tiers: {
        Row: {
          bundle_size: number;
          capacity: number | null;
          color: string | null;
          created_at: string | null;
          event_id: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          perks: string[] | null;
          price: number | null;
          slots_remaining: number | null;
        };
        Insert: {
          bundle_size?: number;
          capacity?: number | null;
          color?: string | null;
          created_at?: string | null;
          event_id?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          perks?: string[] | null;
          price?: number | null;
          slots_remaining?: number | null;
        };
        Update: {
          bundle_size?: number;
          capacity?: number | null;
          color?: string | null;
          created_at?: string | null;
          event_id?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          perks?: string[] | null;
          price?: number | null;
          slots_remaining?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "event_tiers_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      event_waitlist: {
        Row: {
          converted_at: string | null;
          created_at: string;
          event_id: string;
          id: string;
          note: string | null;
          notified_at: string | null;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          converted_at?: string | null;
          created_at?: string;
          event_id: string;
          id?: string;
          note?: string | null;
          notified_at?: string | null;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          converted_at?: string | null;
          created_at?: string;
          event_id?: string;
          id?: string;
          note?: string | null;
          notified_at?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_waitlist_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          banner_url: string | null;
          body_font: string | null;
          bundle_size: number;
          capacity: number | null;
          category_id: string | null;
          created_at: string;
          date: string;
          description: string | null;
          guidelines_text: string | null;
          guidelines_url: string | null;
          heading_font: string | null;
          id: string;
          is_hidden: boolean;
          is_members_only: boolean;
          location: string | null;
          map_url: string | null;
          member_access_at: string | null;
          price: number;
          registration_closed: boolean;
          registration_closes_at: string | null;
          sponsor_access_at: string | null;
          status: string;
          title: string;
        };
        Insert: {
          banner_url?: string | null;
          body_font?: string | null;
          bundle_size?: number;
          capacity?: number | null;
          category_id?: string | null;
          created_at?: string;
          date: string;
          description?: string | null;
          guidelines_text?: string | null;
          guidelines_url?: string | null;
          heading_font?: string | null;
          id?: string;
          is_hidden?: boolean;
          is_members_only?: boolean;
          location?: string | null;
          map_url?: string | null;
          member_access_at?: string | null;
          price?: number;
          registration_closed?: boolean;
          registration_closes_at?: string | null;
          sponsor_access_at?: string | null;
          status?: string;
          title: string;
        };
        Update: {
          banner_url?: string | null;
          body_font?: string | null;
          bundle_size?: number;
          capacity?: number | null;
          category_id?: string | null;
          created_at?: string;
          date?: string;
          description?: string | null;
          guidelines_text?: string | null;
          guidelines_url?: string | null;
          heading_font?: string | null;
          id?: string;
          is_hidden?: boolean;
          is_members_only?: boolean;
          location?: string | null;
          map_url?: string | null;
          member_access_at?: string | null;
          price?: number;
          registration_closed?: boolean;
          registration_closes_at?: string | null;
          sponsor_access_at?: string | null;
          status?: string;
          title?: string;
        };
        Relationships: [];
      };
      exclusive_content: {
        Row: {
          category: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          is_published: boolean | null;
          media_url: string | null;
          thumbnail_url: string | null;
          title: string;
          type: string | null;
          uploaded_by: string | null;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_published?: boolean | null;
          media_url?: string | null;
          thumbnail_url?: string | null;
          title: string;
          type?: string | null;
          uploaded_by?: string | null;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_published?: boolean | null;
          media_url?: string | null;
          thumbnail_url?: string | null;
          title?: string;
          type?: string | null;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "exclusive_content_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      fan_letters: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          is_approved: boolean;
          title: string;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          is_approved?: boolean;
          title: string;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          is_approved?: boolean;
          title?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fan_letters_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      faqs: {
        Row: {
          answer: string;
          category: string;
          created_at: string;
          created_by: string | null;
          id: string;
          is_published: boolean;
          question: string;
          sort_order: number;
          updated_at: string;
          updated_by: string | null;
          view_count: number;
        };
        Insert: {
          answer: string;
          category?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_published?: boolean;
          question: string;
          sort_order?: number;
          updated_at?: string;
          updated_by?: string | null;
          view_count?: number;
        };
        Update: {
          answer?: string;
          category?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_published?: boolean;
          question?: string;
          sort_order?: number;
          updated_at?: string;
          updated_by?: string | null;
          view_count?: number;
        };
        Relationships: [];
      };
      feature_flags: {
        Row: {
          description: string | null;
          enabled: boolean;
          key: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          description?: string | null;
          enabled?: boolean;
          key: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          description?: string | null;
          enabled?: boolean;
          key?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      member_tag_assignments: {
        Row: {
          assigned_at: string;
          assigned_by: string | null;
          id: string;
          member_id: string;
          tag_id: string;
        };
        Insert: {
          assigned_at?: string;
          assigned_by?: string | null;
          id?: string;
          member_id: string;
          tag_id: string;
        };
        Update: {
          assigned_at?: string;
          assigned_by?: string | null;
          id?: string;
          member_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "member_tag_assignments_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "member_tags";
            referencedColumns: ["id"];
          },
        ];
      };
      member_tags: {
        Row: {
          color: string;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          name: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          color?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      mod_actions: {
        Row: {
          action_type: string;
          created_at: string | null;
          id: string;
          mod_id: string | null;
          notes: string | null;
          target_id: string | null;
          target_type: string | null;
        };
        Insert: {
          action_type: string;
          created_at?: string | null;
          id?: string;
          mod_id?: string | null;
          notes?: string | null;
          target_id?: string | null;
          target_type?: string | null;
        };
        Update: {
          action_type?: string;
          created_at?: string | null;
          id?: string;
          mod_id?: string | null;
          notes?: string | null;
          target_id?: string | null;
          target_type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_actions_mod_id_fkey";
            columns: ["mod_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      newsletter_subscribers: {
        Row: {
          email: string;
          id: string;
          opt_in_ip: string | null;
          source: string;
          subscribed_at: string;
          unsubscribe_token: string;
          unsubscribed_at: string | null;
          user_id: string | null;
        };
        Insert: {
          email: string;
          id?: string;
          opt_in_ip?: string | null;
          source?: string;
          subscribed_at?: string;
          unsubscribe_token?: string;
          unsubscribed_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          email?: string;
          id?: string;
          opt_in_ip?: string | null;
          source?: string;
          subscribed_at?: string;
          unsubscribe_token?: string;
          unsubscribed_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      notification_settings: {
        Row: {
          badges_email: boolean;
          community_email: boolean;
          email_badge_earned: boolean | null;
          email_community_replies: boolean | null;
          email_event_reminders: boolean | null;
          email_new_follower: boolean | null;
          email_order_updates: boolean | null;
          events_email: boolean;
          orders_email: boolean;
          user_id: string;
        };
        Insert: {
          badges_email?: boolean;
          community_email?: boolean;
          email_badge_earned?: boolean | null;
          email_community_replies?: boolean | null;
          email_event_reminders?: boolean | null;
          email_new_follower?: boolean | null;
          email_order_updates?: boolean | null;
          events_email?: boolean;
          orders_email?: boolean;
          user_id: string;
        };
        Update: {
          badges_email?: boolean;
          community_email?: boolean;
          email_badge_earned?: boolean | null;
          email_community_replies?: boolean | null;
          email_event_reminders?: boolean | null;
          email_new_follower?: boolean | null;
          email_order_updates?: boolean | null;
          events_email?: boolean;
          orders_email?: boolean;
          user_id?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          created_at: string;
          id: string;
          image_url: string | null;
          is_read: boolean;
          link: string | null;
          message: string;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          image_url?: string | null;
          is_read?: boolean;
          link?: string | null;
          message: string;
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          image_url?: string | null;
          is_read?: boolean;
          link?: string | null;
          message?: string;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          variant: Json | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          variant?: Json | null;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          quantity?: number;
          unit_price?: number;
          variant?: Json | null;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          courier: string | null;
          created_at: string;
          discount: number;
          id: string;
          items: Json;
          notes: string | null;
          order_status: string;
          payment_status: string;
          paymongo_ref: string | null;
          promo_code_id: string | null;
          shipped_at: string | null;
          shipping_address: Json;
          shipping_fee: number;
          subtotal: number;
          total: number;
          tracking_number: string | null;
          tracking_url: string | null;
          user_id: string;
        };
        Insert: {
          courier?: string | null;
          created_at?: string;
          discount?: number;
          id?: string;
          items: Json;
          notes?: string | null;
          order_status?: string;
          payment_status?: string;
          paymongo_ref?: string | null;
          promo_code_id?: string | null;
          shipped_at?: string | null;
          shipping_address: Json;
          shipping_fee?: number;
          subtotal: number;
          total: number;
          tracking_number?: string | null;
          tracking_url?: string | null;
          user_id: string;
        };
        Update: {
          courier?: string | null;
          created_at?: string;
          discount?: number;
          id?: string;
          items?: Json;
          notes?: string | null;
          order_status?: string;
          payment_status?: string;
          paymongo_ref?: string | null;
          promo_code_id?: string | null;
          shipped_at?: string | null;
          shipping_address?: Json;
          shipping_fee?: number;
          subtotal?: number;
          total?: number;
          tracking_number?: string | null;
          tracking_url?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      payment_transactions: {
        Row: {
          amount: number;
          created_at: string | null;
          currency: string | null;
          id: string;
          metadata: Json | null;
          paid_at: string | null;
          payment_link_id: string | null;
          reference_id: string | null;
          status: string | null;
          type: string;
          user_id: string | null;
        };
        Insert: {
          amount: number;
          created_at?: string | null;
          currency?: string | null;
          id?: string;
          metadata?: Json | null;
          paid_at?: string | null;
          payment_link_id?: string | null;
          reference_id?: string | null;
          status?: string | null;
          type: string;
          user_id?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string | null;
          currency?: string | null;
          id?: string;
          metadata?: Json | null;
          paid_at?: string | null;
          payment_link_id?: string | null;
          reference_id?: string | null;
          status?: string | null;
          type?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payment_transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      poll_options: {
        Row: {
          created_at: string;
          id: string;
          label: string;
          poll_id: string;
          sort_order: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          label: string;
          poll_id: string;
          sort_order?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          label?: string;
          poll_id?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "poll_options_poll_id_fkey";
            columns: ["poll_id"];
            isOneToOne: false;
            referencedRelation: "polls";
            referencedColumns: ["id"];
          },
        ];
      };
      poll_votes: {
        Row: {
          id: string;
          option_id: string;
          poll_id: string;
          user_id: string;
          voted_at: string;
        };
        Insert: {
          id?: string;
          option_id: string;
          poll_id: string;
          user_id: string;
          voted_at?: string;
        };
        Update: {
          id?: string;
          option_id?: string;
          poll_id?: string;
          user_id?: string;
          voted_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "poll_votes_option_id_fkey";
            columns: ["option_id"];
            isOneToOne: false;
            referencedRelation: "poll_options";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "poll_votes_poll_id_fkey";
            columns: ["poll_id"];
            isOneToOne: false;
            referencedRelation: "polls";
            referencedColumns: ["id"];
          },
        ];
      };
      polls: {
        Row: {
          category: string;
          created_at: string;
          created_by: string | null;
          description: string | null;
          ends_at: string | null;
          id: string;
          is_published: boolean;
          question: string;
          results_visible: string;
          updated_at: string;
        };
        Insert: {
          category?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          ends_at?: string | null;
          id?: string;
          is_published?: boolean;
          question: string;
          results_visible?: string;
          updated_at?: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          ends_at?: string | null;
          id?: string;
          is_published?: boolean;
          question?: string;
          results_visible?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          thumbnail_url: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          thumbnail_url?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          thumbnail_url?: string | null;
        };
        Relationships: [];
      };
      products: {
        Row: {
          category_id: string | null;
          created_at: string;
          description: string | null;
          id: string;
          images: string[];
          is_active: boolean;
          name: string;
          price: number;
          stock: number;
          variants: Json | null;
          weight_kg: number | null;
        };
        Insert: {
          category_id?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          images: string[];
          is_active?: boolean;
          name: string;
          price: number;
          stock?: number;
          variants?: Json | null;
          weight_kg?: number | null;
        };
        Update: {
          category_id?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          images?: string[];
          is_active?: boolean;
          name?: string;
          price?: number;
          stock?: number;
          variants?: Json | null;
          weight_kg?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "product_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          display_name: string | null;
          email: string | null;
          facebook: string | null;
          id: string;
          image_post_count: number | null;
          image_post_reset_at: string | null;
          instagram: string | null;
          is_banned: boolean | null;
          is_event_staff: boolean;
          is_public: boolean;
          location: string | null;
          role: string;
          social_links: Json | null;
          twitter: string | null;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          facebook?: string | null;
          id: string;
          image_post_count?: number | null;
          image_post_reset_at?: string | null;
          instagram?: string | null;
          is_banned?: boolean | null;
          is_event_staff?: boolean;
          is_public?: boolean;
          location?: string | null;
          role?: string;
          social_links?: Json | null;
          twitter?: string | null;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          facebook?: string | null;
          id?: string;
          image_post_count?: number | null;
          image_post_reset_at?: string | null;
          instagram?: string | null;
          is_banned?: boolean | null;
          is_event_staff?: boolean;
          is_public?: boolean;
          location?: string | null;
          role?: string;
          social_links?: Json | null;
          twitter?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      project_media: {
        Row: {
          caption: string | null;
          file_type: string;
          file_url: string;
          id: string;
          project_id: string;
          uploaded_at: string;
        };
        Insert: {
          caption?: string | null;
          file_type: string;
          file_url: string;
          id?: string;
          project_id: string;
          uploaded_at?: string;
        };
        Update: {
          caption?: string | null;
          file_type?: string;
          file_url?: string;
          id?: string;
          project_id?: string;
          uploaded_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          category: string | null;
          cover_image: string | null;
          created_at: string;
          description: string | null;
          end_date: string | null;
          id: string;
          progress_percent: number | null;
          start_date: string | null;
          status: string;
          title: string;
        };
        Insert: {
          category?: string | null;
          cover_image?: string | null;
          created_at?: string;
          description?: string | null;
          end_date?: string | null;
          id?: string;
          progress_percent?: number | null;
          start_date?: string | null;
          status?: string;
          title: string;
        };
        Update: {
          category?: string | null;
          cover_image?: string | null;
          created_at?: string;
          description?: string | null;
          end_date?: string | null;
          id?: string;
          progress_percent?: number | null;
          start_date?: string | null;
          status?: string;
          title?: string;
        };
        Relationships: [];
      };
      promo_code_usage: {
        Row: {
          id: string;
          order_id: string | null;
          promo_code_id: string;
          used_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          promo_code_id: string;
          used_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          order_id?: string | null;
          promo_code_id?: string;
          used_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      promo_codes: {
        Row: {
          code: string;
          created_at: string;
          discount_type: string;
          discount_value: number;
          expires_at: string | null;
          id: string;
          is_active: boolean;
          max_uses: number | null;
          product_ids: string[] | null;
          used_count: number;
        };
        Insert: {
          code: string;
          created_at?: string;
          discount_type: string;
          discount_value: number;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean;
          max_uses?: number | null;
          product_ids?: string[] | null;
          used_count?: number;
        };
        Update: {
          code?: string;
          created_at?: string;
          discount_type?: string;
          discount_value?: number;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean;
          max_uses?: number | null;
          product_ids?: string[] | null;
          used_count?: number;
        };
        Relationships: [];
      };
      refunds: {
        Row: {
          amount: number;
          created_at: string;
          entity_id: string;
          entity_type: string;
          id: string;
          note: string | null;
          paymongo_ref: string | null;
          processed_at: string | null;
          processed_by: string | null;
          reason: string;
          requested_by: string;
          status: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          amount: number;
          created_at?: string;
          entity_id: string;
          entity_type: string;
          id?: string;
          note?: string | null;
          paymongo_ref?: string | null;
          processed_at?: string | null;
          processed_by?: string | null;
          reason: string;
          requested_by: string;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          note?: string | null;
          paymongo_ref?: string | null;
          processed_at?: string | null;
          processed_by?: string | null;
          reason?: string;
          requested_by?: string;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "refunds_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      report_receipts: {
        Row: {
          file_name: string | null;
          file_url: string | null;
          id: string;
          is_note_only: boolean;
          item_description: string;
          note: string | null;
          project_name: string;
          report_id: string;
          uploaded_at: string;
        };
        Insert: {
          file_name?: string | null;
          file_url?: string | null;
          id?: string;
          is_note_only?: boolean;
          item_description: string;
          note?: string | null;
          project_name: string;
          report_id: string;
          uploaded_at?: string;
        };
        Update: {
          file_name?: string | null;
          file_url?: string | null;
          id?: string;
          is_note_only?: boolean;
          item_description?: string;
          note?: string | null;
          project_name?: string;
          report_id?: string;
          uploaded_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "report_receipts_report_id_fkey";
            columns: ["report_id"];
            isOneToOne: false;
            referencedRelation: "transparency_reports";
            referencedColumns: ["id"];
          },
        ];
      };
      shipping_rates: {
        Row: {
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          rate: number;
          region: string;
          weight_from: number;
          weight_to: number;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          rate: number;
          region: string;
          weight_from: number;
          weight_to: number;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          rate?: number;
          region?: string;
          weight_from?: number;
          weight_to?: number;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          announcement_active: boolean | null;
          announcement_color: string | null;
          announcement_cta_label: string | null;
          announcement_cta_url: string | null;
          announcement_ends_at: string | null;
          announcement_starts_at: string | null;
          announcement_text: string | null;
          id: string;
          maintenance_mode: boolean | null;
          max_community_post_length: number | null;
          max_image_posts_per_month: number | null;
          updated_at: string | null;
          updated_by: string | null;
        };
        Insert: {
          announcement_active?: boolean | null;
          announcement_color?: string | null;
          announcement_cta_label?: string | null;
          announcement_cta_url?: string | null;
          announcement_ends_at?: string | null;
          announcement_starts_at?: string | null;
          announcement_text?: string | null;
          id?: string;
          maintenance_mode?: boolean | null;
          max_community_post_length?: number | null;
          max_image_posts_per_month?: number | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          announcement_active?: boolean | null;
          announcement_color?: string | null;
          announcement_cta_label?: string | null;
          announcement_cta_url?: string | null;
          announcement_ends_at?: string | null;
          announcement_starts_at?: string | null;
          announcement_text?: string | null;
          id?: string;
          maintenance_mode?: boolean | null;
          max_community_post_length?: number | null;
          max_image_posts_per_month?: number | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      sponsor_perks: {
        Row: {
          active: boolean | null;
          created_at: string | null;
          early_access_days: number | null;
          id: string;
          max_sponsors: number | null;
        };
        Insert: {
          active?: boolean | null;
          created_at?: string | null;
          early_access_days?: number | null;
          id?: string;
          max_sponsors?: number | null;
        };
        Update: {
          active?: boolean | null;
          created_at?: string | null;
          early_access_days?: number | null;
          id?: string;
          max_sponsors?: number | null;
        };
        Relationships: [];
      };
      support_tickets: {
        Row: {
          admin_notes: string | null;
          attachments: string[] | null;
          category: string | null;
          created_at: string | null;
          id: string;
          member_replied_at: string | null;
          member_reply: string | null;
          message: string;
          priority: string | null;
          status: string | null;
          subject: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          admin_notes?: string | null;
          attachments?: string[] | null;
          category?: string | null;
          created_at?: string | null;
          id?: string;
          member_replied_at?: string | null;
          member_reply?: string | null;
          message: string;
          priority?: string | null;
          status?: string | null;
          subject: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          admin_notes?: string | null;
          attachments?: string[] | null;
          category?: string | null;
          created_at?: string | null;
          id?: string;
          member_replied_at?: string | null;
          member_reply?: string | null;
          message?: string;
          priority?: string | null;
          status?: string | null;
          subject?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      tr_reactions: {
        Row: {
          created_at: string;
          id: string;
          reaction_type: string;
          tr_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          reaction_type: string;
          tr_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          reaction_type?: string;
          tr_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      transparency_reports: {
        Row: {
          content: string | null;
          created_at: string;
          fund_breakdown: Json | null;
          id: string;
          is_published: boolean;
          pdf_url: string | null;
          projects_covered: string[] | null;
          published_at: string | null;
          quarter: number;
          summary: string | null;
          title: string;
          year: number;
        };
        Insert: {
          content?: string | null;
          created_at?: string;
          fund_breakdown?: Json | null;
          id?: string;
          is_published?: boolean;
          pdf_url?: string | null;
          projects_covered?: string[] | null;
          published_at?: string | null;
          quarter: number;
          summary?: string | null;
          title: string;
          year: number;
        };
        Update: {
          content?: string | null;
          created_at?: string;
          fund_breakdown?: Json | null;
          id?: string;
          is_published?: boolean;
          pdf_url?: string | null;
          projects_covered?: string[] | null;
          published_at?: string | null;
          quarter?: number;
          summary?: string | null;
          title?: string;
          year?: number;
        };
        Relationships: [];
      };
      user_badges: {
        Row: {
          badge_id: string;
          earned_at: string;
          id: string;
          user_id: string;
        };
        Insert: {
          badge_id: string;
          earned_at?: string;
          id?: string;
          user_id: string;
        };
        Update: {
          badge_id?: string;
          earned_at?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_badges_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_promo_codes: {
        Row: {
          assigned_at: string;
          id: string;
          promo_code_id: string;
          user_id: string;
        };
        Insert: {
          assigned_at?: string;
          id?: string;
          promo_code_id: string;
          user_id: string;
        };
        Update: {
          assigned_at?: string;
          id?: string;
          promo_code_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      cleanup_stale_pending_tickets: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
      decrement_product_stock: {
        Args: {
          p_items: Json;
        };
        Returns: unknown;
      };
      increment_image_post_count: {
        Args: {
          uid: string;
        };
        Returns: unknown;
      };
      increment_post_view_count: {
        Args: {
          pid: string;
        };
        Returns: unknown;
      };
      increment_post_views: {
        Args: {
          post_id: string;
        };
        Returns: unknown;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
