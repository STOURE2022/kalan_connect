"use client";

import { useEffect, useState } from "react";
import { getAccessToken } from "@/lib/api";
import {
  CheckCircle2, XCircle, MapPin, Clock, Award,
  ChevronDown, ChevronUp, Wifi, Home, User,
  FileText, ExternalLink, AlertTriangle, Phone,
  ShieldCheck, Camera, CreditCard, FileImage,
} from "lucide-react";
import toast from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

interface VerificationChecklist {
  photo:    { ok: boolean; url: string | null };
  identity: { ok: boolean; url: string | null; type: string };
  diploma:  { ok: boolean; count: number };
  cv:       { ok: boolean; url: string | null };
}

interface PendingTeacher {
  id: number;
  user: { id: number; first_name: string; last_name: string; avatar: string | null; role: string };
  bio: string;
  hourly_rate: number;
  city: string;
  neighborhood: string;
  experience_years: number;
  teaches_online: boolean;
  teaches_at_home: boolean;
  teaches_at_student: boolean;
  avg_rating: number;
  total_reviews: number;
  total_bookings: number;
  is_verified: boolean;
  teacher_subjects: { subject: { name: string }; level: { name: string } }[];
  diplomas: { id: number; title: string; institution: string; year: number; document: string | null }[];
  verification_checklist: VerificationChecklist | null;
  created_at: string;
}

interface IncompleteTeacher {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  city: string;
  is_active: boolean;
  created_at: string;
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Onglet : Profils en attente de vérification ───────────────────────────────
function PendingTab() {
  const [pending, setPending]       = useState<PendingTeacher[]>([]);
  const [loading, setLoading]       = useState(true);
  const [expanded, setExpanded]     = useState<number | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<number, string>>({});
  // rejected_docs[teacherId] = set of doc keys marked "à corriger" by admin
  const [rejectedDocs, setRejectedDocs] = useState<Record<number, Set<string>>>({});

  const toggleRejectedDoc = (teacherId: number, docKey: string) => {
    setRejectedDocs((prev) => {
      const next = new Set(prev[teacherId] ?? []);
      if (next.has(docKey)) next.delete(docKey); else next.add(docKey);
      return { ...prev, [teacherId]: next };
    });
  };

  const token = () => getAccessToken();

  useEffect(() => {
    fetch(`${API}/admin/teachers/pending/`, { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((d) => setPending(Array.isArray(d) ? d : (d.results ?? [])))
      .catch(() => toast.error("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  const handleVerify = async (teacher: PendingTeacher, approved: boolean) => {
    setProcessingId(teacher.id);
    try {
      const res = await fetch(`${API}/admin/teachers/${teacher.id}/verify/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({
          approved,
          reason: rejectReason[teacher.id] ?? "",
          rejected_docs: Array.from(rejectedDocs[teacher.id] ?? []),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.missing_labels?.length) {
          toast.error(`Documents manquants : ${data.missing_labels.join(", ")}`, { duration: 5000 });
        } else {
          toast.error(data.error ?? "Erreur lors de l'opération");
        }
        return;
      }
      toast.success(approved ? "Professeur vérifié !" : "Profil refusé");
      setPending((p) => p.filter((t) => t.id !== teacher.id));
    } catch {
      toast.error("Erreur lors de l'opération");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />)}
      </div>
    );
  }

  if (pending.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-[#13151f] border border-white/5 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-500/10">
          <CheckCircle2 size={28} className="text-primary-400" />
        </div>
        <div>
          <p className="font-bold text-white">Aucun profil en attente</p>
          <p className="mt-1 text-sm text-white/30">Tous les professeurs ont été traités</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pending.map((teacher) => {
        const isExp = expanded === teacher.id;
        return (
          <div key={teacher.id} className="rounded-2xl bg-[#13151f] border border-white/5 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/30 to-purple-500/30 text-sm font-bold text-white">
                {teacher.user.first_name[0]}{teacher.user.last_name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white">{teacher.user.first_name} {teacher.user.last_name}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="flex items-center gap-1 text-xs text-white/40">
                    <MapPin size={10} /> {teacher.city}{teacher.neighborhood && ` · ${teacher.neighborhood}`}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-white/40">
                    <Clock size={10} /> {teacher.experience_years} an(s)
                  </span>
                  <span className="text-xs font-bold text-amber-400">
                    {teacher.hourly_rate.toLocaleString()} FCFA/h
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5">
                  {teacher.teaches_online    && <span className="flex items-center gap-1 rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold text-blue-400 border border-blue-500/20"><Wifi size={8} />En ligne</span>}
                  {teacher.teaches_at_home   && <span className="flex items-center gap-1 rounded-full bg-teal-500/15 px-2 py-0.5 text-[10px] font-semibold text-teal-400 border border-teal-500/20"><Home size={8} />À domicile</span>}
                  {teacher.teaches_at_student && <span className="flex items-center gap-1 rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] font-semibold text-purple-400 border border-purple-500/20"><User size={8} />Chez l&apos;élève</span>}
                </div>
                <button
                  onClick={() => setExpanded(isExp ? null : teacher.id)}
                  className="rounded-lg border border-white/10 p-1.5 text-white/40 hover:border-white/20 hover:text-white/60"
                >
                  {isExp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
            </div>

            {/* Expanded */}
            {isExp && (
              <div className="border-t border-white/5 px-4 pb-4 pt-4 space-y-4">
                {teacher.bio && (
                  <div>
                    <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-1.5">Bio</p>
                    <p className="text-sm text-white/60 leading-relaxed">{teacher.bio}</p>
                  </div>
                )}

                {teacher.teacher_subjects.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2">Matières enseignées</p>
                    <div className="flex flex-wrap gap-2">
                      {teacher.teacher_subjects.map((ts, i) => (
                        <span key={i} className="rounded-xl bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-white/70">
                          <span className="font-semibold text-white">{ts.subject.name}</span>
                          <span className="text-white/30 ml-1">· {ts.level.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Checklist documents ── */}
                {teacher.verification_checklist && (() => {
                  const cl = teacher.verification_checklist!;
                  const allOk = cl.photo.ok && cl.identity.ok && cl.diploma.ok && cl.cv.ok;
                  const ID_LABELS: Record<string, string> = { nina: "Carte NINA", passeport: "Passeport", cni: "CNI" };

                  return (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck size={13} className={allOk ? "text-primary-400" : "text-amber-400"} />
                        <p className="text-xs font-semibold text-white/30 uppercase tracking-wider">Documents de vérification</p>
                        {!allOk && (
                          <span className="rounded-full bg-amber-500/15 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                            Incomplet
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          {
                            icon: Camera,
                            label: "Photo de profil",
                            ok: cl.photo.ok,
                            url: cl.photo.url,
                            isImage: true,
                          },
                          {
                            icon: CreditCard,
                            label: cl.identity.type ? `Pièce d'identité — ${ID_LABELS[cl.identity.type] ?? cl.identity.type}` : "Pièce d'identité",
                            ok: cl.identity.ok,
                            url: cl.identity.url,
                            isImage: false,
                          },
                          {
                            icon: Award,
                            label: `Diplôme(s) avec scan (${cl.diploma.count})`,
                            ok: cl.diploma.ok,
                            url: null,
                            isImage: false,
                          },
                          {
                            icon: FileImage,
                            label: "CV",
                            ok: cl.cv.ok,
                            url: cl.cv.url,
                            isImage: false,
                          },
                        ].map(({ icon: Icon, label, ok, url }) => (
                          <div key={label} className={`flex items-center gap-2 rounded-xl px-3 py-2 border ${ok ? "bg-primary-500/10 border-primary-500/20" : "bg-red-500/10 border-red-500/20"}`}>
                            {ok
                              ? <CheckCircle2 size={13} className="flex-shrink-0 text-primary-400" />
                              : <XCircle size={13} className="flex-shrink-0 text-red-400" />
                            }
                            <div className="flex-1 min-w-0">
                              <p className={`text-[11px] font-semibold truncate ${ok ? "text-primary-300" : "text-red-300"}`}>{label}</p>
                            </div>
                            {url && (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-shrink-0 flex items-center gap-0.5 text-[10px] text-white/40 hover:text-white/70"
                              >
                                Voir <ExternalLink size={9} />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {teacher.diplomas.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2">Diplômes</p>
                    <div className="space-y-2">
                      {teacher.diplomas.map((d) => (
                        <div key={d.id} className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
                          <Award size={14} className="text-indigo-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-white">{d.title}</p>
                            <p className="text-[10px] text-white/40">{d.institution} · {d.year}</p>
                          </div>
                          {d.document ? (
                            <a
                              href={d.document}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 rounded-lg bg-indigo-500/15 border border-indigo-500/20 px-2 py-1 text-[10px] font-semibold text-indigo-400 hover:bg-indigo-500/25 transition-colors flex-shrink-0"
                            >
                              <FileText size={10} />Voir<ExternalLink size={8} />
                            </a>
                          ) : (
                            <span className="text-[10px] text-white/20 italic flex-shrink-0">Pas de fichier</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Decision */}
                {(() => {
                  const cl = teacher.verification_checklist;
                  const criticalMissing: string[] = [];
                  if (cl) {
                    if (!cl.photo.ok)    criticalMissing.push("photo de profil");
                    if (!cl.identity.ok) criticalMissing.push("pièce d'identité");
                    if (!cl.cv.ok)       criticalMissing.push("CV");
                  }
                  const canApprove = criticalMissing.length === 0;
                  return (
                    <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4 space-y-3">
                      {!canApprove && (
                        <div className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2.5">
                          <AlertTriangle size={13} className="flex-shrink-0 text-red-400 mt-0.5" />
                          <p className="text-xs text-red-300">
                            <span className="font-bold">Approbation impossible</span> — pièces manquantes :{" "}
                            {criticalMissing.join(", ")}.
                          </p>
                        </div>
                      )}
                      {/* Cases à cocher — docs présents mais à corriger */}
                      {cl && (() => {
                        const presentDocs = [
                          { key: "photo",    label: "Photo de profil",           ok: cl.photo.ok },
                          { key: "identity", label: "Pièce d'identité",          ok: cl.identity.ok },
                          { key: "cv",       label: "CV",                         ok: cl.cv.ok },
                          { key: "diploma",  label: "Scan de diplôme",            ok: cl.diploma.ok },
                        ].filter((d) => d.ok); // seulement les docs déjà fournis
                        if (presentDocs.length === 0) return null;
                        return (
                          <div>
                            <p className="text-xs font-semibold text-white/50 mb-2">Documents à corriger / refaire</p>
                            <div className="grid grid-cols-2 gap-1.5">
                              {presentDocs.map(({ key, label }) => {
                                const checked = rejectedDocs[teacher.id]?.has(key) ?? false;
                                return (
                                  <label
                                    key={key}
                                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-colors ${
                                      checked
                                        ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                                        : "border-white/10 bg-white/5 text-white/50 hover:border-white/20"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => toggleRejectedDoc(teacher.id, key)}
                                      className="accent-amber-400"
                                    />
                                    {label}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                      <p className="text-xs font-semibold text-white/50">Motif de refus / note pour le professeur (optionnel)</p>
                      <textarea
                        value={rejectReason[teacher.id] ?? ""}
                        onChange={(e) => setRejectReason((p) => ({ ...p, [teacher.id]: e.target.value }))}
                        placeholder="Expliquez la raison du refus au professeur..."
                        rows={2}
                        className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-white/20 focus:border-red-500/40 focus:outline-none resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleVerify(teacher, true)}
                          disabled={processingId === teacher.id || !canApprove}
                          title={!canApprove ? `Manquant : ${criticalMissing.join(", ")}` : undefined}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-500 py-2.5 text-sm font-bold text-white hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <CheckCircle2 size={15} />
                          {processingId === teacher.id ? "..." : "Approuver"}
                        </button>
                        <button
                          onClick={() => handleVerify(teacher, false)}
                          disabled={processingId === teacher.id}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 py-2.5 text-sm font-bold text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                        >
                          <XCircle size={15} />
                          {processingId === teacher.id ? "..." : "Refuser"}
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Onglet : Profils incomplets ───────────────────────────────────────────────
function IncompleteTab() {
  const [teachers, setTeachers] = useState<IncompleteTeacher[]>([]);
  const [loading, setLoading]   = useState(true);

  const token = () => getAccessToken();

  useEffect(() => {
    fetch(`${API}/admin/teachers/incomplete/`, { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((d) => setTeachers(Array.isArray(d) ? d : (d.results ?? [])))
      .catch(() => toast.error("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => <div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse" />)}
      </div>
    );
  }

  if (teachers.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-[#13151f] border border-white/5 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
          <CheckCircle2 size={28} className="text-emerald-400" />
        </div>
        <div>
          <p className="font-bold text-white">Aucun profil incomplet</p>
          <p className="mt-1 text-sm text-white/30">Tous les professeurs ont complété leur profil</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-white/30 pb-1">
        Ces professeurs ont créé un compte mais n&apos;ont pas encore rempli leur profil enseignant. Ils n&apos;apparaissent pas dans les recherches.
      </p>
      {teachers.map((t) => (
        <div key={t.id} className="flex items-center gap-4 rounded-2xl bg-[#13151f] border border-amber-500/10 px-4 py-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-sm font-bold text-amber-400">
            {t.first_name[0]}{t.last_name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">{t.first_name} {t.last_name}</p>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="flex items-center gap-1 text-xs text-white/40"><Phone size={9} />{t.phone}</span>
              {t.city && <span className="flex items-center gap-1 text-xs text-white/40"><MapPin size={9} />{t.city}</span>}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
              <AlertTriangle size={9} /> Profil incomplet
            </span>
            <p className="text-[10px] text-white/25 mt-1">Inscrit le {fmt(t.created_at)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function AdminTeachersPage() {
  const [tab, setTab] = useState<"pending" | "incomplete">("pending");

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-black text-white">Professeurs</h1>
        <p className="text-xs text-white/30 mt-0.5">Vérification et suivi des profils enseignants</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-white/5 p-1 w-fit">
        <button
          onClick={() => setTab("pending")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === "pending"
              ? "bg-primary-500 text-white shadow"
              : "text-white/40 hover:text-white/70"
          }`}
        >
          <CheckCircle2 size={14} />
          En attente de vérification
        </button>
        <button
          onClick={() => setTab("incomplete")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === "incomplete"
              ? "bg-amber-500 text-white shadow"
              : "text-white/40 hover:text-white/70"
          }`}
        >
          <AlertTriangle size={14} />
          Profils incomplets
        </button>
      </div>

      {tab === "pending" ? <PendingTab /> : <IncompleteTab />}
    </div>
  );
}
