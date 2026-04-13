"use client";

import { useEffect, useState } from "react";
import { Star, RefreshCw, Search, Trash2, AlertTriangle, MessageSquare } from "lucide-react";
import { getAccessToken } from "@/lib/api";
import toast from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

interface ReviewUser {
  id: number;
  first_name: string;
  last_name: string;
  phone?: string;
}

interface Review {
  id: number;
  teacher: number;
  parent: ReviewUser;
  booking: number;
  rating: number;
  comment: string;
  created_at: string;
  teacher_name?: string;
}

const RATING_TABS = [
  { key: "",  label: "Tous"   },
  { key: "5", label: "⭐ 5"  },
  { key: "4", label: "⭐ 4"  },
  { key: "3", label: "⭐ 3"  },
  { key: "2", label: "⭐ 2"  },
  { key: "1", label: "⭐ 1"  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={13}
          className={n <= rating ? "text-amber-400 fill-amber-400" : "text-white/10"}
        />
      ))}
    </div>
  );
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export default function AdminReviewsPage() {
  const [reviews, setReviews]       = useState<Review[]>([]);
  const [loading, setLoading]       = useState(true);
  const [ratingTab, setRatingTab]   = useState("");
  const [search, setSearch]         = useState("");
  const [deleting, setDeleting]     = useState<number | null>(null);
  const [confirmId, setConfirmId]   = useState<number | null>(null);

  const fetchReviews = (rating = "") => {
    setLoading(true);
    const token = getAccessToken();
    const params = rating ? `?rating=${rating}` : "";
    fetch(`${API}/admin/reviews/${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setReviews(Array.isArray(d) ? d : (d.results ?? [])))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReviews(ratingTab); }, [ratingTab]);

  const handleDelete = async (id: number) => {
    setDeleting(id);
    const token = getAccessToken();
    try {
      const r = await fetch(`${API}/admin/reviews/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) {
        setReviews((prev) => prev.filter((rv) => rv.id !== id));
        toast.success("Avis supprimé");
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setDeleting(null);
      setConfirmId(null);
    }
  };

  const filtered = reviews.filter((rv) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      rv.parent.first_name.toLowerCase().includes(q) ||
      rv.parent.last_name.toLowerCase().includes(q) ||
      rv.comment.toLowerCase().includes(q)
    );
  });

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—";

  const low = reviews.filter((r) => r.rating <= 2).length;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Avis & Évaluations</h1>
        <p className="text-sm text-white/40 mt-0.5">Modération de tous les avis laissés par les parents</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total avis",          value: reviews.length, color: "from-primary-500 to-blue-500",   icon: MessageSquare },
          { label: "Note moyenne",         value: avg,            color: "from-amber-500 to-orange-500",   icon: Star          },
          { label: "Avis 5 étoiles",      value: reviews.filter((r) => r.rating === 5).length, color: "from-emerald-500 to-teal-500", icon: Star },
          { label: "Avis négatifs (≤ 2)", value: low,            color: "from-red-500 to-rose-500",       icon: AlertTriangle  },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="rounded-2xl bg-[#13151f] border border-white/5 p-4">
            <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${color} mb-3`}>
              <Icon size={16} className="text-white" />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-white/40 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 rounded-xl bg-white/5 p-1 flex-wrap">
          {RATING_TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setRatingTab(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                ratingTab === key ? "bg-primary-500 text-white" : "text-white/50 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-primary-500/50"
          />
        </div>
      </div>

      {/* Reviews list */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <RefreshCw size={20} className="text-white/30 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-white/30">
          <Star size={32} className="mb-2 opacity-30" />
          <p className="text-sm">Aucun avis trouvé</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((rv) => (
            <div
              key={rv.id}
              className={`rounded-2xl bg-[#13151f] border p-4 transition-colors ${
                rv.rating <= 2 ? "border-red-500/20" : "border-white/5"
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-emerald-500 text-sm font-bold text-white">
                  {rv.parent.first_name[0]}{rv.parent.last_name[0]}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white text-sm">
                      {rv.parent.first_name} {rv.parent.last_name}
                    </span>
                    {rv.rating <= 2 && (
                      <span className="flex items-center gap-1 text-xs bg-red-500/15 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-lg">
                        <AlertTriangle size={10} /> Avis négatif
                      </span>
                    )}
                    <span className="text-xs text-white/30 ml-auto">{fmt(rv.created_at)}</span>
                  </div>
                  <div className="mt-1 mb-2">
                    <StarRating rating={rv.rating} />
                  </div>
                  {rv.comment ? (
                    <p className="text-sm text-white/70 leading-relaxed">{rv.comment}</p>
                  ) : (
                    <p className="text-sm text-white/20 italic">Aucun commentaire</p>
                  )}
                  <div className="mt-2 text-xs text-white/30">
                    Réservation #{rv.booking} · Professeur #{rv.teacher}
                  </div>
                </div>

                {/* Delete */}
                <div className="flex-shrink-0">
                  {confirmId === rv.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setConfirmId(null)}
                        className="text-xs text-white/40 hover:text-white/70 transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => handleDelete(rv.id)}
                        disabled={deleting === rv.id}
                        className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                      >
                        {deleting === rv.id ? "..." : "Confirmer"}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmId(rv.id)}
                      className="text-white/20 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
                      title="Supprimer cet avis"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
