"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
          <h2 className="text-xl font-bold">Une erreur critique est survenue</h2>
          <p className="text-sm text-gray-500">{error.message || "Erreur inattendue"}</p>
          <button
            onClick={reset}
            className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
