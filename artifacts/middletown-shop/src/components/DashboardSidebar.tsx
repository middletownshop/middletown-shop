import { NavLink } from "react-router-dom";
import { LayoutDashboard, Wallet, Signal, Package, Receipt, User, Handshake, TrendingUp, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const links = [
  { to: "/dashboard", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" />, end: true },
  { to: "/wallet", label: "Wallet", icon: <Wallet className="w-4 h-4" /> },
  { to: "/bundles", label: "Data Bundles", icon: <Signal className="w-4 h-4" /> },
  { to: "/orders", label: "My Orders", icon: <Package className="w-4 h-4" /> },
  { to: "/bundle-orders", label: "Bundle Orders", icon: <Receipt className="w-4 h-4" /> },
  { to: "/profile", label: "Profile", icon: <User className="w-4 h-4" /> },
];

const agentLinks = [
  { to: "/agent/dashboard", label: "Agent Dashboard", icon: <TrendingUp className="w-4 h-4" /> },
];

const becomeAgentLink = { to: "/agent/apply", label: "Become an Agent", icon: <Handshake className="w-4 h-4" /> };

export default function DashboardSidebar() {
  const { userProfile } = useAuth();
  const isAgent = userProfile?.role === "agent" || userProfile?.role === "admin";

  const allLinks = [
    ...links,
    ...(isAgent ? agentLinks : [becomeAgentLink]),
  ];

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 min-h-full bg-white border-r border-border flex-shrink-0">
        <div className="p-4 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">My Account</p>
        </div>
        <nav className="flex-1 py-3">
          {allLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={"end" in link ? (link as any).end : false}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-primary/8 text-primary font-semibold border-r-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`
              }
            >
              {link.icon}
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
        {userProfile && (
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{userProfile.displayName || userProfile.email}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{userProfile.role}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile tab bar */}
      <div className="md:hidden flex overflow-x-auto border-b border-border bg-white gap-1 px-2 py-1.5 flex-shrink-0 sticky top-0 z-10">
        {allLinks.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={"end" in link ? (link as any).end : false}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors flex-shrink-0 ${
                isActive
                  ? "bg-primary text-white font-semibold"
                  : "text-muted-foreground hover:bg-muted"
              }`
            }
          >
            {link.icon}
            <span>{link.label}</span>
          </NavLink>
        ))}
      </div>
    </>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row flex-1 min-h-0">
      <DashboardSidebar />
      <main className="flex-1 min-w-0 overflow-auto bg-gray-50/50">
        {children}
      </main>
    </div>
  );
}
