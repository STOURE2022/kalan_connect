"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Lock, Trash2, Save, Camera } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/api";
import { getAccessToken } from "@/lib/api";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import Avatar from "@/components/ui/Avatar";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading, isLoggedIn } = useAuth();
  const [form, setForm] = useState({ first_name: "", last_name: "", city: "", neighborhood: "" });
  const [passwords, setPasswords] = useState({ old_password: "", new_password: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !isLoggedIn) router.push("/auth/login");
  }, [loading, isLoggedIn, router]);

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name ?? "",
        last_name: user.last_name ?? "",
        city: user.city ?? "",
        neighborhood: user.neighborhood ?? "",
      });
    }
  }, [user]);

  if (loading || !user) return <PageLoader />;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) return;
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append("avatar", avatarFile);
      await auth.updateProfile(fd);
      toast.success("Photo de profil mise à jour !");
      setAvatarFile(null);
    } catch {
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      await auth.updateProfile(fd);
      toast.success("Profil mis à jour !");
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new_password !== passwords.confirm) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    setSavingPwd(true);
    try {
      const token = getAccessToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/change-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ old_password: passwords.old_password, new_password: passwords.new_password }),
      });
      if (!res.ok) throw new Error();
      toast.success("Mot de passe modifié !");
      setPasswords({ old_password: "", new_password: "", confirm: "" });
    } catch {
      toast.error("Ancien mot de passe incorrect");
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Paramètres</h1>
      </div>

      {/* Avatar */}
      <div className="mb-6 flex items-center gap-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="relative flex-shrink-0">
          <Avatar
            src={avatarPreview ?? user.avatar}
            firstName={user.first_name}
            lastName={user.last_name}
            size="lg"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-primary-500 shadow-md hover:bg-primary-600 transition-colors"
          >
            <Camera size={12} className="text-white" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900">{user.first_name} {user.last_name}</p>
          <p className="text-sm text-gray-400">{user.phone}</p>
          {avatarFile ? (
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleUploadAvatar}
                disabled={uploadingAvatar}
                className="rounded-lg bg-primary-500 px-3 py-1 text-xs font-semibold text-white hover:bg-primary-600 disabled:opacity-50 transition-colors"
              >
                {uploadingAvatar ? "Envoi..." : "Enregistrer la photo"}
              </button>
              <button
                type="button"
                onClick={() => { setAvatarFile(null); setAvatarPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
                className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-1.5 text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              Changer la photo
            </button>
          )}
        </div>
      </div>

      {/* Profile form */}
      <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
          <User size={16} className="text-primary-500" /> Informations personnelles
        </h2>
        <form onSubmit={handleSaveProfile} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Prénom</label>
              <input
                className="input !py-2.5 text-sm"
                value={form.first_name}
                onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Nom</label>
              <input
                className="input !py-2.5 text-sm"
                value={form.last_name}
                onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Ville</label>
              <select
                className="input !py-2.5 text-sm"
                value={form.city}
                onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
              >
                {["Bamako", "Sikasso", "Segou", "Mopti"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Quartier</label>
              <input
                className="input !py-2.5 text-sm"
                value={form.neighborhood}
                onChange={(e) => setForm((p) => ({ ...p, neighborhood: e.target.value }))}
                placeholder="Hamdallaye"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary mt-1 flex items-center gap-2 !py-2.5 text-sm"
          >
            <Save size={14} />
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>
      </div>

      {/* Password */}
      <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Lock size={16} className="text-primary-500" /> Changer le mot de passe
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Ancien mot de passe</label>
            <input
              type="password"
              className="input !py-2.5 text-sm"
              value={passwords.old_password}
              onChange={(e) => setPasswords((p) => ({ ...p, old_password: e.target.value }))}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Nouveau</label>
              <input
                type="password"
                className="input !py-2.5 text-sm"
                value={passwords.new_password}
                onChange={(e) => setPasswords((p) => ({ ...p, new_password: e.target.value }))}
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Confirmer</label>
              <input
                type="password"
                className="input !py-2.5 text-sm"
                value={passwords.confirm}
                onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={savingPwd}
            className="btn-secondary mt-1 flex items-center gap-2 !py-2.5 text-sm"
          >
            <Lock size={14} />
            {savingPwd ? "Modification..." : "Modifier le mot de passe"}
          </button>
        </form>
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-red-700">
          <Trash2 size={16} /> Zone dangereuse
        </h2>
        <p className="mb-3 text-xs text-red-500">La suppression de votre compte est irréversible.</p>
        <button
          onClick={() => {
            if (confirm("Voulez-vous vraiment supprimer votre compte ?")) {
              const token = getAccessToken();
              fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/account/`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              }).then(() => {
                localStorage.clear();
                window.location.href = "/";
              });
            }
          }}
          className="flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors"
        >
          <Trash2 size={14} /> Supprimer mon compte
        </button>
      </div>
    </div>
  );
}
