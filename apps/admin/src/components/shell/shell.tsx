import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-[#080B14]">
      <Sidebar />
      <div className="flex-1 flex flex-col" style={{ marginLeft: "var(--sidebar-w)" }}>
        <Topbar />
        <main className="flex-1 pt-16 p-4 md:p-6 bg-[#080B14]">{children}</main>
      </div>
    </div>
  );
}
