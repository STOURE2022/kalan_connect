"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Save, BookOpen, DollarSign, MapPin, Wifi, Home, Users,
  ShieldCheck, Upload, FileText, X, CheckCircle2, AlertCircle, Camera,
  LocateFixed, Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { teachers as teachersApi } from "@/lib/api";
import { getAccessToken } from "@/lib/api";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";
import type { Subject, Level } from "@/types";

const CITIES = ["Bamako", "Sikasso", "Segou", "Mopti", "Kayes", "Gao"];

const ID_TYPES = [
  { value: "nina",      label: "Carte NINA" },
  { value: "passeport", label: "Passeport" },
  { value: "cni",       label: "Carte Nationale d'Identité" },
];

interface FileState {
  file: File | null;
  preview: string | null;   // object URL (image) or null
  existing: string | null;  // URL already on server
  cleared: boolean;         // user explicitly removed an existing doc
}

type DocAlert = "missing" | "rejected" | null;

function DocUploadField({
  label,
  hint,
  accept,
  value,
  onChange,
  required,
  alert,
  isVerified,
  onDeleteRequest,
}: {
  label: string;
  hint: string;
  accept: string;
  value: FileState;
  onChange: (s: FileState) => void;
  required?: boolean;
  alert?: DocAlert;
  isVerified?: boolean;
  onDeleteRequest?: () => void;  // appelé à la place de clear() si profil vérifié
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isImage = value.file?.type.startsWith("image/") || (value.existing && /\.(jpg|jpeg|png|webp)$/i.test(value.existing));

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
    onChange({ file, preview, existing: value.existing, cleared: false });
    e.target.value = "";
  };

  const clear = () => {
    // Si le profil est vérifié et qu'un fichier serveur existe → demander confirmation
    if (isVerified && value.existing && onDeleteRequest) {
      onDeleteRequest();
      return;
    }
    if (value.preview) URL.revokeObjectURL(value.preview);
    onChange({ file: null, preview: null, existing: null, cleared: true });
  };

  const hasDoc = value.file || value.existing;

  const alertBanner = alert === "missing" ? (
    <div className="mb-2 flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-2.5 py-1.5">
      <AlertCircle size={12} className="flex-shrink-0 text-red-500" />
      <p className="text-[11px] font-semibold text-red-600">Document manquant — veuillez fournir ce fichier</p>
    </div>
  ) : alert === "rejected" ? (
    <div className="mb-2 flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1.5">
      <AlertCircle size={12} className="flex-shrink-0 text-amber-500" />
      <p className="text-[11px] font-semibold text-amber-600">Document refusé — veuillez le remplacer</p>
    </div>
  ) : null;

  const borderColor = alert === "missing"
    ? "border-red-300 bg-red-50"
    : alert === "rejected"
    ? "border-amber-300 bg-amber-50"
    : hasDoc
    ? "border-green-200 bg-green-50"
    : "";

  return (
    <div>
      {label && (
        <label className="mb-1 flex items-center gap-1 text-xs font-medium text-gray-600">
          {label}
          {required && <span className="text-red-400">*</span>}
        </label>
      )}
      {hint && <p className="mb-2 text-[11px] text-gray-400">{hint}</p>}
      {alertBanner}

      {hasDoc ? (
        <div className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${borderColor}`}>
          {alert === "rejected"
            ? <AlertCircle size={16} className="flex-shrink-0 text-amber-500" />
            : <CheckCircle2 size={16} className="flex-shrink-0 text-green-500" />
          }
          <div className="flex-1 min-w-0">
            {isImage && (value.preview || value.existing) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={(value.preview || value.existing)!}
                alt="aperçu"
                className={`h-12 w-20 rounded-lg object-cover ${alert === "rejected" ? "ring-2 ring-amber-400" : ""}`}
              />
            ) : (
              <div className="flex items-center gap-2">
                <FileText size={14} className={alert === "rejected" ? "text-amber-600" : "text-green-600"} />
                <span className={`text-xs font-medium truncate ${alert === "rejected" ? "text-amber-700" : "text-green-700"}`}>
                  {value.file?.name ?? "Document enregistré"}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {value.existing && (
              <a
                href={value.existing}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-[11px] underline ${alert === "rejected" ? "text-amber-600" : "text-green-600"}`}
              >
                Voir
              </a>
            )}
            <button
              type="button"
              onClick={clear}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 hover:bg-red-200 transition-colors"
            >
              <X size={11} className="text-red-500" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-4 text-xs font-medium transition-colors ${
            alert === "missing"
              ? "border-red-300 bg-red-50 text-red-500 hover:border-red-400 hover:bg-red-100"
              : "border-gray-200 bg-gray-50 text-gray-400 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-600"
          }`}
        >
          <Upload size={15} />
          Choisir un fichier
        </button>
      )}

      {hasDoc && !value.file && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-1.5 text-[11px] text-gray-400 underline hover:text-gray-600"
        >
          Remplacer le fichier
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

export default function TeacherEditPage() {
  const router = useRouter();
  const { loading, isLoggedIn, isTeacher } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [levels, setLevels]     = useState<Level[]>([]);
  const [saving, setSaving]     = useState(false);
  const [profileExists, setProfileExists] = useState(false);

  const [form, setForm] = useState({
    bio: "",
    hourly_rate: 5000,
    city: "Bamako",
    neighborhood: "",
    experience_years: 1,
    teaches_online: false,
    teaches_at_home: true,
    teaches_at_student: false,
    subject_levels: [] as { subject_id: number; level_ids: number[] }[],
    identity_document_type: "",
  });

  const [photoDoc, setPhotoDoc]     = useState<FileState>({ file: null, preview: null, existing: null, cleared: false });
  const [identityDoc, setIdentityDoc] = useState<FileState>({ file: null, preview: null, existing: null, cleared: false });
  const [cvDoc, setCvDoc]           = useState<FileState>({ file: null, preview: null, existing: null, cleared: false });
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoCoords, setGeoCoords]   = useState<{ lat: number; lng: number } | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  // Dialog de confirmation avant suppression d'un doc sur profil vérifié
  const [confirmClear, setConfirmClear] = useState<{
    field: "photo" | "identity" | "cv";
    label: string;
    doDelete: () => void;
  } | null>(null);
  // Docs signalés par l'admin (depuis la dernière notif de rejet)
  const [docProblems, setDocProblems] = useState<{ missing: string[]; rejected: string[] }>({ missing: [], rejected: [] });

  useEffect(() => {
    if (!loading && (!isLoggedIn || !isTeacher)) router.push("/auth/login");
  }, [loading, isLoggedIn, isTeacher, router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const token = getAccessToken();

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/teachers/me/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => { if (r.ok) return r.json(); throw new Error(); })
      .then((data) => {
        setProfileExists(true);
        setIsVerified(data.is_verified ?? false);
        // Construire le mapping subject_id → level_ids depuis teacher_subjects
        const slMap: Record<number, number[]> = {};
        if (Array.isArray(data.teacher_subjects)) {
          for (const ts of data.teacher_subjects) {
            if (!ts.subject?.id) continue;
            if (!slMap[ts.subject.id]) slMap[ts.subject.id] = [];
            if (ts.level?.id && !slMap[ts.subject.id].includes(ts.level.id))
              slMap[ts.subject.id].push(ts.level.id);
          }
        }
        const subject_levels = Object.entries(slMap).map(([sid, lids]) => ({
          subject_id: Number(sid), level_ids: lids,
        }));
        setForm((p) => ({
          ...p,
          bio: data.bio ?? "",
          hourly_rate: data.hourly_rate ?? 5000,
          city: data.city ?? "Bamako",
          neighborhood: data.neighborhood ?? "",
          experience_years: data.experience_years ?? 1,
          teaches_online: data.teaches_online ?? false,
          teaches_at_home: data.teaches_at_home ?? true,
          teaches_at_student: data.teaches_at_student ?? false,
          subject_levels,
          identity_document_type: data.identity_document_type ?? "",
        }));
        // Existing files
        if (data.photo)              setPhotoDoc((p) => ({ ...p, existing: data.photo }));
        if (data.identity_document)  setIdentityDoc((p) => ({ ...p, existing: data.identity_document }));
        if (data.cv)                 setCvDoc((p) => ({ ...p, existing: data.cv }));
        // Existing GPS coords
        if (data.latitude && data.longitude) {
          setGeoCoords({ lat: data.latitude, lng: data.longitude });
        }
      })
      .catch(() => setProfileExists(false));

    teachersApi.getSubjects().then(setSubjects).catch(() => {});
    teachersApi.getLevels().then(setLevels).catch(() => {});

    // Récupérer la dernière notif de rejet admin pour afficher les docs problématiques
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        const notifs: { type: string; title: string; data: Record<string, unknown> }[] =
          Array.isArray(data) ? data : (data?.results ?? []);
        // Notifications sont déjà triées du plus récent au plus ancien (backend order_by -created_at)
        // On cherche la première notif système liée à une décision admin
        const lastDecision = notifs.find(
          (n) => n.type === "system" && n.data?.teacher_id !== undefined
        );
        // Si la dernière décision est un refus avec des docs signalés, on les affiche
        if (
          lastDecision &&
          lastDecision.title !== "Profil vérifié !" &&
          (Array.isArray(lastDecision.data.missing_docs) || Array.isArray(lastDecision.data.rejected_docs))
        ) {
          setDocProblems({
            missing:  (lastDecision.data.missing_docs  as string[]) ?? [],
            rejected: (lastDecision.data.rejected_docs as string[]) ?? [],
          });
        }
      })
      .catch(() => {});
  }, [isLoggedIn]);

  if (loading) return <PageLoader />;

  const toggleSubject = (subjectId: number) => {
    setForm((p) => {
      const exists = p.subject_levels.some((sl) => sl.subject_id === subjectId);
      return {
        ...p,
        subject_levels: exists
          ? p.subject_levels.filter((sl) => sl.subject_id !== subjectId)
          : [...p.subject_levels, { subject_id: subjectId, level_ids: [] }],
      };
    });
  };

  const toggleLevel = (subjectId: number, levelId: number) => {
    setForm((p) => ({
      ...p,
      subject_levels: p.subject_levels.map((sl) => {
        if (sl.subject_id !== subjectId) return sl;
        const has = sl.level_ids.includes(levelId);
        return { ...sl, level_ids: has ? sl.level_ids.filter((id) => id !== levelId) : [...sl.level_ids, levelId] };
      }),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const token = getAccessToken();

    try {
      // Always use FormData to support file uploads
      const fd = new FormData();
      fd.append("bio", form.bio);
      fd.append("hourly_rate", String(form.hourly_rate));
      fd.append("city", form.city);
      fd.append("neighborhood", form.neighborhood);
      fd.append("experience_years", String(form.experience_years));
      fd.append("teaches_online", String(form.teaches_online));
      fd.append("teaches_at_home", String(form.teaches_at_home));
      fd.append("teaches_at_student", String(form.teaches_at_student));
      fd.append("identity_document_type", form.identity_document_type);
      fd.append("subject_levels", JSON.stringify(form.subject_levels));

      if (photoDoc.file)         fd.append("photo", photoDoc.file);
      else if (photoDoc.cleared) fd.append("clear_photo", "1");

      if (identityDoc.file)         fd.append("identity_document", identityDoc.file);
      else if (identityDoc.cleared) fd.append("clear_identity_document", "1");

      if (cvDoc.file)        fd.append("cv", cvDoc.file);
      else if (cvDoc.cleared) fd.append("clear_cv", "1");
      if (geoCoords) {
        fd.append("latitude", String(geoCoords.lat));
        fd.append("longitude", String(geoCoords.lng));
      }

      const url    = `${process.env.NEXT_PUBLIC_API_URL}/teachers/${profileExists ? "me/" : "profile/"}`;
      const method = profileExists ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(profileExists ? "Profil mis à jour !" : "Profil créé !");
      setProfileExists(true);
      setDocProblems({ missing: [], rejected: [] });
      router.push("/profile");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error(`Erreur : ${msg.slice(0, 120)}`);
    } finally {
      setSaving(false);
    }
  };

  // Checklist status
  const docsMissing = !photoDoc.file && !photoDoc.existing
    || !identityDoc.file && !identityDoc.existing
    || !form.identity_document_type
    || !cvDoc.file && !cvDoc.existing;

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
              <ArrowLeft size={18} className="text-gray-600" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">
              {profileExists ? "Modifier mon profil" : "Créer mon profil"}
            </h1>
          </div>
          <button
            form="teacher-form"
            type="submit"
            disabled={saving}
            className="btn-primary !py-2 !px-4 text-sm"
          >
            {saving ? "Enregistrement..." : <><Save size={14} className="mr-1.5 inline" />Enregistrer</>}
          </button>
        </div>
      </div>

      <form id="teacher-form" onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-5 px-4 pt-6">

        {/* Bio */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-700">
            <BookOpen size={15} className="text-primary-500" /> Présentation
          </h2>
          <label className="mb-1 block text-xs font-medium text-gray-500">Biographie <span className="text-red-400">*</span></label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
            rows={4}
            placeholder="Décrivez votre expérience, votre méthode d'enseignement, vos points forts..."
            className="input resize-none text-sm"
            required
          />
          <p className="mt-1 text-right text-xs text-gray-400">{form.bio.length} / 500</p>
        </div>

        {/* Tarif & Expérience */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-700">
            <DollarSign size={15} className="text-primary-500" /> Tarif & Expérience
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Tarif horaire (FCFA) <span className="text-red-400">*</span></label>
              <input
                type="number" min={1000} step={500}
                value={form.hourly_rate}
                onChange={(e) => setForm((p) => ({ ...p, hourly_rate: Number(e.target.value) }))}
                className="input text-sm" required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Années d&apos;expérience</label>
              <input
                type="number" min={0} max={50}
                value={form.experience_years}
                onChange={(e) => setForm((p) => ({ ...p, experience_years: Number(e.target.value) }))}
                className="input text-sm"
              />
            </div>
          </div>
        </div>

        {/* Localisation */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-700">
            <MapPin size={15} className="text-primary-500" /> Localisation
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Ville</label>
              <select value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} className="input text-sm">
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Quartier</label>
              <input
                value={form.neighborhood}
                onChange={(e) => setForm((p) => ({ ...p, neighborhood: e.target.value }))}
                placeholder="Hamdallaye..."
                className="input text-sm"
              />
            </div>
          </div>

          {/* GPS */}
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-gray-500">
              Position GPS <span className="font-normal text-gray-400">(permet aux élèves de vous trouver à proximité)</span>
            </p>
            {geoCoords ? (
              <div className="flex items-center justify-between rounded-xl border border-primary-200 bg-primary-50 px-4 py-2.5">
                <div className="flex items-center gap-2 text-sm text-primary-700">
                  <LocateFixed size={15} className="text-primary-500" />
                  <span className="font-semibold">Position enregistrée</span>
                  <span className="text-xs text-primary-400">
                    ({geoCoords.lat.toFixed(4)}, {geoCoords.lng.toFixed(4)})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setGeoCoords(null)}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-200 hover:bg-primary-300 transition-colors"
                >
                  <X size={11} className="text-primary-700" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={geoLoading}
                onClick={() => {
                  if (!navigator.geolocation) {
                    toast.error("Géolocalisation non supportée par votre navigateur");
                    return;
                  }
                  setGeoLoading(true);
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      setGeoCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                      setGeoLoading(false);
                      toast.success("Position GPS récupérée !");
                    },
                    () => {
                      toast.error("Impossible d'obtenir votre position. Vérifiez les permissions.");
                      setGeoLoading(false);
                    },
                    { timeout: 8000, maximumAge: 60_000 }
                  );
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary-200 bg-primary-50 py-3 text-sm font-medium text-primary-600 hover:border-primary-400 hover:bg-primary-100 disabled:opacity-60 transition-colors"
              >
                {geoLoading
                  ? <Loader2 size={15} className="animate-spin" />
                  : <LocateFixed size={15} />}
                {geoLoading ? "Localisation en cours..." : "Définir ma position GPS"}
              </button>
            )}
          </div>
        </div>

        {/* Modes d'enseignement */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-gray-700">Modes d&apos;enseignement</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: "teaches_online",     label: "En ligne",     icon: Wifi,  color: "border-blue-200 bg-blue-50 text-blue-600"    },
              { key: "teaches_at_home",    label: "À domicile",   icon: Home,  color: "border-primary-200 bg-primary-50 text-primary-600" },
              { key: "teaches_at_student", label: "Chez l'élève", icon: Users, color: "border-purple-200 bg-purple-50 text-purple-600" },
            ].map(({ key, label, icon: Icon, color }) => {
              const active = form[key as keyof typeof form] as boolean;
              return (
                <button key={key} type="button"
                  onClick={() => setForm((p) => ({ ...p, [key]: !active }))}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-xs font-semibold transition-all ${active ? color : "border-gray-100 bg-white text-gray-400 hover:border-gray-200"}`}
                >
                  <Icon size={18} /> {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Matières & Niveaux */}
        {subjects.length > 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-1 text-sm font-bold text-gray-700">Matières &amp; Niveaux</h2>
            <p className="mb-3 text-xs text-gray-400">
              Sélectionnez vos matières, puis les niveaux pour chacune
            </p>

            {/* Chips matières */}
            <div className="flex flex-wrap gap-2 mb-4">
              {subjects.map((s) => {
                const active = form.subject_levels.some((sl) => sl.subject_id === s.id);
                return (
                  <button key={s.id} type="button"
                    onClick={() => toggleSubject(s.id)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${active ? "border-primary-300 bg-primary-500 text-white shadow-sm" : "border-gray-200 bg-white text-gray-500 hover:border-primary-200 hover:text-primary-600"}`}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>

            {/* Niveaux par matière */}
            {form.subject_levels.length > 0 && (
              <div className="space-y-3 border-t border-gray-50 pt-4">
                {form.subject_levels.map((sl) => {
                  const subject = subjects.find((s) => s.id === sl.subject_id);
                  if (!subject) return null;
                  return (
                    <div key={sl.subject_id} className="rounded-xl bg-gray-50 p-3">
                      <p className="mb-2 text-xs font-bold text-primary-600">{subject.name}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {levels.map((l) => {
                          const active = sl.level_ids.includes(l.id);
                          return (
                            <button key={l.id} type="button"
                              onClick={() => toggleLevel(sl.subject_id, l.id)}
                              className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all ${active ? "border-indigo-300 bg-indigo-500 text-white" : "border-gray-200 bg-white text-gray-500 hover:border-indigo-200 hover:text-indigo-600"}`}
                            >
                              {l.name}
                            </button>
                          );
                        })}
                      </div>
                      {sl.level_ids.length === 0 && (
                        <p className="mt-1 text-[11px] text-amber-500">Sélectionnez au moins un niveau</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── DOCUMENTS DE VÉRIFICATION ── */}
        <div className={`rounded-2xl border-2 bg-white p-5 shadow-sm ${docsMissing ? "border-amber-200" : "border-green-200"}`}>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className={docsMissing ? "text-amber-500" : "text-green-500"} />
              <h2 className="text-sm font-bold text-gray-800">Documents de vérification</h2>
            </div>
            {docsMissing ? (
              <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                <AlertCircle size={10} /> Incomplet
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-bold text-green-700">
                <CheckCircle2 size={10} /> Complet
              </span>
            )}
          </div>
          {(docProblems.missing.length > 0 || docProblems.rejected.length > 0) && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-3">
              <AlertCircle size={14} className="flex-shrink-0 text-red-500 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-red-700">Votre profil a été refusé</p>
                <p className="text-[11px] text-red-600 mt-0.5">
                  Corrigez les documents marqués ci-dessous, puis enregistrez votre profil pour soumettre à nouveau.
                </p>
              </div>
            </div>
          )}
          <p className="mb-5 text-xs text-gray-400 leading-relaxed">
            Ces documents sont nécessaires pour que votre profil soit vérifié par notre équipe.
            Formats acceptés : JPG, PNG, PDF.
          </p>

          <div className="space-y-5">
            {/* Photo de profil */}
            <DocUploadField
              label="Photo de profil"
              hint="Photo professionnelle claire (JPG ou PNG)"
              accept="image/*"
              value={photoDoc}
              onChange={setPhotoDoc}
              required
              alert={
                docProblems.missing.includes("photo") ? "missing"
                : docProblems.rejected.includes("photo") ? "rejected"
                : null
              }
              isVerified={isVerified}
              onDeleteRequest={() => setConfirmClear({
                field: "photo",
                label: "photo de profil",
                doDelete: () => {
                  if (photoDoc.preview) URL.revokeObjectURL(photoDoc.preview);
                  setPhotoDoc({ file: null, preview: null, existing: null, cleared: true });
                },
              })}
            />

            {/* Pièce d'identité */}
            {(() => {
              const identityAlert: DocAlert = docProblems.missing.includes("identity") ? "missing"
                : docProblems.rejected.includes("identity") ? "rejected"
                : null;
              return (
                <div className={`space-y-2 rounded-xl p-3 -mx-3 ${identityAlert === "missing" ? "bg-red-50" : identityAlert === "rejected" ? "bg-amber-50" : ""}`}>
                  <label className="flex items-center gap-1 text-xs font-medium text-gray-600">
                    Pièce d&apos;identité <span className="text-red-400">*</span>
                  </label>
                  <p className="text-[11px] text-gray-400">Scan lisible recto-verso (carte NINA, passeport ou CNI)</p>
                  {identityAlert === "missing" && (
                    <div className="flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-2.5 py-1.5">
                      <AlertCircle size={12} className="flex-shrink-0 text-red-500" />
                      <p className="text-[11px] font-semibold text-red-600">Document manquant — veuillez fournir ce fichier</p>
                    </div>
                  )}
                  {identityAlert === "rejected" && (
                    <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1.5">
                      <AlertCircle size={12} className="flex-shrink-0 text-amber-500" />
                      <p className="text-[11px] font-semibold text-amber-600">Document refusé — veuillez le remplacer</p>
                    </div>
                  )}
                  <select
                    value={form.identity_document_type}
                    onChange={(e) => setForm((p) => ({ ...p, identity_document_type: e.target.value }))}
                    className={`input text-sm mb-2 ${identityAlert === "missing" ? "border-red-300" : identityAlert === "rejected" ? "border-amber-300" : ""}`}
                  >
                    <option value="">— Choisir le type de document —</option>
                    {ID_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <DocUploadField
                    label=""
                    hint=""
                    accept="image/*,application/pdf"
                    value={identityDoc}
                    onChange={setIdentityDoc}
                    required
                    alert={identityAlert}
                    isVerified={isVerified}
                    onDeleteRequest={() => setConfirmClear({
                      field: "identity",
                      label: "pièce d'identité",
                      doDelete: () => {
                        if (identityDoc.preview) URL.revokeObjectURL(identityDoc.preview);
                        setIdentityDoc({ file: null, preview: null, existing: null, cleared: true });
                      },
                    })}
                  />
                </div>
              );
            })()}

            {/* CV */}
            <DocUploadField
              label="CV (Curriculum Vitae)"
              hint="Votre CV au format PDF ou image — expériences, formations, diplômes"
              accept="application/pdf,image/*"
              value={cvDoc}
              onChange={setCvDoc}
              required
              alert={
                docProblems.missing.includes("cv") ? "missing"
                : docProblems.rejected.includes("cv") ? "rejected"
                : null
              }
              isVerified={isVerified}
              onDeleteRequest={() => setConfirmClear({
                field: "cv",
                label: "CV",
                doDelete: () => {
                  if (cvDoc.preview) URL.revokeObjectURL(cvDoc.preview);
                  setCvDoc({ file: null, preview: null, existing: null, cleared: true });
                },
              })}
            />

            {/* Note diplômes — alerte si manquant/refusé */}
            {(docProblems.missing.includes("diploma") || docProblems.rejected.includes("diploma")) && (
              <div className={`flex items-center gap-1.5 rounded-xl border px-3 py-2.5 ${
                docProblems.missing.includes("diploma")
                  ? "bg-red-50 border-red-200"
                  : "bg-amber-50 border-amber-200"
              }`}>
                <AlertCircle size={13} className={`flex-shrink-0 ${docProblems.missing.includes("diploma") ? "text-red-500" : "text-amber-500"}`} />
                <p className={`text-[11px] font-semibold ${docProblems.missing.includes("diploma") ? "text-red-600" : "text-amber-600"}`}>
                  {docProblems.missing.includes("diploma")
                    ? "Aucun diplôme avec scan — ajoutez-en un dans \"Mes diplômes\""
                    : "Scan de diplôme refusé — veuillez le remplacer dans \"Mes diplômes\""
                  }
                </p>
              </div>
            )}

            {/* Note diplômes */}
            <div className="flex items-start gap-2 rounded-xl bg-indigo-50 border border-indigo-100 px-3 py-2.5">
              <FileText size={14} className="flex-shrink-0 text-indigo-500 mt-0.5" />
              <p className="text-xs text-indigo-700">
                <span className="font-semibold">Diplômes :</span> ajoutez vos diplômes dans la section{" "}
                <button
                  type="button"
                  className="underline font-semibold"
                  onClick={() => router.push("/profile/teacher/diplomas")}
                >
                  Mes diplômes
                </button>
                {" "}(avec le fichier scan).
              </p>
            </div>
          </div>
        </div>

        {/* ── Dialog confirmation suppression doc vérifié ── */}
        {confirmClear && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-100">
                  <AlertCircle size={20} className="text-red-500" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Supprimer ce document ?</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Votre <span className="font-semibold">{confirmClear.label}</span> est un document de vérification.
                    Le supprimer retirera votre badge <span className="font-semibold text-primary-600">Vérifié</span> et
                    votre profil sera soumis à nouveau pour révision.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmClear(null)}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => { confirmClear.doDelete(); setConfirmClear(null); }}
                  className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white hover:bg-red-600 transition-colors"
                >
                  Supprimer quand même
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Photo via icon reminder si pas de doc upload */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 flex items-center gap-2">
          <Camera size={14} className="text-gray-400 flex-shrink-0" />
          <p className="text-xs text-gray-400">
            Votre photo de profil principale est celle uploadée ci-dessus dans «&nbsp;Documents de vérification&nbsp;».
          </p>
        </div>

      </form>
    </div>
  );
}
