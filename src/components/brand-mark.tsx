import Link from "next/link";

import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string;
  wordmark?: boolean;
  href?: string;
}

export const BrandMark = ({
  className,
  wordmark = true,
  href = "/",
}: BrandMarkProps) => {
  const mark = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        aria-hidden="true"
        viewBox="0 0 32 32"
        className="size-8 shrink-0"
      >
        <rect width="32" height="32" rx="9" className="fill-foreground" />
        <path
          d="M10 21.5V12.2c0-.66.54-1.2 1.2-1.2H18l4.2 4.2v6.3c0 .66-.54 1.2-1.2 1.2H11.2c-.66 0-1.2-.54-1.2-1.2Z"
          className="stroke-background"
          strokeWidth="1.6"
          fill="none"
        />
        <path
          d="M18 11v4.2H22.2"
          className="stroke-background"
          strokeWidth="1.6"
          fill="none"
          strokeLinejoin="round"
        />
      </svg>
      {wordmark ? (
        <span className="text-[17px] font-semibold tracking-[-0.03em] text-foreground">
          Alder
        </span>
      ) : null}
    </span>
  );

  if (!href) {
    return mark;
  }

  return (
    <Link href={href} aria-label="Alder home" className="w-fit">
      {mark}
    </Link>
  );
};
