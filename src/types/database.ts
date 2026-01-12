export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          email: string | null
          first_name: string | null
          last_name: string | null
          avatar_url: string | null
          bio: string | null
          phone: string | null
          city: string | null
          training_location: string | null
          training_date: string | null
          is_public: boolean
          theme_preference: string
          notification_preferences: Json
          subscription_tier: SubscriptionTier
          subscription_status: SubscriptionStatus
          trial_ends_at: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          current_period_end: string | null
          is_lifetime: boolean
          created_at: string
          updated_at: string
          last_seen_at: string | null
        }
        Insert: {
          id: string
          username: string
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          phone?: string | null
          city?: string | null
          training_location?: string | null
          training_date?: string | null
          is_public?: boolean
          theme_preference?: string
          notification_preferences?: Json
          subscription_tier?: SubscriptionTier
          subscription_status?: SubscriptionStatus
          trial_ends_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          current_period_end?: string | null
          is_lifetime?: boolean
          created_at?: string
          updated_at?: string
          last_seen_at?: string | null
        }
        Update: {
          id?: string
          username?: string
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          phone?: string | null
          city?: string | null
          training_location?: string | null
          training_date?: string | null
          is_public?: boolean
          theme_preference?: string
          notification_preferences?: Json
          subscription_tier?: SubscriptionTier
          subscription_status?: SubscriptionStatus
          trial_ends_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          current_period_end?: string | null
          is_lifetime?: boolean
          created_at?: string
          updated_at?: string
          last_seen_at?: string | null
        }
      }
      rides: {
        Row: {
          id: string
          user_id: string
          type: RideType
          route: RoutePoint[]
          departure_date: string
          departure_time: string | null
          seats_available: number
          comment: string | null
          status: RideStatus
          created_at: string
          updated_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          type: RideType
          route: RoutePoint[]
          departure_date: string
          departure_time?: string | null
          seats_available?: number
          comment?: string | null
          status?: RideStatus
          created_at?: string
          updated_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: RideType
          route?: RoutePoint[]
          departure_date?: string
          departure_time?: string | null
          seats_available?: number
          comment?: string | null
          status?: RideStatus
          created_at?: string
          updated_at?: string
          expires_at?: string | null
        }
      }
      conversations: {
        Row: {
          id: string
          participant_1: string
          participant_2: string
          ride_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          participant_1: string
          participant_2: string
          ride_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          participant_1?: string
          participant_2?: string
          ride_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          is_read?: boolean
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          reported_user_id: string | null
          reported_ride_id: string | null
          reason: ReportReason
          description: string | null
          status: ReportStatus
          admin_notes: string | null
          created_at: string
          resolved_at: string | null
          resolved_by: string | null
        }
        Insert: {
          id?: string
          reporter_id: string
          reported_user_id?: string | null
          reported_ride_id?: string | null
          reason: ReportReason
          description?: string | null
          status?: ReportStatus
          admin_notes?: string | null
          created_at?: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Update: {
          id?: string
          reporter_id?: string
          reported_user_id?: string | null
          reported_ride_id?: string | null
          reason?: ReportReason
          description?: string | null
          status?: ReportStatus
          admin_notes?: string | null
          created_at?: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: NotificationType
          title: string
          message: string
          data: Json | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: NotificationType
          title: string
          message: string
          data?: Json | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: NotificationType
          title?: string
          message?: string
          data?: Json | null
          is_read?: boolean
          created_at?: string
        }
      }
      legal_acceptances: {
        Row: {
          id: string
          user_id: string
          acceptance_type: LegalAcceptanceType
          version: string
          accepted_at: string
          ip_address: string | null
        }
        Insert: {
          id?: string
          user_id: string
          acceptance_type: LegalAcceptanceType
          version: string
          accepted_at?: string
          ip_address?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          acceptance_type?: LegalAcceptanceType
          version?: string
          accepted_at?: string
          ip_address?: string | null
        }
      }
      super_admins: {
        Row: {
          id: string
          user_id: string
          role: AdminRole
          permissions: Json
          added_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role?: AdminRole
          permissions?: Json
          added_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: AdminRole
          permissions?: Json
          added_by?: string | null
          created_at?: string
        }
      }
      connections: {
        Row: {
          id: string
          requester_id: string
          addressee_id: string
          status: ConnectionStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          requester_id: string
          addressee_id: string
          status?: ConnectionStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          requester_id?: string
          addressee_id?: string
          status?: ConnectionStatus
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Custom Types
export type SubscriptionTier = "trial" | "basic" | "premium" | "lifetime"
export type SubscriptionStatus = "trialing" | "active" | "canceled" | "frozen" | "lifetime"
export type RideType = "offer" | "request"
export type RideStatus = "active" | "completed" | "cancelled" | "expired"
export type ReportReason = "spam" | "inappropriate" | "fake" | "harassment" | "other"
export type ReportStatus = "pending" | "reviewed" | "resolved" | "dismissed"
export type NotificationType = "new_message" | "connection_request" | "ride_match" | "system"
export type LegalAcceptanceType = "rideshare_terms" | "privacy_policy" | "terms_of_service"
export type AdminRole = "super_admin" | "admin" | "moderator"
export type ConnectionStatus = "pending" | "accepted" | "blocked"

export interface RoutePoint {
  type: "start" | "stop" | "end"
  address: string
  lat?: number
  lng?: number
  order: number
}

// Convenience types for common queries
export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"]
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"]

export type Ride = Database["public"]["Tables"]["rides"]["Row"]
export type RideInsert = Database["public"]["Tables"]["rides"]["Insert"]
export type RideUpdate = Database["public"]["Tables"]["rides"]["Update"]

export type Conversation = Database["public"]["Tables"]["conversations"]["Row"]
export type Message = Database["public"]["Tables"]["messages"]["Row"]
export type Report = Database["public"]["Tables"]["reports"]["Row"]
export type Notification = Database["public"]["Tables"]["notifications"]["Row"]
export type LegalAcceptance = Database["public"]["Tables"]["legal_acceptances"]["Row"]

// Extended types with relations
export type RideWithUser = Ride & {
  profiles: Pick<Profile, "id" | "username" | "first_name" | "last_name" | "avatar_url" | "city" | "bio">
}

export type ConversationWithDetails = Conversation & {
  participant_1_profile: Pick<Profile, "id" | "username" | "first_name" | "last_name" | "avatar_url">
  participant_2_profile: Pick<Profile, "id" | "username" | "first_name" | "last_name" | "avatar_url">
  ride?: Pick<Ride, "id" | "type" | "route" | "departure_date"> | null
  last_message?: Pick<Message, "content" | "created_at" | "sender_id"> | null
  unread_count?: number
}

export type MessageWithSender = Message & {
  sender: Pick<Profile, "id" | "username" | "first_name" | "last_name" | "avatar_url">
}

// Connection types
export type Connection = Database["public"]["Tables"]["connections"]["Row"]
export type ConnectionInsert = Database["public"]["Tables"]["connections"]["Insert"]
export type ConnectionUpdate = Database["public"]["Tables"]["connections"]["Update"]

export type ConnectionWithProfile = Connection & {
  requester: Pick<Profile, "id" | "username" | "first_name" | "last_name" | "avatar_url" | "city">
  addressee: Pick<Profile, "id" | "username" | "first_name" | "last_name" | "avatar_url" | "city">
}
