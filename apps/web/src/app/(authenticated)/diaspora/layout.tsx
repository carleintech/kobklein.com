/**
 * Diaspora role layout — pass-through.
 * RoleTheme is applied at the root (authenticated)/layout.tsx level
 * so the purple theme persists across ALL pages, not just /diaspora/* routes.
 */
export default function DiasporaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
