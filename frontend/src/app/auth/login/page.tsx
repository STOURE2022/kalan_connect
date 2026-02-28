"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Phone, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(phone, password);
      toast.success("Connexion reussie !");
      router.push("/");
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error("Telephone ou mot de passe incorrect");
      } else {
        toast.error("Erreur de connexion");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500">
            <span className="text-xl font-bold text-white">K</span>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Bon retour !
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Connectez-vous a votre compte KalanConnect
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {/* Phone */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Numero de telephone
            </label>
            <div className="relative">
              <Phone
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+223 70 00 00 00"
                className="input !pl-10"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                className="input !pl-10 !pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Pas encore de compte ?{" "}
          <Link
            href="/auth/register"
            className="font-semibold text-primary-600 hover:text-primary-700"
          >
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}
