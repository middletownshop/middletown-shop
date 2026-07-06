import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  LayoutDashboard,
  Wallet,
  Signal,
  Package,
  Receipt,
  User,
  Handshake,
  TrendingUp,
  MessageSquare,
  Menu,
  X,
  MapPin,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const userLinks = [
  { to: "/", label: "Home", icon: <Home className="w-4 h-4" />, end: true },
  { to: "/dashboard", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
  { to: "/wallet", label: "Wallet", icon: <Wallet className="w-4 h-4" /> },
  { to: "/bundles", label: "Data Bundles", icon: <Signal className="w-4 h-4" /> },
  { to: "/orders", label: "My Orders", icon: <Package className="w-4 h-4" /> },
  { to: "/bundle-orders", label: "Bundle Orders", icon: <Receipt className="w-4 h-4" /> },
  { to: "/complaints", label: "Complaints", icon: <MessageSquare className="w-4 h-4" /> },
  { to: "/profile", label: "Profile", icon: <User className="w-4 h-4" /> },
];

const agentOnlyLinks = [
  { to: "/agent/dashboard", label: "Agent Dashboard", icon: <TrendingUp className="w-4 h-4" /> },
  { to: "/agent/complaints", label: "Agent Complaints", icon: <MessageSquare className="w-4 h-4" /> },
];

const adminOnlyLinks = [
  {
    to: "/admin/delivery-settings",
    label: "Delivery Settings",
    icon: <MapPin className="w-4 h-4" />,
  },
];

const becomeAgentLink = { to: "/agent/apply", label: "Become an Agent", icon: <Handshake className="w-4 h-4" /> };

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { userProfile } = useAuth();
  const isAgent =
    userProfile?.role === "agent" ||
    userProfile?.role === "admin";

  const isAdmin =
    userProfile?.role === "admin";

  const allLinks = [
    ...userLinks,
    ...(isAgent ? agentOnlyLinks : [becomeAgentLink]),
    ...(isAdmin ? adminOnlyLinks : []),
  ];
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">My Account</p>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>
      <nav className="flex-1 py-3 overflow-y-auto">
        {allLinks.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={"end" in link ? (link as any).end : false}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary font-semibold border-r-2 border-primary"
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
    </div>
  );
}

export default function DashboardSidebar() {
  return (
    <aside className="w-56 min-h-full flex-shrink-0">
      <SidebarContent />
    </aside>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex flex-1 min-h-0">
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-56 min-h-full flex-shrink-0 border-r border-border">
        <SidebarContent />
      </aside>

      {/* Mobile: hamburger top bar */}
      <div className="flex flex-col flex-1 min-w-0">
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-white sticky top-0 z-10">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          <span className="font-semibold text-foreground text-sm">My Account</span>
        </div>

        {/* Mobile drawer overlay */}
        {drawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />
            <div className="absolute left-0 top-0 bottom-0 w-64 shadow-xl animate-in slide-in-from-left duration-200">
              <SidebarContent onClose={() => setDrawerOpen(false)} />
            </div>
          </div>
        )}

        <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto bg-gray-50/50">
          {children}
        </main>
      </div>
    </div>
  );
}
