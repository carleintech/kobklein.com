import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-kob-black">
      <Topbar />
      <div className="flex shell-topbar-offset">
        <Sidebar />
        <main className="flex-1 min-w-0 p-4 md:p-6 overflow-x-hidden shell-sidebar-offset">
          {children}
        </main>
      </div>
    </div>
  );
}
