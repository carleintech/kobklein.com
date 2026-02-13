export default function NotAuthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-[var(--bg)]">
      <div className="max-w-md w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8">
        <h1 className="text-xl font-semibold">Not authorized</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Your account does not have admin access. Contact your administrator to
          request the <strong>admin</strong> role.
        </p>
        <a
          className="mt-6 inline-block text-sm underline text-[var(--accent)] hover:opacity-80"
          href="/auth/logout"
        >
          Logout
        </a>
      </div>
    </div>
  );
}
