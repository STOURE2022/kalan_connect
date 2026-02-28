import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const spinnerSizes = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-3",
};

export default function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-primary-200 border-t-primary-600",
        spinnerSizes[size],
        className
      )}
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-gray-500">Chargement...</p>
      </div>
    </div>
  );
}

export function TeacherCardSkeleton() {
  return (
    <div className="card">
      <div className="flex gap-4">
        <div className="skeleton h-20 w-20 flex-shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-5 w-3/4" />
          <div className="skeleton h-4 w-1/2" />
          <div className="skeleton h-4 w-2/3" />
          <div className="flex gap-2">
            <div className="skeleton h-6 w-16 rounded-full" />
            <div className="skeleton h-6 w-20 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
