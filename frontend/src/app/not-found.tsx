import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-extrabold text-gray-200">404</h1>
        <h2 className="mt-4 text-xl font-bold text-gray-800">
          Page introuvable
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          La page que vous cherchez n&apos;existe pas.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="btn-primary gap-2">
            <Home size={16} />
            Accueil
          </Link>
          <Link href="/search" className="btn-secondary gap-2">
            <Search size={16} />
            Rechercher
          </Link>
        </div>
      </div>
    </div>
  );
}
