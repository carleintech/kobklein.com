/**
 * Distributor role layout — pass-through.
 * RoleTheme is applied at the root (authenticated)/layout.tsx level
 * so the orange theme persists across ALL pages, not just /distributor/* routes.
 */
export default function DistributorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
