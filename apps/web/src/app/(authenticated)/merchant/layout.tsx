/**
 * Merchant role layout — pass-through.
 * RoleTheme is applied at the root (authenticated)/layout.tsx level
 * so the navy theme persists across ALL pages, not just /merchant/* routes.
 */
export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
