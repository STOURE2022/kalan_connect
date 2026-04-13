"use client";

import { getAccessToken } from "@/lib/api";


import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  GraduationCap,
  School,
  Calendar,
  Pencil,
  Check,
  X,
  Baby,
  BookOpen,
  Clock,
  CheckCircle2,
  XCircle,
  Star,
  CalendarDays,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";
import type { Child, Level, Booking } from "@/types";

function getAge(dateOfBirth: string | null): string {
  if (!dateOfBirth) return "";
  const birth = new Date(dateOfBirth);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  const finalAge = m < 0 || (m === 0 && today.getDate() < birth.getDate()) ? age - 1 : age;
  return finalAge > 0 ? `${finalAge} ans` : "";
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending:   { label: "En attente",  color: "text-amber-600 bg-amber-50 border-amber-200",  icon: Clock },
  confirmed: { label: "Confirmé",    color: "text-blue-600 bg-blue-50 border-blue-200",      icon: CheckCircle2 },
  completed: { label: "Terminé",     color: "text-primary-600 bg-primary-50 border-primary-200", icon: CheckCircle2 },
  cancelled: { label: "Annulé",      color: "text-red-600 bg-red-50 border-red-200",         icon: XCircle },
  no_show:   { label: "Absent",      color: "text-gray-500 bg-gray-50 border-gray-200",      icon: XCircle },
};

export default function ChildDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { loading, isLoggedIn, isParent } = useAuth();

  const [child, setChild] = useState<Child | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [fetching, setFetching] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: "", last_name: "", date_of_birth: "", level_id: "" as string | number, school: "",
  });

  useEffect(() => {
    if (!loading && !isLoggedIn) router.push("/auth/login");
    if (!loading && isLoggedIn && !isParent) router.push("/dashboard");
  }, [loading, isLoggedIn, isParent, router]);

  const token = () => getAccessToken();
  const api = (path: string) => `${process.env.NEXT_PUBLIC_API_URL}${path}`;

  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchAll = async () => {
      try {
        const [childRes, levelsRes, bookingsRes] = await Promise.all([
          fetch(api(`/children/${id}/`), { headers: { Authorization: `Bearer ${token()}` } }),
          fetch(api("/teachers/levels/")),
          fetch(api("/bookings/"), { headers: { Authorization: `Bearer ${token()}` } }),
        ]);
        if (!childRes.ok) { router.push("/profile/children"); return; }
        const childData: Child = await childRes.json();
        setChild(childData);
        setForm({
          first_name: childData.first_name,
          last_name: childData.last_name,
          date_of_birth: childData.date_of_birth ?? "",
          level_id: childData.level?.id ?? "",
          school: childData.school,
        });
        const lvlData = await levelsRes.json();
        setLevels(Array.isArray(lvlData) ? lvlData : (lvlData.results ?? []));
        const bkData = await bookingsRes.json();
        setBookings(Array.isArray(bkData) ? bkData : (bkData.results ?? []));
      } catch { toast.error("Erreur de chargement"); }
      finally { setFetching(false); }
    };
    fetchAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(api(`/children/${id}/`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({
          ...form,
          level_id: form.level_id !== "" ? Number(form.level_id) : null,
          date_of_birth: form.date_of_birth || null,
        }),
      });
      if (!res.ok) throw new Error();
      const updated: Child = await res.json();
      setChild(updated);
      setEditing(false);
      toast.success("Profil mis à jour !");
    } catch { toast.error("Erreur lors de la mise à jour"); }
    finally { setSaving(false); }
  };

  if (loading || fetching) return <PageLoader />;
  if (!child) return null;

  const age = getAge(child.date_of_birth);
  const upcoming = bookings.filter((b) => ["pending", "confirmed"].includes(b.status))
    .sort((a, b) => a.date.localeCompare(b.date));
  const completed = bookings.filter((b) => b.status === "completed").length;
  const totalSpent = bookings.filter((b) => b.status === "completed").reduce((acc, b) => acc + b.price, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft size={18} className="text-gray-600" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">
              {child.first_name} {child.last_name}
            </h1>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
              editing ? "bg-gray-100 text-gray-600" : "btn-primary !py-2 !px-3 text-xs"
            }`}
          >
            {editing ? <><X size={13} /> Annuler</> : <><Pencil size={13} /> Modifier</>}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 pt-6 space-y-5">

        {/* Hero card */}
        <div className="rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 p-5 text-white shadow-lg">
          <div className="flex items-center gap-4">
            {child.avatar ? (
              <img src={child.avatar} alt="" className="h-16 w-16 rounded-full object-cover shadow-md border-2 border-white/30" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 border-2 border-white/30 text-white text-2xl font-bold shadow-md">
                {child.first_name[0]}{child.last_name[0]}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold">{child.first_name} {child.last_name}</h2>
              <div className="mt-1 flex flex-wrap gap-2">
                {age && (
                  <span className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">
                    <Baby size={10} /> {age}
                  </span>
                )}
                {child.level && (
                  <span className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">
                    <GraduationCap size={10} /> {child.level.name}
                  </span>
                )}
                {child.school && (
                  <span className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">
                    <School size={10} /> {child.school}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Mini stats */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: "Cours terminés", value: completed },
              { label: "Cours à venir", value: upcoming.length },
              { label: "Total dépensé", value: `${totalSpent.toLocaleString()} F` },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-white/15 px-3 py-2.5 text-center">
                <p className="text-base font-bold">{value}</p>
                <p className="text-xs text-white/70">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Edit form */}
        {editing && (
          <form onSubmit={handleSave} className="rounded-2xl border border-violet-100 bg-white p-5 shadow-md space-y-3">
            <h3 className="text-sm font-bold text-gray-800">Modifier le profil</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Prénom *</label>
                <input value={form.first_name} onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))} className="input text-sm" required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Nom *</label>
                <input value={form.last_name} onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))} className="input text-sm" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Date de naissance</label>
                <input type="date" value={form.date_of_birth} onChange={(e) => setForm((p) => ({ ...p, date_of_birth: e.target.value }))} className="input text-sm" max={new Date().toISOString().split("T")[0]} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Niveau</label>
                <select value={form.level_id} onChange={(e) => setForm((p) => ({ ...p, level_id: e.target.value }))} className="input text-sm">
                  <option value="">Choisir...</option>
                  {levels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">École</label>
              <input value={form.school} onChange={(e) => setForm((p) => ({ ...p, school: e.target.value }))} placeholder="Nom de l'école" className="input text-sm" />
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full !py-2.5 text-sm">
              <Check size={14} className="mr-1 inline" />
              {saving ? "Enregistrement..." : "Sauvegarder les modifications"}
            </button>
          </form>
        )}

        {/* Upcoming bookings */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100">
                <CalendarDays size={15} className="text-blue-600" />
              </div>
              <h3 className="text-sm font-bold text-gray-800">Prochains cours</h3>
            </div>
            <Link href="/profile/bookings" className="flex items-center gap-0.5 text-xs font-semibold text-primary-600 hover:underline">
              Voir tout <ChevronRight size={12} />
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                <CalendarDays size={22} className="text-blue-300" />
              </div>
              <p className="text-sm text-gray-400">Aucun cours prévu</p>
              <Link href="/search" className="btn-primary !py-2 !px-4 text-xs">
                Trouver un professeur
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {upcoming.slice(0, 4).map((booking) => {
                const cfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;
                const StatusIcon = cfg.icon;
                const d = new Date(booking.date);
                return (
                  <div key={booking.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="flex-shrink-0 w-10 text-center">
                      <p className="text-lg font-bold text-gray-900 leading-none">{d.getDate()}</p>
                      <p className="text-xs text-gray-400 uppercase">{d.toLocaleDateString("fr-FR", { month: "short" })}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{booking.subject_name}</p>
                      <p className="text-xs text-gray-500">{booking.teacher_name} · {booking.start_time.slice(0, 5)}–{booking.end_time.slice(0, 5)}</p>
                    </div>
                    <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${cfg.color}`}>
                      <StatusIcon size={10} /> {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Completed courses */}
        {completed > 0 && (
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-100">
                <CheckCircle2 size={15} className="text-primary-600" />
              </div>
              <h3 className="text-sm font-bold text-gray-800">Cours terminés</h3>
              <span className="ml-auto rounded-full bg-primary-100 px-2 py-0.5 text-xs font-bold text-primary-700">
                {completed}
              </span>
            </div>
            <div className="space-y-2">
              {bookings
                .filter((b) => b.status === "completed")
                .slice(0, 3)
                .map((booking) => {
                  const d = new Date(booking.date);
                  return (
                    <div key={booking.id} className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 flex-shrink-0">
                        <BookOpen size={14} className="text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{booking.subject_name}</p>
                        <p className="text-xs text-gray-400">{d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-gray-700">{booking.price.toLocaleString()} F</p>
                        <div className="flex items-center gap-0.5 justify-end">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} size={9} className="text-amber-400 fill-amber-400" />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              {completed > 3 && (
                <Link href="/profile/bookings" className="flex items-center justify-center gap-1 pt-1 text-xs font-semibold text-primary-600 hover:underline">
                  Voir les {completed - 3} autres <ChevronRight size={12} />
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/search"
            className="flex flex-col items-center gap-2 rounded-2xl bg-gradient-to-br from-primary-500 to-emerald-600 p-4 text-white shadow-sm hover:shadow-md transition-shadow"
          >
            <BookOpen size={20} />
            <span className="text-xs font-bold text-center">Réserver un cours</span>
          </Link>
          <Link
            href={`/profile/children/${id}/agenda`}
            className="flex flex-col items-center gap-2 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-4 text-white shadow-sm hover:shadow-md transition-shadow"
          >
            <CalendarDays size={20} />
            <span className="text-xs font-bold text-center">Voir l&apos;agenda</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
