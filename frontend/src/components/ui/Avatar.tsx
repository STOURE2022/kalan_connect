import Image from "next/image";
import { cn, getInitials } from "@/lib/utils";

interface AvatarProps {
  src: string | null;
  firstName: string;
  lastName: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-24 w-24 text-2xl",
};

export default function Avatar({
  src,
  firstName,
  lastName,
  size = "md",
  className,
}: AvatarProps) {
  if (src) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-full bg-gray-100",
          sizes[size],
          className
        )}
      >
        <Image
          src={src}
          alt={`${firstName} ${lastName}`}
          fill
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700",
        sizes[size],
        className
      )}
    >
      {getInitials(firstName, lastName)}
    </div>
  );
}
