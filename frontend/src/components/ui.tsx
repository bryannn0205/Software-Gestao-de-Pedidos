import {
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type ReactNode,
  type CSSProperties,
} from "react";
import clsx from "clsx";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost" }) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "primary" && "bg-brand-500 text-white hover:bg-brand-600",
        variant === "secondary" && "bg-surface-2 text-text-primary border border-border-subtle hover:border-border-default",
        variant === "danger" && "bg-danger text-white hover:opacity-90",
        variant === "ghost" && "bg-transparent text-text-secondary hover:bg-surface-2",
        className,
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "w-full rounded-md border border-border-subtle bg-surface-3 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary",
        "focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-400/30",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={clsx(
        "w-full rounded-md border border-border-subtle bg-surface-3 px-3 py-2 text-sm text-text-primary",
        "focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-400/30",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="mb-1 block text-sm font-medium text-text-secondary">{children}</label>;
}

export function Field({ children }: { children: ReactNode }) {
  return <div className="mb-4">{children}</div>;
}

export function Card({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={clsx("rounded-2xl border border-border-subtle bg-surface", className)} style={style}>
      {children}
    </div>
  );
}

export function ErrorText({ children }: { children?: string | null }) {
  if (!children) return null;
  return <p className="mt-1 text-sm text-danger">{children}</p>;
}

const BADGE_STYLES = {
  slate: "bg-surface-2 text-text-secondary",
  green: "bg-success/15 text-success",
  yellow: "bg-warning/15 text-warning",
  red: "bg-danger/15 text-danger",
  blue: "bg-info/15 text-info",
} as const;

export function Badge({ children, color = "slate" }: { children: ReactNode; color?: keyof typeof BADGE_STYLES }) {
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", BADGE_STYLES[color])}>
      {children}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={clsx("h-4 w-4 animate-spin", className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M12 2a10 10 0 0 1 10 10h-4a6 6 0 0 0-6-6V2z" />
    </svg>
  );
}

export function PageHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h1 className="text-2xl font-semibold text-text-primary">{title}</h1>
      {actions}
    </div>
  );
}
