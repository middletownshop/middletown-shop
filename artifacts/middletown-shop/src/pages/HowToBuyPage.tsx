import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const TUTORIALS = [
  {
    id: "products",
    icon: "🛒",
    title: "How to Buy Products",
    desc: "Learn how to order products from Middletown Shop.",
    src: "/videos/how-to-buy-products.mp4",
  },
  {
    id: "bundles",
    icon: "📶",
    title: "How to Buy Data Bundles",
    desc: "Watch how to purchase MTN, Telecel and AirtelTigo bundles.",
    src: "/videos/how-to-buy-bundles.mp4",
  },
  {
    id: "wallet",
    icon: "💰",
    title: "How to Top Up Your Wallet",
    desc: "Learn how to deposit money into your wallet.",
    src: "/videos/how-to-topup-wallet.mp4",
  },
  {
    id: "coupons",
    icon: "🎁",
    title: "How to Use Coupons",
    desc: "See how to apply coupons during checkout.",
    src: "/videos/how-to-use-coupons.mp4",
  },
  {
    id: "spin-win",
    icon: "🎡",
    title: "How Spin & Win Works",
    desc: "Learn how the Spin & Win game works and how rewards are earned.",
    src: "/videos/how-spin-win-works.mp4",
  },
];

export default function HowToBuyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <nav className="flex items-center gap-2 text-blue-200 text-sm mb-4">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white font-medium">How to Buy</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">🎥 How to Buy</h1>
          <p className="text-blue-200 text-lg max-w-2xl">
            Watch our quick tutorials to learn how to shop, buy bundles, use your wallet, and redeem coupons.
          </p>
        </div>
      </div>

      {/* Tutorial Grid */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {TUTORIALS.map((t) => (
            <div
              key={t.id}
              className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Video Player */}
              <div className="bg-gray-950 aspect-video flex items-center justify-center relative">
                <video
                  controls
                  preload="metadata"
                  className="w-full h-full object-contain"
                  aria-label={t.title}
                >
                  <source src={t.src} type="video/mp4" />
                  <p className="text-white/60 text-sm text-center px-4">
                    Your browser does not support video playback.
                  </p>
                </video>
              </div>

              {/* Card Body */}
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <span className="text-3xl flex-shrink-0 leading-none mt-0.5">{t.icon}</span>
                  <div>
                    <h2 className="text-base font-bold text-foreground leading-snug">{t.title}</h2>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{t.desc}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Upload hint (visible in dev) */}
        <div className="mt-10 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-8 text-center">
          <p className="text-sm font-semibold text-foreground mb-1">📁 Upload your tutorial videos here</p>
          <p className="text-xs text-muted-foreground font-mono">
            public/videos/how-to-buy-products.mp4<br />
            public/videos/how-to-buy-bundles.mp4<br />
            public/videos/how-to-topup-wallet.mp4<br />
            public/videos/how-to-use-coupons.mp4<br />
            public/videos/how-spin-win-works.mp4
          </p>
        </div>
      </div>
    </div>
  );
}
