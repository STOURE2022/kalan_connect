"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, MessageCircle, Phone, Users, BookOpen, CalendarDays, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getAccessToken } from "@/lib/api";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { chat as chatApi } from "@/lib/api";
import toast from "react-hot-toast";

interface StudentItem {
  student: {
    id: number;
    first_name: string;
    last_name: string;
    phone?: string;
    avatar?: string | null;
    role: string;
  };
  total_sessions: number;
  last_session: string | null;
}

const AVATAR_COLORS = [
  "from-indigo-500 to-purple-600",
  "from-primary-500 to-emerald-500",
  "from-orange-500 to-amber-500",
  "from-blue-500 to-cyan-500",
  "from-rose-500 to-pink-500",
  "from-violet-500 to-fuchsia-500",
  "from-teal-500 to-cyan-600",
];

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function StudentsPage() {
  const router = useRouter();
  const { loading, isLoggedIn, isTeacher } = useAuth();
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [fetching, setFetching]   = useState(true);
  const [query, setQuery]         = useState("");
  const [chatLoading, setChatLoading] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && (!isLoggedIn || !isTeacher)) router.push("/auth/login");
  }, [loading, isLoggedIn, isTeacher, router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const token = getAccessToken();
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/teachers/me/students/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setStudents(d.results ?? d ?? []))
      .catch(() => toast.error("Impossible de charger les élèves"))
      .finally(() => setFetching(false));
  }, [isLoggedIn]);

  const filtered = useMemo(() => {
    if (!query.trim()) return students;
    const q = query.toLowerCase();
    return students.filter(
      (s) =>
        s.student.first_name.toLowerCase().includes(q) ||
        s.student.last_name.toLowerCase().includes(q)
    );
  }, [students, query]);

  async function openChat(studentId: number) {
    setChatLoading(studentId);
    try {
      const conv = await chatApi.startConversation(studentId);
      router.push(`/chat/${conv.id}`);
    } catch {
      toast.error("Impossible d'ouvrir la conversation");
    } finally {
      setChatLoading(null);
    }
  }

  if (loading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-gray-900">Mes élèves</h1>
            {!fetching && (
              <p className="text-xs text-gray-400">{students.length} élève{students.length > 1 ? "s" : ""} au total</p>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 pt-5">
        {/* Search */}
        <div className="relative mb-5">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un élève..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-9 text-sm text-gray-800 placeholder:text-gray-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Content */}
        {fetching ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-200" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white py-14 text-center">
            <Users size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="font-semibold text-gray-500">
              {query ? "Aucun élève trouvé" : "Aucun élève pour l'instant"}
            </p>
            <p className="mt-1 text-sm text-gray-400">
              {query ? "Essayez un autre prénom ou nom" : "Vos élèves apparaîtront ici après vos premières réservations"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((s) => {
              const initials = `${s.student.first_name?.[0] ?? ""}${s.student.last_name?.[0] ?? ""}`.toUpperCase();
              const color    = AVATAR_COLORS[s.student.id % AVATAR_COLORS.length];
              const isLoading = chatLoading === s.student.id;

              return (
                <div
                  key={s.student.id}
                  className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white px-4 py-3.5 shadow-sm"
                >
                  {/* Avatar */}
                  <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-sm font-black text-white shadow-sm`}>
                    {initials || "?"}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">
                      {s.student.first_name} {s.student.last_name}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <BookOpen size={11} />
                        {s.total_sessions > 0
                          ? `${s.total_sessions} cours terminé${s.total_sessions > 1 ? "s" : ""}`
                          : "Aucun cours terminé"}
                      </span>
                      {s.last_session && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <CalendarDays size={11} />
                          Dernier : {fmtDate(s.last_session)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-shrink-0 items-center gap-2">
                    {s.student.phone && (
                      <a
                        href={`tel:${s.student.phone}`}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-100 bg-gray-50 text-gray-500 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                        title="Appeler"
                      >
                        <Phone size={15} />
                      </a>
                    )}
                    <button
                      onClick={() => openChat(s.student.id)}
                      disabled={isLoading}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-colors disabled:opacity-60"
                      title="Message"
                    >
                      {isLoading
                        ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        : <MessageCircle size={15} />
                      }
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
