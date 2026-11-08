"use client";

import { Check, Copy } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

/** Submit button that asks for confirmation first. Use inside a <form>. */
export function ConfirmButton({
  message,
  className,
  children,
}: {
  message: string;
  className?: string;
  children: ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}

/** Copies the full URL of a path, e.g. "/appel-30-min". */
export function CopyLinkButton({ path, label = "Copier le lien" }: { path: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn-ghost"
      onClick={async () => {
        await navigator.clipboard.writeText(`${window.location.origin}${path}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
      {copied ? "Lien copié" : label}
    </button>
  );
}

/** Form submit button showing a pending label. */
export function SubmitButton({
  children,
  pendingLabel,
  className = "btn",
}: {
  children: ReactNode;
  pendingLabel: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel : children}
    </button>
  );
}

export function FormMessage({ state }: { state: { error?: string; ok?: boolean } }) {
  if (state.error) {
    return (
      <p role="alert" className="text-sm text-danger">
        {state.error}
      </p>
    );
  }
  if (state.ok) {
    return (
      <p role="status" className="inline-flex items-center gap-1.5 text-sm text-success">
        <Check className="size-4" /> Enregistré
      </p>
    );
  }
  return null;
}
