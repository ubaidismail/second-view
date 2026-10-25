"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton({
  label,
  className = "button button-small",
}: {
  label: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button className={className} disabled={pending} aria-busy={pending}>
      {pending ? (
        <>
          <span className="spinner" aria-hidden="true" /> Saving…
        </>
      ) : (
        label
      )}
    </button>
  );
}