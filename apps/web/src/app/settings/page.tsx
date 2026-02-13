import Link from "next/link";
import { User, Shield, CreditCard, ChevronRight } from "lucide-react";

const sections = [
  {
    href: "/settings/profile",
    icon: User,
    title: "Profile",
    description: "Manage your personal information and K-handle",
  },
  {
    href: "/settings/security",
    icon: Shield,
    title: "Security",
    description: "Emergency lock, PIN management, and trusted devices",
  },
  {
    href: "/settings/plan",
    icon: CreditCard,
    title: "Subscription Plan",
    description: "View or upgrade your current plan and billing",
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Heading */}
      <h1
        className="text-2xl font-semibold text-[#F2F2F2]"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Settings
      </h1>

      {/* Setting Cards */}
      <div className="space-y-3">
        {sections.map(({ href, icon: Icon, title, description }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 rounded-2xl bg-[#151B2E] p-4 border border-white/5 hover:border-[#C6A756]/30 transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#C6A756]/10 flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-[#C6A756]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-[#F2F2F2]">{title}</div>
              <div className="text-xs text-[#7A8394] mt-0.5">{description}</div>
            </div>
            <ChevronRight className="h-4 w-4 text-[#7A8394] group-hover:text-[#C6A756] transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
