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
}

function DocUploadField({
  label,
  hint,
  accept,
  value,
  onChange,
  required,
}: {
  label: string;
  hint: string;
  accept: string;
  value: FileState;
  onChange: (s: FileState) => void;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isImage = value.file?.type.startsWith("image/") || (value.existing && /\.(jpg|jpeg|png|webp)$/i.test(value.existing));

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
    onChange({ file, preview, existing: value.existing });
    e.target.value = "";
  };

  const clear = () => {
    if (value.preview) URL.revokeObjectURL(value.preview);
    onChange({ file: null, preview: null, existing: null });
  };

  const hasDoc = value.file || value.existing;

  return (
    <div>
      <label className="mb-1 flex items-center gap-1 text-xs font-medium text-gray-600">
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>
      <p className="mb-2 text-[11px] text-gray-400">{hint}</p>

      {hasDoc ? (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2.5">
          <CheckCircle2 size={16} className="flex-shrink-0 text-green-500" />
          <div className="flex-1 min-w-0">
            {isImage && (value.preview || value.existing) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={(value.preview || value.existing)!}
                alt="aperçu"
                className="h-12 w-20 rounded-lg object-cover"
              />
            ) : (
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-green-600" />
                <span className="text-xs font-medium text-green-700 truncate">
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
                className="text-[11px] text-green-600 underline"
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
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-4 text-xs font-medium text-gray-400 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-600 transition-colors"
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
    subject_ids: [] as number[],
    level_ids: [] as number[],
    identity_document_type: "",
  });

  const [photoDoc, setPhotoDoc]     = useState<FileState>({ file: null, preview: null, existing: null });
  const [identityDoc, setIdentityDoc] = useState<FileState>({ file: null, preview: null, existing: null });
  const [cvDoc, setCvDoc]           = useState<FileState>({ file: null, preview: null, existing: null });
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoCoords, setGeoCoords]   = useState<{ lat: number; lng: number } | null>(null);

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
        const subjectIds: number[] = [];
        const levelIds: number[] = [];
        if (Array.isArray(data.teacher_subjects)) {
          for (const ts of data.teacher_subjects) {
            if (ts.subject?.id && !subjectIds.includes(ts.subject.id)) subjectIds.push(ts.subject.id);
            if (ts.level?.id && !levelIds.includes(ts.level.id)) levelIds.push(ts.level.id);
          }
        }
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
          subject_ids: subjectIds,
          level_ids: levelIds,
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
  }, [isLoggedIn]);

  if (loading) return <PageLoader />;

  const toggleId = (arr: number[], id: number) =>
    arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];

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
      form.subject_ids.forEach((id) => fd.append("subject_ids", String(id)));
      form.level_ids.forEach((id) => fd.append("level_ids", String(id)));

      if (photoDoc.file)    fd.append("photo", photoDoc.file);
      if (identityDoc.file) fd.append("identity_document", identityDoc.file);
      if (cvDoc.file)       fd.append("cv", cvDoc.file);
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

        {/* Matières */}
        {subjects.length > 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-1 text-sm font-bold text-gray-700">Matières enseignées</h2>
            <p className="mb-3 text-xs text-gray-400">Sélectionnez toutes les matières que vous enseignez</p>
            <div className="flex flex-wrap gap-2">
              {subjects.map((s) => {
                const active = form.subject_ids.includes(s.id);
                return (
                  <button key={s.id} type="button"
                    onClick={() => setForm((p) => ({ ...p, subject_ids: toggleId(p.subject_ids, s.id) }))}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${active ? "border-primary-300 bg-primary-500 text-white shadow-sm" : "border-gray-200 bg-white text-gray-500 hover:border-primary-200 hover:text-primary-600"}`}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Niveaux */}
        {levels.length > 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-1 text-sm font-bold text-gray-700">Niveaux</h2>
            <p className="mb-3 text-xs text-gray-400">Quels niveaux pouvez-vous encadrer ?</p>
            <div className="flex flex-wrap gap-2">
              {levels.map((l) => {
                const active = form.level_ids.includes(l.id);
                return (
                  <button key={l.id} type="button"
                    onClick={() => setForm((p) => ({ ...p, level_ids: toggleId(p.level_ids, l.id) }))}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${active ? "border-indigo-300 bg-indigo-500 text-white shadow-sm" : "border-gray-200 bg-white text-gray-500 hover:border-indigo-200 hover:text-indigo-600"}`}
                  >
                    {l.name}
                  </button>
                );
              })}
            </div>
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
            />

            {/* Pièce d'identité */}
            <div className="space-y-2">
              <label className="flex items-center gap-1 text-xs font-medium text-gray-600">
                Pièce d&apos;identité <span className="text-red-400">*</span>
              </label>
              <p className="text-[11px] text-gray-400">Scan lisible recto-verso (carte NINA, passeport ou CNI)</p>
              <select
                value={form.identity_document_type}
                onChange={(e) => setForm((p) => ({ ...p, identity_document_type: e.target.value }))}
                className="input text-sm mb-2"
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
              />
            </div>

            {/* CV */}
            <DocUploadField
              label="CV (Curriculum Vitae)"
              hint="Votre CV au format PDF ou image — expériences, formations, diplômes"
              accept="application/pdf,image/*"
              value={cvDoc}
              onChange={setCvDoc}
              required
            />

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
