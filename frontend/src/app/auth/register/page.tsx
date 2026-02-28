"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Phone, Lock, User, Mail, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [role, setRole] = useState<"parent" | "teacher">("parent");
  const [form, setForm] = useState({
    phone: "",
    first_name: "",
    last_name: "",
    email: "",
    city: "Bamako",
    neighborhood: "",
    password: "",
    password_confirm: "",
  });
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.password_confirm) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    try {
      await register({ ...form, role });
      toast.success("Compte cree avec succes !");
      router.push(role === "teacher" ? "/profile" : "/");
    } catch (err) {
      if (err instanceof ApiError) {
        const messages = Object.values(err.data).flat().join(", ");
        toast.error(messages || "Erreur lors de l'inscription");
      } else {
        toast.error("Erreur de connexion au serveur");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500">
            <span className="text-xl font-bold text-white">K</span>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Creer un compte
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Rejoignez KalanConnect en quelques minutes
          </p>
        </div>

        {/* Role selector */}
        <div className="mt-6 flex gap-2 rounded-xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setRole("parent")}
            className={cn(
              "flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all",
              role === "parent"
                ? "bg-white text-primary-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            Je suis parent
          </button>
          <button
            type="button"
            onClick={() => setRole("teacher")}
            className={cn(
              "flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all",
              role === "teacher"
                ? "bg-white text-primary-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            Je suis professeur
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Prenom
              </label>
              <div className="relative">
                <User
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={form.first_name}
                  onChange={(e) => update("first_name", e.target.value)}
                  placeholder="Amadou"
                  className="input !pl-9 !py-2.5 text-sm"
                  required
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Nom
              </label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => update("last_name", e.target.value)}
                placeholder="Diallo"
                className="input !py-2.5 text-sm"
                required
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Telephone
            </label>
            <div className="relative">
              <Phone
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="+223 70 00 00 00"
                className="input !pl-9 !py-2.5 text-sm"
                required
              />
            </div>
          </div>

          {/* Email (optional) */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Email (optionnel)
            </label>
            <div className="relative">
              <Mail
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="amadou@email.com"
                className="input !pl-9 !py-2.5 text-sm"
              />
            </div>
          </div>

          {/* City + Neighborhood */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Ville
              </label>
              <div className="relative">
                <MapPin
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <select
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  className="input !pl-9 !py-2.5 text-sm"
                >
                  <option value="Bamako">Bamako</option>
                  <option value="Sikasso">Sikasso</option>
                  <option value="Segou">Segou</option>
                  <option value="Mopti">Mopti</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Quartier
              </label>
              <input
                type="text"
                value={form.neighborhood}
                onChange={(e) => update("neighborhood", e.target.value)}
                placeholder="Hamdallaye"
                className="input !py-2.5 text-sm"
              />
            </div>
          </div>

          {/* Passwords */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Mot de passe
              </label>
              <div className="relative">
                <Lock
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder="Min. 6 caracteres"
                  className="input !pl-9 !py-2.5 text-sm"
                  required
                  minLength={6}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Confirmer
              </label>
              <input
                type="password"
                value={form.password_confirm}
                onChange={(e) => update("password_confirm", e.target.value)}
                placeholder="Confirmer"
                className="input !py-2.5 text-sm"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-2 w-full"
          >
            {loading ? "Creation..." : "Creer mon compte"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Deja un compte ?{" "}
          <Link
            href="/auth/login"
            className="font-semibold text-primary-600 hover:text-primary-700"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
