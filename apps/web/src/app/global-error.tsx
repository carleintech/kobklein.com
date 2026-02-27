"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "#080B14",
          color: "#F2F2F2",
          fontFamily: "Inter, sans-serif",
          gap: "1rem",
        }}
      >
        <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>
          Something went wrong
        </h1>
        <p style={{ color: "#7A8394", fontSize: "0.875rem" }}>
          Our team has been notified. Please try again.
        </p>
        <button
          onClick={reset}
          style={{
            background: "#C6A756",
            color: "#080B14",
            border: "none",
            borderRadius: "0.5rem",
            padding: "0.5rem 1.25rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
