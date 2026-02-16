"use client";

import Link from "next/link";
import { Lock } from "lucide-react";

/**
 * Official Stripe logo SVG (icon) - inherits currentColor for use on dark/light buttons.
 * Source: Simple Icons / Stripe brand guidelines
 */
function StripeLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.63 3.096 3.986 4.506 3.986 6.218c0 4.039 2.467 5.76 6.127 7.219 2.59.92 3.63 1.574 3.63 2.793 0 .98-.84 1.549-2.354 1.549-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.236-7.219z" />
    </svg>
  );
}

const baseStyles =
  "inline-flex flex-col items-center justify-center gap-0.5 rounded-xl font-bold no-underline transition text-center";

const sizeStyles = {
  sm: "px-4 py-2.5 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-base sm:text-lg",
} as const;

const variantStyles = {
  accent: "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-soft",
  outline:
    "border border-[var(--accent)]/50 bg-[var(--surface)] text-[var(--accent)] hover:bg-[var(--accent-light)]",
} as const;

const subtextSizeStyles = {
  sm: "text-[9px]",
  md: "text-[10px]",
  lg: "text-[11px]",
} as const;

type PurchaseButtonBaseProps = {
  label: string;
  secureNote: string;
  size?: keyof typeof sizeStyles;
  variant?: keyof typeof variantStyles;
  className?: string;
};

type PurchaseButtonAsLink = PurchaseButtonBaseProps & {
  as: "link";
  href: string;
  onClick?: () => void;
};

type PurchaseButtonAsButton = PurchaseButtonBaseProps & {
  as: "button";
  onClick: () => void;
  disabled?: boolean;
};

export type PurchaseButtonProps = PurchaseButtonAsLink | PurchaseButtonAsButton;

export function PurchaseButton(props: PurchaseButtonProps) {
  const {
    label,
    secureNote,
    size = "md",
    variant = "accent",
    className = "",
  } = props;

  const content = (
    <>
      <span className="block leading-tight">{label}</span>
      <span
        className={`flex items-center justify-center gap-1.5 opacity-90 ${subtextSizeStyles[size]}`}
      >
        <Lock className="h-3 w-3 shrink-0" aria-hidden />
        <StripeLogo className="h-3 w-3 shrink-0 [color:inherit]" />
        <span className="font-medium">{secureNote}</span>
      </span>
    </>
  );

  const combinedClassName = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`.trim();

  if (props.as === "link") {
    return (
      <Link
        href={props.href}
        onClick={props.onClick}
        className={combinedClassName}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
      className={combinedClassName}
    >
      {content}
    </button>
  );
}
