import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogoIcon } from "@/components/Logo";
import AdminNotificationBell from "@/components/AdminNotificationBell";
import { 
  ShoppingCart, 
  Search, 
  Menu, 
  X, 
  Bell, 
  User, 
  LogOut, 
  Settings, 
  Package, 
  Signal, 
  Wallet, 
  TrendingUp,
  Clock,
  ShieldCheck,
  Flame,
  LifeBuoy,
  Layers
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import toast from "react-hot-toast";

const CATEGORIES = [
  { label: "All Products", href: "/products" },
  { label: "Shop Products", href: "/products?category=market" },
  { label: "Data Bundles", href: "/bundles" },
  { label: "Services", href: "/products?category=service" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  const { user, isAdmin, isAgent, userProfile } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hour = currentTime.getHours();
  const greeting =
    hour < 12
      ? "Good Morning"
      : hour < 18
      ? "Good Afternoon"
      : "Good Evening";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuery = searchQuery.trim();
    if (cleanQuery) {
      setMenuOpen(false);
      navigate(`/products?search=${encodeURIComponent(cleanQuery)}`);
    }
  };

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, "notifications"),
      (snapshot) => {
        let count = 0;
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as any;
          if (data.userId === user.uid && data.read === false) {
            count++;
          }
        });
        setUnreadCount(count);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
      navigate("/");
    } catch {
      toast.error("Failed to log out");
    }
    setUserMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-border/80">
      {/* Premium Top Bar Billboard */}
      <div className="bg-gradient-to-r from-slate-900 via-primary to-slate-900 text-white text-xs py-2 px-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center font-medium">
          <span className="flex items-center gap-1.5 tracking-wide">
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            Middletown Shop — Ghana's premium trusted multi-vendor marketplace
          </span>
          <div className="flex items-center gap-4 text-slate-200">
            {!user && (
              <>
                <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
                <span className="opacity-40">|</span>
                <Link to="/login?tab=register" className="hover:text-white transition-colors">Register</Link>
              </>
            )}
            {isAdmin && (
              <Link to="/admin" className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-bold tracking-wide transition-colors">
                <ShieldCheck className="w-3.5 h-3.5" /> Admin Panel
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Brand & Controls Matrix */}
      <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between gap-4">

        {/* Brand Logo & Dynamic Greeting Box Container */}
        <div className="flex-shrink-0 flex items-center gap-3">
          <Link to="/" className="group flex-shrink-0">
            <LogoIcon className="w-10 h-10 group-hover:scale-105 transition-transform duration-300 drop-shadow-sm" />
          </Link>

          {/* Placed Greeting Box & Clock right here where MiddletownShop used to be */}
          <div className="flex flex-col text-left">
            <p className="text-xs font-bold text-foreground line-clamp-1">
              {greeting}{userProfile?.displayName ? `, ${userProfile.displayName}` : "!"}
            </p>
            <p className="text-[10px] text-muted-foreground/90 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3 text-primary/70" />

              {currentTime.toLocaleTimeString("en-GH", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>

            <p className="text-[10px] text-muted-foreground/80 font-medium">
              {currentTime.toLocaleDateString("en-GH", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Polished Inset Form Search Container (Desktop Only) */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl relative hidden md:block">
          <div className="relative flex items-center bg-muted/60 rounded-2xl border border-border/60 p-0.5 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all duration-300">
            <input 
              type="search" 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search products, bundles & store items..." 
              data-testid="input-search"
              className="w-full bg-transparent pl-4 pr-10 py-2 text-sm font-medium placeholder:text-muted-foreground/80 focus:outline-none" 
            />
            <button 
              type="submit" 
              data-testid="button-search"
              className="absolute right-1.5 bg-primary hover:bg-primary/95 text-white p-2 rounded-xl transition-all duration-200 active:scale-95"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Dynamic Profile/Utility Actions Block */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto md:ml-0">

          {/* Conditional Wallet Section separated and remaining in the right block */}
          {user && userProfile && (
            <div className="hidden lg:flex flex-col items-end border border-border/60 bg-muted/30 px-3.5 py-1.5 rounded-2xl shadow-inner">
              <span className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase">Wallet</span>
              <span className="text-sm font-black text-emerald-600">
                ₵{Number(userProfile.walletBalance || 0).toLocaleString("en-GH", { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}

          {/* Quick-Access Bundle Feature Link */}
          <Link to="/bundles" className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl hover:bg-muted font-bold text-sm text-foreground transition-all">
            <Signal className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span>Bundles</span>
          </Link>

          {/* Admin Notification Bell */}
          {isAdmin && <AdminNotificationBell />}

          {/* Luxury Cart Component */}
          <Link 
            to="/cart" 
            data-testid="link-cart"
            className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-muted/40 hover:bg-muted border border-border/40 text-foreground transition-all duration-200"
          >
            <ShoppingCart className="w-4 h-4 text-foreground/80" />
            <span className="hidden sm:block text-sm font-bold">Cart</span>
            {cartItems.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-black ring-2 ring-white animate-bounce">
                {cartItems.length}
              </span>
            )}
          </Link>

          {/* Account Profile Action Trigger & Context Flyout */}
          {user ? (
            <div className="relative">
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)} 
                data-testid="button-user-menu"
                className="flex items-center gap-2.5 p-1 sm:pl-1 sm:pr-3 rounded-2xl hover:bg-muted border border-transparent hover:border-border/60 transition-all duration-200"
              >
                <div className="w-8 h-8 bg-gradient-to-tr from-primary/20 to-purple-500/20 rounded-xl flex items-center justify-center shadow-inner">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="hidden sm:flex flex-col text-left max-w-[110px]">
                  <span className="text-xs font-black text-foreground truncate">
                    {userProfile?.displayName || user.email?.split("@")[0]}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold">
                    ₵{Number(userProfile?.walletBalance || 0).toLocaleString("en-GH")}
                  </span>
                </div>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-border/80 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
                  <div className="px-4 py-2 border-b border-border/60 mb-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Account Matrix</p>
                    <p className="text-xs font-black text-foreground truncate">{user.email}</p>
                  </div>

                  <Link to="/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-foreground/90 hover:bg-muted transition-colors">
                    <User className="w-4 h-4 text-muted-foreground" /> My Dashboard
                  </Link>

                  <Link to="/wallet" onClick={() => setUserMenuOpen(false)} className="flex items-center justify-between px-4 py-2 text-sm font-medium text-foreground/90 hover:bg-muted transition-colors">
                    <span className="flex items-center gap-2.5">
                      <Wallet className="w-4 h-4 text-emerald-500" /> Wallet Balance
                    </span>
                    {userProfile && (
                      <span className="text-xs bg-emerald-50 text-emerald-700 font-extrabold px-2 py-0.5 rounded-lg">
                        ₵{Number(userProfile.walletBalance || 0).toLocaleString("en-GH")}
                      </span>
                    )}
                  </Link>

                  <Link to="/bundles" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-foreground/90 hover:bg-muted transition-colors">
                    <Signal className="w-4 h-4 text-primary" /> Data Bundles
                  </Link>

                  <Link to="/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-foreground/90 hover:bg-muted transition-colors">
                    <Package className="w-4 h-4 text-muted-foreground" /> My Orders
                  </Link>

                  <Link to="/bundle-orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-foreground/90 hover:bg-muted transition-colors">
                    <Layers className="w-4 h-4 text-muted-foreground" /> Bundle Orders
                  </Link>

                  <Link to="/complaints" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-foreground/90 hover:bg-muted transition-colors">
                    <LifeBuoy className="w-4 h-4 text-muted-foreground" /> Complaints Center
                  </Link>

                  <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-foreground/90 hover:bg-muted transition-colors">
                    <Settings className="w-4 h-4 text-muted-foreground" /> Profile Settings
                  </Link>

                  {isAgent && (
                    <Link to="/agent/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 mt-1 mx-2 rounded-xl text-sm font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors">
                      <TrendingUp className="w-4 h-4" /> Agent Dashboard
                    </Link>
                  )}

                  <div className="border-t border-border/60 mt-2 pt-1.5">
                    <button onClick={handleLogout} className="flex items-center gap-2.5 px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 w-full transition-colors text-left">
                      <LogOut className="w-4 h-4" /> Sign Out Account
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" data-testid="link-login"
              className="flex items-center gap-1 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold shadow-md shadow-primary/20 hover:bg-primary/95 transition-all active:scale-95">
              Sign In
            </Link>
          )}

          {/* Global Notification Ecosystem Button */}
          {user && (
            <button
              onClick={() => navigate("/notifications")}
              className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-muted/40 hover:bg-muted border border-border/40 transition-all text-foreground"
            >
              <Bell className="w-4 h-4 text-foreground/80" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          )}

          {/* Mobile Overlay Menu Button */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-xl bg-muted/60 text-foreground transition-colors border border-border/40">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Dedicated Standalone Row for Mobile Devices Search */}
      <div className="block md:hidden px-4 pb-3">
        <form onSubmit={handleSearch} className="w-full relative">
          <div className="relative flex items-center bg-muted/60 rounded-xl border border-border/60 p-0.5">
            <input 
              type="search" 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search store items..." 
              className="w-full bg-transparent pl-4 pr-10 py-2 text-sm font-medium focus:outline-none" 
            />
            <button type="submit" className="absolute right-1.5 bg-primary text-white p-1.5 rounded-lg">
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>

      {/* Persistent Horizontal Navigation Strip */}
      <nav className="hidden md:flex border-t border-border/60 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 flex gap-2">
          {CATEGORIES.map(cat => (
            <Link key={cat.href} to={cat.href}
              className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors relative group whitespace-nowrap">
              {cat.label}
              <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-200" />
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile Drawer Menu Panel Overlay */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-white py-3 px-4 flex flex-col gap-1.5 shadow-xl animate-in slide-in-from-top-4 duration-200">
          <Link to="/" onClick={() => setMenuOpen(false)} className="py-2.5 px-2 text-sm font-bold border-b border-border/40 flex items-center justify-between">
            <span>Home Marketplace</span>
          </Link>

          {CATEGORIES.map(cat => (
            <Link key={cat.href} to={cat.href} onClick={() => setMenuOpen(false)} className="py-2.5 px-2 text-sm font-medium text-muted-foreground hover:text-foreground">
              {cat.label}
            </Link>
          ))}

          {user && (
            <>
              <div className="border-t border-border/60 my-2" />
              <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="py-2 px-2 text-sm font-bold text-foreground">
                Dashboard Overview
              </Link>
              <Link to="/wallet" onClick={() => setMenuOpen(false)} className="py-2 px-2 text-sm text-muted-foreground flex justify-between">
                <span>Wallet Balance</span>
                <span className="font-bold text-emerald-600">₵{Number(userProfile?.walletBalance || 0).toLocaleString("en-GH")}</span>
              </Link>
              <Link to="/bundles" onClick={() => setMenuOpen(false)} className="py-2 px-2 text-sm text-muted-foreground">
                Data Bundles
              </Link>
              <Link to="/orders" onClick={() => setMenuOpen(false)} className="py-2 px-2 text-sm text-muted-foreground">
                My Orders
              </Link>
              <Link to="/bundle-orders" onClick={() => setMenuOpen(false)} className="py-2 px-2 text-sm text-muted-foreground">
                Bundle Orders
              </Link>
              <Link to="/complaints" onClick={() => setMenuOpen(false)} className="py-2 px-2 text-sm text-muted-foreground">
                Complaints Queue
              </Link>
              <Link to="/profile" onClick={() => setMenuOpen(false)} className="py-2 px-2 text-sm text-muted-foreground">
                Profile Context
              </Link>
              <Link to="/agent/apply" onClick={() => setMenuOpen(false)} className="py-2 px-2 text-sm font-bold text-amber-600">
                Become an Agent
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}