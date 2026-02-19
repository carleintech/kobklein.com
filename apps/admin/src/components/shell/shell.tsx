import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-[#060D1F]">
      <Sidebar />
      <div className="flex-1 flex flex-col" style={{ marginLeft: "var(--sidebar-w)" }}>
        <Topbar />
        <main className="flex-1 px-4 pb-4 pt-20 md:px-6 md:pb-6 bg-[#060D1F]">{children}</main>
      </div>
    </div>
  );
}
