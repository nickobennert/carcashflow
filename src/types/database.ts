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
          phone: string | null
          city: string | null
          training_location: string | null
          training_date: string | null
          theme_preference: string
          notification_preferences: Json
          push_enabled: boolean
          is_banned: boolean
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
          phone?: string | null
          city?: string | null
          training_location?: string | null
          training_date?: string | null
          theme_preference?: string
          notification_preferences?: Json
          push_enabled?: boolean
          is_banned?: boolean
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
          phone?: string | null
          city?: string | null
          training_location?: string | null
          training_date?: string | null
          theme_preference?: string
          notification_preferences?: Json
          push_enabled?: boolean
          is_banned?: boolean
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
          is_recurring: boolean
          recurring_days: number[] | null
          recurring_until: string | null
          parent_ride_id: string | null
          // Route geometry from OSRM routing
          route_geometry: [number, number][] | null
          route_distance: number | null
          route_duration: number | null
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
          is_recurring?: boolean
          recurring_days?: number[] | null
          recurring_until?: string | null
          parent_ride_id?: string | null
          route_geometry?: [number, number][] | null
          route_distance?: number | null
          route_duration?: number | null
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
          is_recurring?: boolean
          recurring_days?: number[] | null
          recurring_until?: string | null
          parent_ride_id?: string | null
          route_geometry?: [number, number][] | null
          route_distance?: number | null
          route_duration?: number | null
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
      bug_reports: {
        Row: {
          id: string
          user_id: string
          title: string
          area: string
          description: string
          worked_before: string | null
          expected_behavior: string | null
          screencast_url: string | null
          screenshots: string[] | null
          status: "open" | "in_progress" | "resolved" | "wont_fix"
          admin_notes: string | null
          user_agent: string | null
          created_at: string
          resolved_at: string | null
          resolved_by: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          area: string
          description: string
          worked_before?: string | null
          expected_behavior?: string | null
          screencast_url?: string | null
          screenshots?: string[] | null
          status?: "open" | "in_progress" | "resolved" | "wont_fix"
          admin_notes?: string | null
          user_agent?: string | null
          created_at?: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          area?: string
          description?: string
          worked_before?: string | null
          expected_behavior?: string | null
          screencast_url?: string | null
          screenshots?: string[] | null
          status?: "open" | "in_progress" | "resolved" | "wont_fix"
          admin_notes?: string | null
          user_agent?: string | null
          created_at?: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
      }
      hidden_conversations: {
        Row: {
          id: string
          user_id: string
          conversation_id: string
          hidden_at: string
        }
        Insert: {
          id?: string
          user_id: string
          conversation_id: string
          hidden_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          conversation_id?: string
          hidden_at?: string
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
export type RideType = "offer" | "request"
export type RideStatus = "active" | "completed" | "cancelled" | "expired"
export type ReportReason = "spam" | "inappropriate" | "fake" | "harassment" | "other"
export type ReportStatus = "pending" | "reviewed" | "resolved" | "dismissed"
export type NotificationType = "new_message" | "ride_match" | "system"
export type LegalAcceptanceType = "rideshare_terms" | "privacy_policy" | "terms_of_service" | "disclaimer_banner" | "insurance_notice"
export type AdminRole = "super_admin" | "admin" | "moderator"
export type RouteWatchType = "location" | "route"
export type BugReportStatus = "open" | "in_progress" | "resolved" | "closed"
export type BugReportArea = "dashboard" | "messages" | "profile" | "settings" | "other"

// Route Watch interface (for storing in localStorage or user preferences)
export interface RouteWatch {
  id: string
  type: RouteWatchType
  name: string
  // For location-based watch
  lat?: number
  lng?: number
  radius?: number  // in km
  address?: string
  // For route-based watch
  startLat?: number
  startLng?: number
  startAddress?: string
  endLat?: number
  endLng?: number
  endAddress?: string
  // Preferences
  rideType?: "offer" | "request" | "both"
  createdAt: string
  lastNotifiedAt?: string
}

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
export type BugReport = Database["public"]["Tables"]["bug_reports"]["Row"]
export type Notification = Database["public"]["Tables"]["notifications"]["Row"]
export type LegalAcceptance = Database["public"]["Tables"]["legal_acceptances"]["Row"]

// Extended types with relations
export type RideWithUser = Ride & {
  profiles: Pick<Profile, "id" | "username" | "first_name" | "last_name" | "avatar_url" | "city">
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

// Bug Report types (uses Database type, see bug_reports table)
export interface BugReportWithUser extends BugReport {
  user: Pick<Profile, "id" | "username" | "first_name" | "last_name" | "avatar_url" | "email">
}

// ============================================
// E2E Encryption Types
// ============================================

// User's public key stored on server for key exchange
export interface UserPublicKey {
  id: string
  user_id: string
  public_key: string // Base64 encoded ECDH public key
  fingerprint: string // SHA-256 fingerprint for verification
  created_at: string
  updated_at: string
}

// Encrypted conversation key (encrypted for each participant)
export interface ConversationKey {
  id: string
  conversation_id: string
  user_id: string
  encrypted_key: string // AES key encrypted with user's public key
  created_at: string
}

// Message with encryption metadata
export interface EncryptedMessageRow {
  id: string
  conversation_id: string
  sender_id: string
  content: string // JSON: { ciphertext, iv, version }
  is_encrypted: boolean
  is_read: boolean
  created_at: string
}

// Extended message type for E2E
export type MessageWithSenderE2E = EncryptedMessageRow & {
  sender: Pick<Profile, "id" | "username" | "first_name" | "last_name" | "avatar_url">
  decrypted_content?: string // Client-side decrypted content
}
