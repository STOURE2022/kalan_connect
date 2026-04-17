"use client";

import { useEffect } from "react";

export default function Error({
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <h2 className="text-xl font-bold text-gray-900">Une erreur est survenue</h2>
      <p className="text-sm text-gray-500">{error.message || "Erreur inattendue"}</p>
      <button
        onClick={reset}
        className="rounded-xl bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600"
      >
        Réessayer
      </button>
    </div>
  );
}
