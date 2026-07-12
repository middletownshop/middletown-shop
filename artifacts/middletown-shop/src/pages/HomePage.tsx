import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ChevronRight, Zap, Shield, Truck, Star } from "lucide-react";
import { getFeaturedProducts } from "@/lib/firestore";
import type { Product } from "@/lib/types";
import ProductCard from "@/components/ProductCard";
import { Gift, Trophy, Sparkles } from "lucide-react";

const CATEGORIES = [
  {
    label: "Shop Products",
    icon: "🛒",
    desc: "Electronics, clothing, accessories",
    href: "/products?category=market",
  },

  {
    label: "Data Bundles",
    icon: "📶",
    desc: "MTN, Telecel, AirtelTigo",
    href: "/bundles",
  },

  {
    label: "Bundle Orders",
    icon: "📋",
    desc: "Track your bundle purchases",
    href: "/bundle-orders",
  },

  {
    label: "Shop Orders",
    icon: "📦",
    desc: "View your product orders",
    href: "/orders",
  },

  {
    label: "Complaints",
    icon: "📝",
    desc: "Report issues and support",
    href: "/complaints",
  },

  {
    label: "Games",
    icon: "🎮",
    desc: "Play and win rewards",
    href: "/spin-win",
  },

  {
    label: "Services",
    icon: "🛠️",
    desc: "Professional & freelance services",
    href: "/products?category=service",
  },

  
  {
    label: "Become Agent",
    icon: "🤝",
    desc: "Earn commissions on sales",
    href: "/agent/apply",
  },
 
];

const BANNERS = [
  { title: "Biggest Sale of the Year", subtitle: "Up to 50% off in Shop Products", cta: "Shop Now", href: "/products?category=market", bg: "from-blue-700 to-blue-900" },
  { title: "Data Bundles for All Networks", subtitle: "MTN, Telecel & AirtelTigo — instant delivery", cta: "Buy Data", href: "/bundles", bg: "from-emerald-600 to-teal-800" },
  { title: "Earn as an Agent", subtitle: "Join our agent program and earn commissions", cta: "Apply Now", href: "/agent/apply", bg: "from-orange-600 to-orange-800" },
];

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBanner, setActiveBanner] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    getFeaturedProducts()
      .then(setFeatured)
      .catch(() => setFeatured([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveBanner(b => (b + 1) % BANNERS.length), 4000);
    return () => clearInterval(t);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const banner = BANNERS[activeBanner];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className={`bg-gradient-to-r ${banner.bg} text-white`}>
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-20 flex flex-col items-center text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-3 transition-all duration-500">{banner.title}</h1>
          <p className="text-lg md:text-xl text-white/80 mb-8">{banner.subtitle}</p>
          <form onSubmit={handleSearch} className="w-full max-w-xl flex mb-8">
            <input type="search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="What are you looking for?" data-testid="input-hero-search"
              className="flex-1 px-5 py-3 rounded-l-xl text-foreground text-base focus:outline-none focus:ring-2 focus:ring-white/50" />
            <button type="submit" data-testid="button-hero-search"
              className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 px-6 py-3 rounded-r-xl font-semibold transition-colors flex items-center gap-2">
              <Search className="w-4 h-4" /> Search
            </button>
          </form>
          <Link to={banner.href} className="bg-white text-blue-700 font-semibold px-8 py-3 rounded-full hover:bg-blue-50 transition-colors">
            {banner.cta}
          </Link>
          <div className="flex gap-2 mt-6">
            {BANNERS.map((_, i) => (
              <button key={i} onClick={() => setActiveBanner(i)}
                className={`h-2 rounded-full transition-all ${i === activeBanner ? "bg-white w-6" : "bg-white/40 w-2"}`} />
            ))}
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="bg-primary/5 border-y border-primary/10">
        <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <Shield className="w-5 h-5 text-primary" />, text: "Secure Payments" },
            { icon: <Truck className="w-5 h-5 text-primary" />, text: "Fast Delivery" },
            { icon: <Zap className="w-5 h-5 text-primary" />, text: "Instant Digital Delivery" },
            { icon: <Star className="w-5 h-5 text-primary" />, text: "Verified Sellers" },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-2 justify-center">
              {icon}<span className="text-sm font-medium text-foreground">{text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Shop by Category</h2>
          <Link to="/products" className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {CATEGORIES.map(cat => (
            <Link key={cat.label} to={cat.href}
              className="flex flex-col items-center p-5 bg-white border border-border rounded-xl hover:border-primary hover:shadow-md transition-all group text-center">
              <span className="text-4xl mb-3">{cat.icon}</span>
              <span className="text-sm font-semibold text-foreground group-hover:text-primary leading-tight">{cat.label}</span>
              <span className="text-xs text-muted-foreground mt-1 hidden sm:block">{cat.desc}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Play & Win Rewards */}
      <section className="max-w-7xl mx-auto px-4 pb-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              🎮 Games & Win Rewards
            </h2>

            <p className="text-muted-foreground mt-1">
              Play games every day and win amazing rewards.
            </p>
          </div>

          <Link
            to="/games"
            className="text-primary font-semibold hover:underline"
          >
            View All
          </Link>
        </div>

        <div className="grid md:grid-cols-4 gap-6">

          {/* Spin & Win */}
          <Link
            to="/spin-win"
            className="group rounded-2xl overflow-hidden bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 text-white shadow-xl hover:scale-105 transition-all duration-300"
          >
            <div className="p-6">

              <div className="text-6xl mb-4 text-center">
                🎡
              </div>

              <h3 className="text-xl font-bold text-center">
                Spin & Win
              </h3>

              <p className="text-sm text-center mt-2 opacity-90">
                One free spin every day.
              </p>

              <div className="mt-5 flex justify-center">
                <span className="bg-white text-orange-600 font-bold px-5 py-2 rounded-full">
                  PLAY NOW
                </span>
              </div>

            </div>
          </Link>

          {/* Trivia */}
          <div className="rounded-2xl border bg-card p-6 flex flex-col items-center justify-center opacity-80">
            <div className="text-5xl mb-3">
              🧠
            </div>

            <h3 className="font-bold text-lg">
              Trivia Quiz
            </h3>

            <p className="text-sm text-muted-foreground mt-2 text-center">
              Coming Soon
            </p>
          </div>

          {/* Ludo */}
          <div className="rounded-2xl border bg-card p-6 flex flex-col items-center justify-center opacity-80">
            <div className="text-5xl mb-3">
              🎲
            </div>

            <h3 className="font-bold text-lg">
              Ludo
            </h3>

            <p className="text-sm text-muted-foreground mt-2 text-center">
              Coming Soon
            </p>
          </div>

          {/* Puzzle */}
          <div className="rounded-2xl border bg-card p-6 flex flex-col items-center justify-center opacity-80">
            <div className="text-5xl mb-3">
              🧩
            </div>

            <h3 className="font-bold text-lg">
              Puzzle
            </h3>

            <p className="text-sm text-muted-foreground mt-2 text-center">
              Coming Soon
            </p>
          </div>

        </div>
      </section>
      
      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 pb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Featured Products</h2>
          <Link to="/products" className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
            See all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white border border-border rounded-lg overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-5xl mb-4">🏪</div>
            <p className="text-lg font-medium">No featured products yet</p>
            <Link to="/products" className="mt-4 inline-block bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90">Browse Products</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {featured.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="bg-primary text-white py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold mb-2">Start Shopping Today</h3>
            <p className="text-white/80">Join thousands of Ghanaians shopping on Middletown Shop. Secure, fast, reliable.</p>
          </div>
          <Link to="/products" className="bg-white text-primary font-bold px-8 py-3 rounded-full hover:bg-blue-50 whitespace-nowrap">Shop Now</Link>
        </div>
      </section>
    </div>
  );
}
