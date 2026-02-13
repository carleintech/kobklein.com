export function Topbar() {
  return (
    <header
      className="fixed top-0 right-0 flex items-center justify-between px-6 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-md z-10"
      style={{ left: "var(--sidebar-w)", height: "var(--topbar-h)" }}
    >
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          DEVELOPMENT
        </span>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <a
          href="/auth/logout"
          className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
        >
          Sign out
        </a>
      </div>
    </header>
  );
}
