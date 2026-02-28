// ──────────────────────────────────────────
// KalanConnect — Types TypeScript
// ──────────────────────────────────────────

export interface User {
  id: number;
  phone: string;
  first_name: string;
  last_name: string;
  email: string;
  role: "parent" | "teacher" | "admin";
  avatar: string | null;
  city: string;
  neighborhood: string;
  is_phone_verified: boolean;
  has_active_subscription: boolean;
  created_at: string;
}

export interface UserMinimal {
  id: number;
  first_name: string;
  last_name: string;
  avatar: string | null;
  role: string;
}

export interface Subject {
  id: number;
  name: string;
  slug: string;
  icon: string;
  category: string;
}

export interface Level {
  id: number;
  name: string;
  slug: string;
  order: number;
}

export interface TeacherSubject {
  subject: Subject;
  level: Level;
}

export interface Diploma {
  id: number;
  title: string;
  institution: string;
  year: number;
  document: string | null;
}

export interface Availability {
  id: number;
  day_of_week: number;
  day_name: string;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
}

export interface TeacherProfile {
  id: number;
  user: UserMinimal;
  photo: string;
  bio: string;
  hourly_rate: number;
  city: string;
  neighborhood: string;
  latitude: number | null;
  longitude: number | null;
  radius_km: number;
  experience_years: number;
  teaches_online: boolean;
  teaches_at_home: boolean;
  teaches_at_student: boolean;
  avg_rating: number;
  total_reviews: number;
  total_bookings: number;
  response_time_hours: number;
  is_verified: boolean;
  is_featured: boolean;
  teacher_subjects: TeacherSubject[];
  diplomas: Diploma[];
  availabilities: Availability[];
  created_at: string;
}

export interface TeacherListItem {
  id: number;
  user: UserMinimal;
  photo: string;
  bio: string;
  hourly_rate: number;
  city: string;
  neighborhood: string;
  experience_years: number;
  avg_rating: number;
  total_reviews: number;
  is_verified: boolean;
  is_featured: boolean;
  teaches_online: boolean;
  subjects: string[];
  distance_km?: number;
}

export interface Booking {
  id: number;
  teacher: number;
  teacher_name: string;
  parent: UserMinimal;
  subject: number;
  subject_name: string;
  date: string;
  start_time: string;
  end_time: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
  location_type: "at_teacher" | "at_student" | "online";
  address: string;
  price: number;
  notes: string;
  created_at: string;
}

export interface Review {
  id: number;
  teacher: number;
  parent: UserMinimal;
  booking: number;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Conversation {
  id: number;
  other_participant: UserMinimal;
  last_message: {
    content: string;
    sender_id: number;
    created_at: string;
    is_read: boolean;
  } | null;
  unread_count: number;
  last_message_at: string;
}

export interface Message {
  id: number;
  conversation: number;
  sender: UserMinimal;
  content: string;
  message_type: "text" | "image" | "booking" | "system";
  attachment: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Subscription {
  id: number;
  plan: "monthly" | "annual";
  status: "active" | "expired" | "cancelled" | "pending";
  price: number;
  start_date: string | null;
  end_date: string | null;
  auto_renew: boolean;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface SearchFilters {
  subject?: string;
  level?: string;
  city?: string;
  neighborhood?: string;
  min_rate?: number;
  max_rate?: number;
  min_rating?: number;
  online?: boolean;
  verified?: boolean;
  q?: string;
  ordering?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  page?: number;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}
