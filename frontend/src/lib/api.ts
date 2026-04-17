// ──────────────────────────────────────────
// KalanConnect — Client API
// ──────────────────────────────────────────

import type {
  AuthTokens,
  Booking,
  ConcoursEvent,
  Conversation,
  GroupSession,
  Level,
  Message,
  PaginatedResponse,
  Review,
  SearchFilters,
  Subject,
  Subscription,
  TeacherListItem,
  TeacherProfile,
  User,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// ── Gestion des tokens ──

function getTokens(): AuthTokens | null {
  if (typeof window === "undefined") return null;
  const tokens = localStorage.getItem("kalan_tokens");
  return tokens ? JSON.parse(tokens) : null;
}

function setTokens(tokens: AuthTokens) {
  localStorage.setItem("kalan_tokens", JSON.stringify(tokens));
}

function clearTokens() {
  localStorage.removeItem("kalan_tokens");
}

/** Retourne le token d'accès courant (à utiliser dans les raw fetch) */
export function getAccessToken(): string | null {
  return getTokens()?.access ?? null;
}

// ── Fetch wrapper avec auth automatique ──

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const tokens = getTokens();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Ne pas mettre Content-Type si FormData (le browser le gère)
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (tokens?.access) {
    headers["Authorization"] = `Bearer ${tokens.access}`;
  }

  let response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // Si 401, tenter de rafraîchir le token
  if (response.status === 401 && tokens?.refresh) {
    const refreshResponse = await fetch(`${API_BASE}/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: tokens.refresh }),
    });

    if (refreshResponse.ok) {
      const newTokens = await refreshResponse.json();
      setTokens({ access: newTokens.access, refresh: tokens.refresh });
      headers["Authorization"] = `Bearer ${newTokens.access}`;
      response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });
    } else {
      clearTokens();
      window.location.href = "/auth/login";
      throw new Error("Session expirée");
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(response.status, error);
  }

  if (response.status === 204) return {} as T;
  return response.json();
}

export class ApiError extends Error {
  status: number;
  data: Record<string, unknown>;

  constructor(status: number, data: Record<string, unknown>) {
    super(`API Error ${status}`);
    this.status = status;
    this.data = data;
  }
}

// ──────────────────────────────────────────
// AUTH
// ──────────────────────────────────────────

export const auth = {
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
    setTokens(result.tokens);
    return result;
  },

  async login(phone: string, password: string) {
    const tokens = await apiFetch<AuthTokens>("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ phone, password }),
    });
    setTokens(tokens);
    return tokens;
  },

  async getProfile() {
    return apiFetch<User>("/auth/profile/");
  },

  async updateProfile(data: FormData) {
    return apiFetch<User>("/auth/profile/", {
      method: "PATCH",
      body: data,
    });
  },

  logout() {
    clearTokens();
  },

  isLoggedIn() {
    return !!getTokens()?.access;
  },
};

// ──────────────────────────────────────────
// TEACHERS
// ──────────────────────────────────────────

export const teachers = {
  async getSubjects() {
    return apiFetch<Subject[]>("/teachers/subjects/");
  },

  async getLevels() {
    return apiFetch<Level[]>("/teachers/levels/");
  },

  async search(filters: SearchFilters) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        params.set(key, String(value));
      }
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
};

// ──────────────────────────────────────────
// BOOKINGS
// ──────────────────────────────────────────

export const bookings = {
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
    return apiFetch<Booking>(`/bookings/${id}/${action}/`, {
      method: "POST",
    });
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
};

// ──────────────────────────────────────────
// CHAT
// ──────────────────────────────────────────

export const chat = {
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

  async uploadAttachment(conversationId: number, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return apiFetch<Message>(`/chat/conversations/${conversationId}/upload/`, {
      method: "POST",
      body: formData,
    });
  },

  connectWebSocket(conversationId: number) {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
    const token = getAccessToken() ?? "";
    return new WebSocket(`${wsUrl}/ws/chat/${conversationId}/?token=${token}`);
  },
};

// ──────────────────────────────────────────
// NOTIFICATIONS
// ──────────────────────────────────────────

export const notifications = {
  async getUnreadCount() {
    return apiFetch<{ unread_count: number }>("/notifications/unread-count/");
  },
  async markAllRead() {
    return apiFetch<void>("/notifications/read-all/", { method: "POST" });
  },
};

// ──────────────────────────────────────────
// PAYMENTS
// ──────────────────────────────────────────

export const payments = {
  async getSubscriptions() {
    return apiFetch<PaginatedResponse<Subscription>>(
      "/payments/subscriptions/"
    );
  },

  async checkSubscription() {
    return apiFetch<{
      has_subscription: boolean;
      plan?: string;
      end_date?: string;
    }>("/payments/check-subscription/");
  },

  async initiate(plan: "monthly" | "annual" | "concours", phoneNumber: string) {
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

  async mockConfirm(plan: "monthly" | "annual" | "concours") {
    return apiFetch<{ status: string; plan: string; end_date: string }>(
      "/payments/mock-confirm/",
      { method: "POST", body: JSON.stringify({ plan }) },
    );
  },
};

// ──────────────────────────────────────────
// SEARCH
// ──────────────────────────────────────────

// ──────────────────────────────────────────
// SESSIONS DE GROUPE
// ──────────────────────────────────────────

export const sessions = {
  async list(filters?: {
    subject?: string;
    status?: string;
    teacher?: number;
    q?: string;
    location_type?: string;
    price?: "free" | "paid";
    date?: "today" | "week" | "upcoming";
  }) {
    const params = new URLSearchParams();
    if (filters?.subject)       params.set("subject",       filters.subject);
    if (filters?.status)        params.set("status",        filters.status);
    if (filters?.teacher)       params.set("teacher",       String(filters.teacher));
    if (filters?.q)             params.set("q",             filters.q);
    if (filters?.location_type) params.set("location_type", filters.location_type);
    if (filters?.price)         params.set("price",         filters.price);
    if (filters?.date)          params.set("date",          filters.date);
    return apiFetch<PaginatedResponse<GroupSession>>(`/sessions/?${params.toString()}`);
  },

  async getById(id: number) {
    return apiFetch<GroupSession>(`/sessions/${id}/`);
  },

  async create(data: {
    subject: number; title: string; description?: string;
    date: string; start_time: string; end_time: string;
    location_type: string; address?: string;
    max_participants: number; price_per_student: number;
  }) {
    return apiFetch<GroupSession>("/sessions/create/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id: number, data: Partial<Parameters<typeof sessions.create>[0]>) {
    return apiFetch<GroupSession>(`/sessions/${id}/update/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async myList() {
    return apiFetch<PaginatedResponse<GroupSession>>("/sessions/my/");
  },

  async register(id: number) {
    return apiFetch<GroupSession>(`/sessions/${id}/register/`, { method: "POST" });
  },

  async unregister(id: number) {
    return apiFetch<GroupSession>(`/sessions/${id}/unregister/`, { method: "POST" });
  },

  async cancel(id: number) {
    return apiFetch<GroupSession>(`/sessions/${id}/cancel/`, { method: "POST" });
  },

  async complete(id: number) {
    return apiFetch<GroupSession>(`/sessions/${id}/complete/`, { method: "POST" });
  },
};

export const concours = {
  async list() {
    return apiFetch<ConcoursEvent[]>("/concours/");
  },
};

export interface ProgressionStats {
  sessions_count: number;
  hours_total: number;
  minutes_extra: number;
  subjects: string[];
  next_concours: {
    title: string;
    type: string;
    type_display: string;
    date_examen: string;
    days_until: number;
  } | null;
}

export interface TeacherProgressionStats {
  sessions_count: number;
  hours_total: number;
  minutes_extra: number;
  subjects: string[];
  students_count: number;
  avg_rating: number | null;
}

export const stats = {
  async progression() {
    return apiFetch<ProgressionStats>("/bookings/progression/");
  },
  async progressionTeacher() {
    return apiFetch<TeacherProgressionStats>("/bookings/progression/teacher/");
  },
};

export const search = {
  async global(q: string, city = "Bamako") {
    return apiFetch<{ subjects: Subject[]; teacher_count: number }>(
      `/search/?q=${encodeURIComponent(q)}&city=${city}`
    );
  },

  async popular(city = "Bamako") {
    return apiFetch<(Subject & { teacher_count: number })[]>(
      `/search/popular/?city=${city}`
    );
  },
};
