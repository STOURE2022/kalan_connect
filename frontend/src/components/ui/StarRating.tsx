"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  showValue?: boolean;
  reviewCount?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export default function StarRating({
  rating,
  maxRating = 5,
  size = 16,
  showValue = true,
  reviewCount,
  interactive = false,
  onChange,
}: StarRatingProps) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxRating }).map((_, i) => {
        const filled = i < Math.round(rating);
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(i + 1)}
            className={cn(
              "transition-transform",
              interactive && "cursor-pointer hover:scale-110"
            )}
          >
            <Star
              size={size}
              className={cn(
                filled
                  ? "fill-accent-400 text-accent-400"
                  : "fill-gray-200 text-gray-200"
              )}
            />
          </button>
        );
      })}
      {showValue && (
        <span className="ml-1 text-sm font-semibold text-gray-700">
          {rating.toFixed(1)}
        </span>
      )}
      {reviewCount !== undefined && (
        <span className="text-sm text-gray-400">({reviewCount} avis)</span>
      )}
    </div>
  );
}
