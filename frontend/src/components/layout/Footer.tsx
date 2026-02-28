import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500">
                <span className="text-sm font-bold text-white">K</span>
              </div>
              <span className="text-lg font-bold">
                Kalan<span className="text-primary-500">Connect</span>
              </span>
            </div>
            <p className="mt-3 text-sm text-gray-500">
              La plateforme malienne de cours particuliers. Trouvez le meilleur
              professeur pour votre enfant.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Plateforme</h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/search" className="text-sm text-gray-500 hover:text-primary-600">
                  Trouver un prof
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="text-sm text-gray-500 hover:text-primary-600">
                  Devenir professeur
                </Link>
              </li>
              <li>
                <Link href="/payment" className="text-sm text-gray-500 hover:text-primary-600">
                  Tarifs
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900">Support</h4>
            <ul className="mt-3 space-y-2">
              <li>
                <span className="text-sm text-gray-500">aide@kalanconnect.ml</span>
              </li>
              <li>
                <span className="text-sm text-gray-500">+223 70 00 00 00</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900">Legal</h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="#" className="text-sm text-gray-500 hover:text-primary-600">
                  CGU
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-500 hover:text-primary-600">
                  Confidentialite
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-100 pt-6 text-center text-sm text-gray-400">
          KalanConnect &copy; {new Date().getFullYear()} &mdash; Bamako, Mali
        </div>
      </div>
    </footer>
  );
}
