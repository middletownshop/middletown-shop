import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Search, Menu, X, Bell, User, LogOut, Settings, Package, Signal, Wallet, TrendingUp } from "lucide-react";
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
  const [notificationOpen, setNotificationOpen] = useState(false);
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
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
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
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-border">
      {/* Top bar */}
      <div className="bg-primary text-primary-foreground text-xs py-1 px-4 flex justify-between items-center">
        <span>Welcome to Middletown Shop — Ghana's trusted marketplace</span>
        <div className="flex gap-4">
          {!user && (
            <>
              <Link to="/login" className="hover:underline">Sign In</Link>
              <span>|</span>
              <Link to="/login?tab=register" className="hover:underline">Register</Link>
            </>
          )}
          {isAdmin && <Link to="/admin" className="hover:underline font-semibold">Admin Panel</Link>}
        </div>
      </div>

      {/* Main nav */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
        <Link to="/" className="flex-shrink-0 flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
             <span className="text-white font-bold text-sm">MT</span>
          </div>
          <span className="font-bold text-xl text-primary hidden sm:block">Middletown Shop</span>
        </Link>

        <form onSubmit={handleSearch} className="flex-1 flex max-w-2xl">
          <input type="search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search products..." data-testid="input-search"
            className="flex-1 border border-border rounded-l-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          <button type="submit" data-testid="button-search"
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-r-lg transition-colors">
            <Search className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center gap-2 ml-auto">

        {user && userProfile && (
        <div className="flex flex-col items-end mr-4 bg-primary/5 px-3 py-2 rounded-lg border border-primary/10">
            <span className="text-xs font-medium text-foreground">
              {greeting}, {userProfile.displayName}
            </span>

            <span className="text-xs text-muted-foreground">
              {currentTime.toLocaleTimeString("en-GH")}
            </span>

            <span className="text-sm font-bold text-green-600">
              ₵{Number(userProfile.walletBalance || 0).toLocaleString("en-GH")}
            </span>
          </div>
        )}
          <Link to="/bundles" className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-sm font-medium">
            <Signal className="w-4 h-4 text-green-600" />
            <span className="hidden lg:block">Bundles</span>
          </Link>

          <Link to="/cart" data-testid="link-cart"
            className="relative flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-foreground">
            <ShoppingCart className="w-5 h-5" />
            <span className="hidden sm:block text-sm font-medium">Cart</span>
            {cartItems.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {cartItems.length}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative">
              <button onClick={() => setUserMenuOpen(!userMenuOpen)} data-testid="button-user-menu"
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors">
                <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="hidden sm:flex flex-col text-left max-w-[120px]">
                  <span className="text-sm font-medium text-foreground truncate">
                    {userProfile?.displayName || user.email?.split("@")[0]}
                  </span>

                  <span className="text-[10px] text-green-600 font-semibold">
                    ₵{Number(userProfile?.walletBalance || 0).toLocaleString("en-GH")}
                  </span>
                </div>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-1 w-52 bg-white border border-border rounded-lg shadow-lg py-1 z-50">
                  <Link to="/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent">
                    <User className="w-4 h-4" /> My Dashboard
                  </Link>
                  <Link to="/wallet" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent">
                    <Wallet className="w-4 h-4 text-green-600" />
                    <span>Wallet</span>
                    {userProfile && (
                      <span className="ml-auto text-xs text-green-600 font-semibold">
                        ₵{Number(userProfile.walletBalance || 0).toLocaleString("en-GH")}
                      </span>
                    )}
                  </Link>
                  <Link to="/bundles" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent">
                    <Signal className="w-4 h-4 text-green-600" /> Data Bundles
                  </Link>
                  <Link to="/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent">
                    <Package className="w-4 h-4" /> My Orders
                  </Link>
                  <Link to="/complaints" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent">
                    <Settings className="w-4 h-4" /> Complaints
                  </Link>
                  <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent">
                    <Settings className="w-4 h-4" /> Profile
                  </Link>
                  {isAgent && (
                    <Link to="/agent/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent text-orange-600 font-semibold">
                      <TrendingUp className="w-4 h-4" /> Agent Dashboard
                    </Link>
                  )}
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent text-primary font-semibold">
                      Admin Panel
                    </Link>
                  )}
                  <div className="border-t border-border mt-1">
                    <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-destructive/10 text-destructive w-full">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" data-testid="link-login"
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-primary text-primary text-sm font-medium hover:bg-primary hover:text-white transition-colors">
              Sign In
            </Link>
          )}

          {user && (
            <button
              onClick={() => navigate("/notifications")}
              className="relative flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-sm font-medium"
            >
              <Bell className="w-5 h-5" />

              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}

              <span className="hidden sm:block">Notifications</span>
            </button>
          )}

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Category nav */}
      <nav className="hidden md:flex border-t border-border bg-white">
        <div className="max-w-7xl mx-auto px-4 flex gap-0">
          {CATEGORIES.map(cat => (
            <Link key={cat.href} to={cat.href}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-accent transition-colors border-b-2 border-transparent hover:border-primary whitespace-nowrap">
              {cat.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-white py-2 px-4 flex flex-col gap-1">
          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            className="py-2 text-sm font-medium"
          >
            Home
          </Link>
          {CATEGORIES.map(cat => (
            <Link key={cat.href} to={cat.href} onClick={() => setMenuOpen(false)} className="py-2 text-sm text-muted-foreground">
              {cat.label}
            </Link>
          ))}
          {user && (
            <>
              <div className="border-t border-border my-2" />

              <Link
                to="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="py-2 text-sm font-medium"
              >
                Dashboard
              </Link>

              <Link
                to="/wallet"
                onClick={() => setMenuOpen(false)}
                className="py-2 text-sm text-muted-foreground"
              >
                Wallet
              </Link>

              <Link
                to="/bundles"
                onClick={() => setMenuOpen(false)}
                className="py-2 text-sm text-muted-foreground"
              >
                Data Bundles
              </Link>

              <Link
                to="/orders"
                onClick={() => setMenuOpen(false)}
                className="py-2 text-sm text-muted-foreground"
              >
                My Orders
              </Link>

              <Link
                to="/bundle-orders"
                onClick={() => setMenuOpen(false)}
                className="py-2 text-sm text-muted-foreground"
              >
                Bundle Orders
              </Link>

              <Link
                to="/complaints"
                onClick={() => setMenuOpen(false)}
                className="py-2 text-sm text-muted-foreground"
              >
                Complaints
              </Link>

              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="py-2 text-sm text-muted-foreground"
              >
                Profile
              </Link>

              <Link
                to="/agent/apply"
                onClick={() => setMenuOpen(false)}
                className="py-2 text-sm text-muted-foreground"
              >
                Become an Agent
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
