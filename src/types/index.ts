export * from "./database"

// Auth types
export interface AuthUser {
  id: string
  email: string
  user_metadata: {
    first_name?: string
    last_name?: string
    avatar_url?: string
  }
}

// Form types
export interface LoginFormData {
  email: string
  password: string
}

export interface SignupFormData {
  email: string
  password: string
  first_name: string
}

export interface ProfileSetupFormData {
  username: string
  first_name: string
  last_name?: string
  city?: string
  training_location?: string
}

export interface RideFormData {
  type: "offer" | "request"
  route: {
    type: "start" | "stop" | "end"
    address: string
    lat?: number
    lng?: number
    order: number
  }[]
  departure_date: Date
  departure_time?: string
  seats_available: number
  comment?: string
}

// API Response types
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

// Match data for ride cards in the feed
export interface MatchData {
  similarity?: number
  onTheWay?: boolean
  matchTier?: "direct" | "small_detour" | "detour" | "none"
  minDistance?: number | null
  matchDetails?: string[]
  distance?: number
}

// Notification preferences
export interface NotificationPreferences {
  email: boolean
  push: boolean
  new_message: boolean
  new_ride: boolean
}
