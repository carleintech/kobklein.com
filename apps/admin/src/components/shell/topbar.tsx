"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@kobklein/ui/button";
import { LogOut, User } from "lucide-react";

export function Topbar() {
  return (
    <header
      className="h-16 border-b border-white/5 bg-[#060D1F] flex items-center justify-between px-6 fixed top-0 right-0 z-10"
      style={{ left: "var(--sidebar-w)" }}
    >
      <div className="flex items-center gap-3">
        <span className="text-sm text-[#6B7489]">
          Operations Command Center
        </span>
        <span className="text-xs font-medium px-2 py-0.5 rounded bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/20">
          DEVELOPMENT
        </span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 border-white/5 bg-[#0F1D35] hover:bg-[#0F1D35]/80">
            <User className="h-4 w-4" />
            Admin
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-[#0F1D35] border-white/5">
          <DropdownMenuLabel className="text-[#F0F1F5]">My Account</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-white/5" />
          <DropdownMenuItem asChild>
            <a href="/auth/logout" className="flex items-center gap-2 cursor-pointer text-[#F0F1F5] hover:bg-white/5">
              <LogOut className="h-4 w-4" />
              Logout
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
