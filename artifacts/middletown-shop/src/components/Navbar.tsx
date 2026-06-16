import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Search, Menu, X, Bell, User, LogOut, Settings, Package } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import toast from "react-hot-toast";

const CATEGORIES = [
  { label: "Physical", value: "physical" },
  { label: "Digital", value: "digital" },
  { label: "Data Bundles", value: "data" },
  { label: "Airtime", value: "airtime" },
  { label: "Utilities", value: "utility" },
  { label: "Services", value: "service" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, isAdmin, userProfile } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

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
        <span>Welcome to Middletown Shop — Nigeria's trusted marketplace</span>
        <div className="flex gap-4">
          {!user && (
            <>
              <Link to="/login" className="hover:underline">Sign In</Link>
              <span>|</span>
              <Link to="/login?tab=register" className="hover:underline">Register</Link>
            </>
          )}
          {isAdmin && (
            <Link to="/admin" className="hover:underline font-semibold">Admin Panel</Link>
          )}
        </div>
      </div>

      {/* Main nav */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* Logo */}
        <Link to="/" className="flex-shrink-0 flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="font-bold text-xl text-primary hidden sm:block">Middletown Shop</span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 flex max-w-2xl">
          <input
            type="search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            data-testid="input-search"
            className="flex-1 border border-border rounded-l-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          <button
            type="submit"
            data-testid="button-search"
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-r-lg transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Cart */}
          <Link
            to="/cart"
            data-testid="link-cart"
            className="relative flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-foreground"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="hidden sm:block text-sm font-medium">Cart</span>
            {cartItems.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {cartItems.length}
              </span>
            )}
          </Link>

          {/* User menu */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                data-testid="button-user-menu"
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
              >
                <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <span className="hidden sm:block text-sm font-medium text-foreground max-w-[100px] truncate">
                  {userProfile?.displayName || user.email?.split("@")[0]}
                </span>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white border border-border rounded-lg shadow-lg py-1 z-50">
                  <Link to="/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent transition-colors">
                    <User className="w-4 h-4" /> My Dashboard
                  </Link>
                  <Link to="/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent transition-colors">
                    <Package className="w-4 h-4" /> My Orders
                  </Link>
                  <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent transition-colors">
                    <Settings className="w-4 h-4" /> Profile
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent transition-colors text-primary font-semibold">
                      Admin Panel
                    </Link>
                  )}
                  <div className="border-t border-border mt-1">
                    <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-destructive/10 text-destructive w-full transition-colors">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" data-testid="link-login" className="flex items-center gap-1 px-3 py-2 rounded-lg border border-primary text-primary text-sm font-medium hover:bg-primary hover:text-white transition-colors">
              Sign In
            </Link>
          )}

          {/* Notifications */}
          {user && (
            <Link to="/dashboard" className="relative p-2 rounded-lg hover:bg-accent transition-colors">
              <Bell className="w-5 h-5 text-foreground" />
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Category nav */}
      <nav className="hidden md:flex border-t border-border bg-white">
        <div className="max-w-7xl mx-auto px-4 flex gap-0">
          <Link to="/products" className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary hover:bg-accent transition-colors border-b-2 border-transparent hover:border-primary">
            All Products
          </Link>
          {CATEGORIES.map(cat => (
            <Link
              key={cat.value}
              to={`/products?category=${cat.value}`}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-accent transition-colors border-b-2 border-transparent hover:border-primary"
            >
              {cat.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-white py-2 px-4 flex flex-col gap-1">
          <Link to="/products" onClick={() => setMenuOpen(false)} className="py-2 text-sm font-medium">All Products</Link>
          {CATEGORIES.map(cat => (
            <Link key={cat.value} to={`/products?category=${cat.value}`} onClick={() => setMenuOpen(false)} className="py-2 text-sm text-muted-foreground">
              {cat.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
