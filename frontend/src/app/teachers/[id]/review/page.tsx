"use client";

import { Suspense, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { bookings as bookingsApi } from "@/lib/api";
import StarRating from "@/components/ui/StarRating";
import toast from "react-hot-toast";

function ReviewForm() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const teacherId = Number(params.id);
  const bookingId = Number(searchParams.get("booking") ?? "0");

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Choisissez une note");
      return;
    }
    if (!bookingId) {
      toast.error("Réservation introuvable");
      return;
    }
    setLoading(true);
    try {
      await bookingsApi.createReview({
        teacher: teacherId,
        booking: bookingId,
        rating,
        comment,
      });
      setSuccess(true);
    } catch {
      toast.error("Erreur lors de l'envoi de l'avis");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <CheckCircle2 size={48} className="mx-auto text-primary-500" />
          <h2 className="mt-4 text-xl font-bold text-gray-900">
            Merci pour votre avis !
          </h2>
          <button
            onClick={() => router.push(`/teachers/${teacherId}`)}
            className="btn-primary mt-6"
          >
            Retour au profil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1 text-sm text-gray-500"
      >
        <ArrowLeft size={18} />
        Retour
      </button>

      <h1 className="text-2xl font-bold text-gray-900">Laisser un avis</h1>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-700">Votre note</h3>
        <div className="mt-2">
          <StarRating
            rating={rating}
            size={32}
            showValue={false}
            interactive
            onChange={setRating}
          />
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-700">
          Votre commentaire (optionnel)
        </h3>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Partagez votre experience..."
          rows={4}
          className="input mt-2 resize-none"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || rating === 0}
        className="btn-primary mt-6 w-full"
      >
        {loading ? "Envoi..." : "Envoyer l'avis"}
      </button>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary-500" />
      </div>
    }>
      <ReviewForm />
    </Suspense>
  );
}
