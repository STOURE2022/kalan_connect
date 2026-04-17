// ──────────────────────────────────────────
// KalanConnect — Types TypeScript
// ──────────────────────────────────────────

export interface User {
  id: number;
  phone: string;
  first_name: string;
  last_name: string;
  email: string;
  role: "parent" | "teacher" | "admin" | "student" | "etudiant";
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
  phone?: string;
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
  is_concours_specialist: boolean;
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
  is_concours_specialist: boolean;
  teaches_online: boolean;
  teaches_at_home: boolean;
  teaches_at_student: boolean;
  subjects: string[];
  distance_km?: number;
}

export interface Booking {
  id: number;
  teacher: number;
  teacher_name: string;
  teacher_user_id?: number;
  teacher_phone?: string;
  teacher_city?: string;
  teacher_avatar?: string | null;
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
  free_messages_used: number;
}

export interface Message {
  id: number;
  conversation: number;
  sender: UserMinimal;
  content: string;
  message_type: "text" | "image" | "file" | "booking" | "system";
  attachment: string | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Subscription {
  id: number;
  plan: "monthly" | "annual" | "concours";
  status: "active" | "expired" | "cancelled" | "pending";
  price: number;
  start_date: string | null;
  end_date: string | null;
  auto_renew: boolean;
  created_at: string;
}

export interface Child {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  level: Level | null;
  level_id?: number | null;
  school: string;
  avatar: string | null;
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
  concours?: boolean;
  q?: string;
  ordering?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  page?: number;
}

export interface GroupSession {
  id: number;
  teacher: {
    id: number;
    teacher_id: number;
    first_name: string;
    last_name: string;
    photo: string | null;
    avg_rating: number;
  };
  subject: { id: number; name: string };
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  location_type: "online" | "at_teacher" | "other";
  address: string;
  max_participants: number;
  price_per_student: number;
  participants_count: number;
  spots_left: number;
  status: "open" | "full" | "cancelled" | "completed";
  is_registered?: boolean;
  registrations?: {
    id: number;
    user: { id: number; first_name: string; last_name: string; phone: string };
    created_at: string;
  }[];
  created_at?: string;
}

export interface ConcoursEvent {
  id: number;
  type: "BAC" | "BEPC" | "ENI" | "CAT" | "ENA" | "ENAM" | "FMPOS" | "other";
  type_display: string;
  title: string;
  year: number;
  date_inscription_limite: string | null;
  date_examen: string;
  description: string;
  days_until_inscription: number | null;
  days_until_examen: number;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}
