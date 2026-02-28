// ──────────────────────────────────────────
// KalanConnect Mobile — Types
// ──────────────────────────────────────────

export interface User {
  id: number;
  phone: string;
  first_name: string;
  last_name: string;
  email: string;
  role: "parent" | "teacher" | "admin" | "student";
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
  page?: number;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

// ── Notification types ──

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  type: "booking" | "chat" | "payment" | "system" | "review";
  is_read: boolean;
  data: Record<string, unknown>;
  created_at: string;
}

// ── Child (for parent role) ──

export interface Child {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  level: Level | null;
  school: string;
  avatar: string | null;
  created_at: string;
}

// ── Admin types ──

export interface AdminStats {
  total_users: number;
  total_teachers: number;
  total_parents: number;
  total_students: number;
  total_bookings: number;
  total_revenue: number;
  pending_verifications: number;
  active_subscriptions: number;
  new_users_this_month: number;
  bookings_this_month: number;
}

export interface AdminUserListItem {
  id: number;
  phone: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_phone_verified: boolean;
  is_active: boolean;
  has_active_subscription: boolean;
  created_at: string;
}

// ── Student types ──

export interface StudentProgress {
  subject: Subject;
  teacher: UserMinimal;
  total_sessions: number;
  completed_sessions: number;
  avg_rating: number;
  last_session_date: string;
}

export interface ScheduleItem {
  id: number;
  subject_name: string;
  teacher_name: string;
  date: string;
  start_time: string;
  end_time: string;
  location_type: string;
  status: string;
}

// ── Teacher stats ──

export interface TeacherStats {
  total_students: number;
  total_bookings: number;
  completed_sessions: number;
  total_earnings: number;
  avg_rating: number;
  total_reviews: number;
  this_month_earnings: number;
  this_month_bookings: number;
}

// ── Navigation types ──

export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  Register: undefined;
  TeacherDetail: { id: number };
  Booking: { teacherId: number };
  ChatRoom: { conversationId: number; name: string };
  Payment: { plan?: string };
  Review: { teacherId: number; bookingId: number };
  EditProfile: undefined;
  Notifications: undefined;
  Privacy: undefined;
  Help: undefined;
  EditTeacherProfile: undefined;
  ManageAvailability: undefined;
  ChildProgress: { childId: number; childName: string };
  AddChild: undefined;
  AdminUserDetail: { userId: number };
  AdminTeacherVerification: { teacherId: number };
};
