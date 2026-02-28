// ──────────────────────────────────────────
// KalanConnect Mobile — API Services
// ──────────────────────────────────────────

import { apiFetch, setTokens, clearTokens, getWsUrl } from "./client";
import type {
  AdminStats,
  AdminUserListItem,
  AppNotification,
  AuthTokens,
  Booking,
  BookingPack,
  Child,
  Conversation,
  Level,
  Message,
  PaginatedResponse,
  Report,
  Review,
  ScheduleItem,
  SearchFilters,
  StudentProgress,
  Subject,
  Subscription,
  TeacherListItem,
  TeacherProfile,
  TeacherStats,
  User,
} from "@/types";

// ── DELETE ACCOUNT ──
export const deleteAccount = async (): Promise<void> => {
  await apiFetch("/auth/account/", { method: "DELETE" });
  await clearTokens();
};

// ── AUTH ──

export const authAPI = {
  async register(data: {
    phone: string;
    first_name: string;
    last_name: string;
    email?: string;
    role: "parent" | "teacher" | "student" | "etudiant";
    city: string;
    neighborhood?: string;
    password: string;
    password_confirm: string;
  }) {
    const result = await apiFetch<{ user: User; tokens: AuthTokens }>(
      "/auth/register/",
      { method: "POST", body: JSON.stringify(data) }
    );
    await setTokens(result.tokens);
    return result;
  },

  async login(phone: string, password: string) {
    const tokens = await apiFetch<AuthTokens>("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ phone, password }),
    });
    await setTokens(tokens);
    return tokens;
  },

  async getProfile() {
    return apiFetch<User>("/auth/profile/");
  },

  async updateProfile(data: FormData) {
    return apiFetch<User>("/auth/profile/", { method: "PATCH", body: data });
  },

  async changePassword(data: { old_password: string; new_password: string }) {
    return apiFetch<{ detail: string }>("/auth/change-password/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async logout() {
    await clearTokens();
  },
};

// ── TEACHERS ──

export const teachersAPI = {
  async getSubjects() {
    return apiFetch<Subject[]>("/teachers/subjects/");
  },

  async getLevels() {
    return apiFetch<Level[]>("/teachers/levels/");
  },

  async search(filters: SearchFilters) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") params.set(key, String(value));
    });
    return apiFetch<PaginatedResponse<TeacherListItem>>(
      `/teachers/search/?${params.toString()}`
    );
  },

  async getById(id: number) {
    return apiFetch<TeacherProfile>(`/teachers/${id}/`);
  },

  async autocomplete(q: string) {
    return apiFetch<{ subjects: Subject[]; teachers: TeacherListItem[] }>(
      `/teachers/autocomplete/?q=${encodeURIComponent(q)}`
    );
  },

  async getMyProfile() {
    return apiFetch<TeacherProfile>("/teachers/me/");
  },

  async updateMyProfile(data: FormData) {
    return apiFetch<TeacherProfile>("/teachers/me/", {
      method: "PATCH",
      body: data,
    });
  },

  async getMyStats() {
    return apiFetch<TeacherStats>("/teachers/me/stats/");
  },

  async getMyStudents() {
    return apiFetch<PaginatedResponse<{ student: User; total_sessions: number; last_session: string }>>(
      "/teachers/me/students/"
    );
  },

  async addAvailability(data: {
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_recurring: boolean;
  }) {
    return apiFetch<{ id: number }>("/teachers/me/availability/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async removeAvailability(id: number) {
    return apiFetch<void>(`/teachers/me/availability/${id}/`, {
      method: "DELETE",
    });
  },
};

// ── BOOKINGS ──

export const bookingsAPI = {
  async list() {
    return apiFetch<PaginatedResponse<Booking>>("/bookings/");
  },

  async create(data: {
    teacher: number;
    subject: number;
    date: string;
    start_time: string;
    end_time: string;
    location_type: string;
    address?: string;
    notes?: string;
  }) {
    return apiFetch<Booking>("/bookings/create/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async action(id: number, action: "confirm" | "cancel" | "complete") {
    return apiFetch<Booking>(`/bookings/${id}/${action}/`, { method: "POST" });
  },

  async getReviews(teacherId: number) {
    return apiFetch<PaginatedResponse<Review>>(
      `/bookings/reviews/${teacherId}/`
    );
  },

  async createReview(data: {
    teacher: number;
    booking: number;
    rating: number;
    comment: string;
  }) {
    return apiFetch<Review>("/bookings/reviews/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // ── Packs de cours ──

  async getMyPacks() {
    return apiFetch<PaginatedResponse<BookingPack>>("/bookings/packs/");
  },

  async createPack(data: {
    pack_type: "single" | "pack_4" | "pack_8" | "monthly";
    teacher: number;
    subject: number;
  }) {
    return apiFetch<BookingPack>("/bookings/packs/create/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// ── CHAT ──

export const chatAPI = {
  async getConversations() {
    return apiFetch<PaginatedResponse<Conversation>>("/chat/conversations/");
  },

  async startConversation(userId: number) {
    return apiFetch<Conversation>("/chat/conversations/start/", {
      method: "POST",
      body: JSON.stringify({ user_id: userId }),
    });
  },

  async getMessages(conversationId: number) {
    return apiFetch<PaginatedResponse<Message>>(
      `/chat/conversations/${conversationId}/messages/`
    );
  },

  async markAsRead(conversationId: number) {
    return apiFetch<{ marked_read: number }>(
      `/chat/conversations/${conversationId}/read/`,
      { method: "POST" }
    );
  },

  connectWebSocket(conversationId: number) {
    return new WebSocket(`${getWsUrl()}/ws/chat/${conversationId}/`);
  },
};

// ── PAYMENTS ──

export const paymentsAPI = {
  async checkSubscription() {
    return apiFetch<{
      has_subscription: boolean;
      plan?: string;
      end_date?: string;
    }>("/payments/check-subscription/");
  },

  async initiate(plan: "monthly" | "annual", phoneNumber: string) {
    return apiFetch<{
      payment_id: string;
      payment_url: string;
      amount: number;
      currency: string;
    }>("/payments/initiate/", {
      method: "POST",
      body: JSON.stringify({ plan, phone_number: phoneNumber }),
    });
  },

  async getSubscriptions() {
    return apiFetch<PaginatedResponse<Subscription>>("/payments/subscriptions/");
  },
};

// ── SEARCH ──

export const searchAPI = {
  async popular(city = "Bamako") {
    return apiFetch<(Subject & { teacher_count: number })[]>(
      `/search/popular/?city=${city}`
    );
  },
};

// ── NOTIFICATIONS ──

export const notificationsAPI = {
  async list() {
    return apiFetch<PaginatedResponse<AppNotification>>("/notifications/");
  },

  async markAsRead(id: number) {
    return apiFetch<void>(`/notifications/${id}/read/`, { method: "POST" });
  },

  async markAllAsRead() {
    return apiFetch<void>("/notifications/read-all/", { method: "POST" });
  },

  async getUnreadCount() {
    return apiFetch<{ count: number }>("/notifications/unread-count/");
  },

  async registerPushToken(token: string) {
    return apiFetch<void>("/notifications/register-push/", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  },
};

// ── CHILDREN (Parent) ──

export const childrenAPI = {
  async list() {
    return apiFetch<PaginatedResponse<Child>>("/children/");
  },

  async create(data: FormData) {
    return apiFetch<Child>("/children/", { method: "POST", body: data });
  },

  async update(id: number, data: FormData) {
    return apiFetch<Child>(`/children/${id}/`, { method: "PATCH", body: data });
  },

  async delete(id: number) {
    return apiFetch<void>(`/children/${id}/`, { method: "DELETE" });
  },

  async getProgress(id: number) {
    return apiFetch<StudentProgress[]>(`/children/${id}/progress/`);
  },
};

// ── REPORTS ──

export const reportsAPI = {
  async create(data: {
    reported_user: number;
    booking: number | null;
    reason: string;
    description: string;
  }) {
    return apiFetch<Report>("/bookings/reports/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// ── ETUDIANT ──

export const etudiantAPI = {
  async getMyBookings() {
    return bookingsAPI.list();
  },

  async getMyPacks() {
    return bookingsAPI.getMyPacks();
  },
};

// ── ADMIN ──

export const adminAPI = {
  async getDashboard() {
    return apiFetch<AdminStats>("/admin/dashboard/");
  },

  async getUsers(params?: { role?: string; q?: string; page?: number }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== "") searchParams.set(key, String(value));
      });
    }
    return apiFetch<PaginatedResponse<AdminUserListItem>>(
      `/admin/users/?${searchParams.toString()}`
    );
  },

  async getUserDetail(id: number) {
    return apiFetch<User & { bookings_count: number; subscription: Subscription | null }>(
      `/admin/users/${id}/`
    );
  },

  async toggleUserActive(id: number) {
    return apiFetch<{ is_active: boolean }>(`/admin/users/${id}/toggle-active/`, {
      method: "POST",
    });
  },

  async getPendingTeachers() {
    return apiFetch<PaginatedResponse<TeacherProfile>>("/admin/teachers/pending/");
  },

  async verifyTeacher(id: number, approved: boolean, reason?: string) {
    return apiFetch<TeacherProfile>(`/admin/teachers/${id}/verify/`, {
      method: "POST",
      body: JSON.stringify({ approved, reason }),
    });
  },

  async getAllBookings(params?: { status?: string; page?: number }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.set(key, String(value));
      });
    }
    return apiFetch<PaginatedResponse<Booking>>(
      `/admin/bookings/?${searchParams.toString()}`
    );
  },

  async getRevenueStats() {
    return apiFetch<{
      total_revenue: number;
      monthly_revenue: { month: string; amount: number }[];
    }>("/admin/revenue/");
  },

  // ── Signalements ──

  async getReports(statusFilter?: string) {
    const params = statusFilter ? `?status=${statusFilter}` : "";
    return apiFetch<PaginatedResponse<Report>>(`/admin/reports/${params}`);
  },

  async updateReport(id: number, data: { status?: string; admin_notes?: string }) {
    return apiFetch<Report>(`/admin/reports/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};

// ── STUDENT ──

export const studentAPI = {
  async getMySchedule() {
    return apiFetch<ScheduleItem[]>("/student/schedule/");
  },

  async getMyProgress() {
    return apiFetch<StudentProgress[]>("/student/progress/");
  },

  async getMyTeachers() {
    return apiFetch<PaginatedResponse<TeacherListItem>>("/student/teachers/");
  },
};
