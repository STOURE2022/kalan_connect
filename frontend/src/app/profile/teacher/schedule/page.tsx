"use client";

import { getAccessToken } from "@/lib/api";


import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";
import type { Availability } from "@/types";

const DAYS = [
  { value: 1, label: "Lundi"    },
  { value: 2, label: "Mardi"    },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi"    },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi"   },
  { value: 7, label: "Dimanche" },
];

const DAY_COLORS: Record<number, string> = {
  1: "bg-blue-100 text-blue-700",
  2: "bg-teal-100 text-teal-700",
  3: "bg-primary-100 text-primary-700",
  4: "bg-indigo-100 text-indigo-700",
  5: "bg-orange-100 text-orange-700",
  6: "bg-rose-100 text-rose-700",
  7: "bg-purple-100 text-purple-700",
};

export default function SchedulePage() {
  const router = useRouter();
  const { loading, isLoggedIn, isTeacher } = useAuth();
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [fetching, setFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ day_of_week: 1, start_time: "08:00", end_time: "18:00" });

  useEffect(() => {
    if (!loading && (!isLoggedIn || !isTeacher)) router.push("/auth/login");
  }, [loading, isLoggedIn, isTeacher, router]);

  const fetchSlots = () => {
    const token = getAccessToken();
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/teachers/availability/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setAvailabilities(Array.isArray(data) ? data : (data.results ?? [])))
      .catch(() => {})
      .finally(() => setFetching(false));
  };

  useEffect(() => { if (isLoggedIn) fetchSlots(); }, [isLoggedIn]);

  if (loading) return <PageLoader />;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const token = getAccessToken();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teachers/availability/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Créneau ajouté !");
      setShowForm(false);
      fetchSlots();
    } catch {
      toast.error("Erreur lors de l'ajout");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ce créneau ?")) return;
    const token = getAccessToken();
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teachers/me/availability/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Créneau supprimé");
      setAvailabilities((p) => p.filter((a) => a.id !== id));
    } catch {
      toast.error("Erreur");
    }
  };

  // Group by day
  const byDay = DAYS.map((d) => ({
    ...d,
    slots: availabilities.filter((a) => a.day_of_week === d.value),
  })).filter((d) => d.slots.length > 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
              <ArrowLeft size={18} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Mes disponibilités</h1>
              <p className="text-xs text-gray-400">{availabilities.length} créneau{availabilities.length > 1 ? "x" : ""}</p>
            </div>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary !py-2 !px-4 text-sm">
            <Plus size={14} className="mr-1 inline" /> Ajouter
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 pt-6">

        {/* Add form */}
        {showForm && (
          <form onSubmit={handleAdd} className="mb-5 rounded-2xl border border-primary-100 bg-white p-5 shadow-md">
            <h2 className="mb-4 text-sm font-bold text-gray-700">Nouveau créneau</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Jour</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, day_of_week: d.value }))}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                        form.day_of_week === d.value
                          ? "border-primary-300 bg-primary-500 text-white"
                          : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Heure de début</label>
                  <input
                    type="time"
                    value={form.start_time}
                    onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))}
                    className="input text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Heure de fin</label>
                  <input
                    type="time"
                    value={form.end_time}
                    onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))}
                    className="input text-sm"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="submit" disabled={saving} className="btn-primary flex-1 !py-2.5 text-sm">
                {saving ? "Ajout..." : "Enregistrer le créneau"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary !py-2.5 text-sm">Annuler</button>
            </div>
          </form>
        )}

        {fetching ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>
        ) : availabilities.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-gray-200 bg-white py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100">
              <Clock size={26} className="text-teal-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-700">Aucune disponibilité</p>
              <p className="mt-1 text-sm text-gray-400">Ajoutez vos créneaux pour que les parents puissent vous réserver</p>
            </div>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <Plus size={14} className="mr-1 inline" /> Ajouter un créneau
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {byDay.map((day) => (
              <div key={day.value}>
                <div className={`mb-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${DAY_COLORS[day.value]}`}>
                  {day.label}
                </div>
                <div className="space-y-2">
                  {day.slots.map((slot) => (
                    <div key={slot.id} className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-teal-100">
                        <Clock size={16} className="text-teal-600" />
                      </div>
                      <p className="flex-1 text-sm font-semibold text-gray-800">
                        {slot.start_time.slice(0, 5)} → {slot.end_time.slice(0, 5)}
                      </p>
                      <button
                        onClick={() => handleDelete(slot.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
