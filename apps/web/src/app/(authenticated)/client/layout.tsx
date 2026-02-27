/**
 * Client role layout — pass-through.
 * RoleTheme is applied at the root (authenticated)/layout.tsx level
 * so the green theme persists across ALL pages, not just /client/* routes.
 */
export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
