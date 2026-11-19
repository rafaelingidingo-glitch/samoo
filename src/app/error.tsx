"use client";

/**
 * Global error boundary — shows a friendly message and never leaks
 * stack traces or internals to the user.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-3 font-heading text-3xl font-bold uppercase tracking-tight md:text-4xl">
        An unexpected error occurred
      </h1>
      <p className="mt-4 max-w-md text-center text-muted-foreground">
        Please try again. If the problem continues, contact us on WhatsApp and our team will
        help you out.
      </p>
      <button
        onClick={reset}
        className="mt-8 inline-flex items-center rounded-md bg-ink px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/85"
      >
        Try again
      </button>
      {/* Error digest for support — no stack traces */}
      {error.digest && (
        <p className="mt-4 text-xs text-muted-foreground">Reference: {error.digest}</p>
      )}
    </div>
  );
}
