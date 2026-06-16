import { Link } from "react-router-dom";
import { Home, Search } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="text-8xl font-bold text-primary/20 mb-4">404</div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Page not found</h1>
      <p className="text-muted-foreground mb-8 max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link to="/" className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
          <Home className="w-4 h-4" /> Go Home
        </Link>
        <Link to="/products" className="flex items-center gap-2 border border-border text-foreground px-6 py-3 rounded-lg font-semibold hover:bg-accent transition-colors">
          <Search className="w-4 h-4" /> Browse Products
        </Link>
      </div>
    </div>
  );
}
