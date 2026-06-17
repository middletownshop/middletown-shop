import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getProducts } from "@/lib/firestore";
import type { Product } from "@/lib/types";
import ProductCard from "@/components/ProductCard";
import { Search, SlidersHorizontal, X } from "lucide-react";

const CATEGORIES = [
  { label: "All", value: "" },
  { label: "Market", value: "market" },
  { label: "Data Bundles", value: "data" },
  { label: "Services", value: "service" },
];

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Name A-Z", value: "name_asc" },
];

const PAGE_SIZE = 12;

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("newest");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const category = searchParams.get("category") || "";
  const search = searchParams.get("search") || "";

  useEffect(() => {
    setLoading(true);
    setPage(1);
    getProducts({ enabled: true })
      .then(setAllProducts)
      .catch(() => setAllProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = allProducts
    .filter(p => {
      if (!category) return true;
      // "market" shows physical, digital, and market category products
      if (category === "market") return ["market", "physical", "digital"].includes(p.category);
      return p.category === category;
    })
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase()))
    .filter(p => !priceMin || p.price >= Number(priceMin))
    .filter(p => !priceMax || p.price <= Number(priceMax));

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "price_asc") return a.price - b.price;
    if (sort === "price_desc") return b.price - a.price;
    if (sort === "name_asc") return a.name.localeCompare(b.name);
    return 0; // newest — already sorted by firestore.ts
  });

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const clearFilters = () => {
    setPriceMin("");
    setPriceMax("");
    setSort("newest");
    setSearchParams({});
  };

  const hasFilters = !!category || !!search || !!priceMin || !!priceMax;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {search ? `Results for "${search}"` : category ? CATEGORIES.find(c => c.value === category)?.label || "Products" : "All Products"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{filtered.length} product{filtered.length !== 1 ? "s" : ""} found</p>
        </div>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-colors ${showFilters ? "bg-primary text-white border-primary" : "border-border hover:border-primary"}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:block">Filters</span>
          </button>
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters */}
        {showFilters && (
          <aside className="w-52 flex-shrink-0">
            <div className="bg-white border border-border rounded-xl p-4 sticky top-24">
              <h3 className="font-semibold text-foreground text-sm mb-4">Filters</h3>

              {/* Category */}
              <div className="mb-5">
                <h4 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider">Category</h4>
                <div className="space-y-1">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      onClick={() => {
                        setPage(1);
                        setSearchParams(cat.value ? { category: cat.value } : {});
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        category === cat.value ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price range */}
              <div className="mb-5">
                <h4 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider">Price Range (₵)</h4>
                <div className="flex gap-2">
                  <input type="number" value={priceMin} onChange={e => setPriceMin(e.target.value)} placeholder="Min" data-testid="input-price-min"
                    className="w-full border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                  <input type="number" value={priceMax} onChange={e => setPriceMax(e.target.value)} placeholder="Max" data-testid="input-price-max"
                    className="w-full border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>

              <button onClick={clearFilters} className="w-full text-xs text-muted-foreground hover:text-foreground py-2 border border-border rounded-lg transition-colors">
                Clear All
              </button>
            </div>
          </aside>
        )}

        {/* Products grid */}
        <div className="flex-1 min-w-0">
          {/* Search indicator */}
          {search && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 rounded-lg">
              <Search className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700">Searching for: <strong>{search}</strong></span>
              <button onClick={() => setSearchParams({})} className="ml-auto text-blue-500 hover:text-blue-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-lg aspect-square animate-pulse" />
              ))}
            </div>
          ) : paginated.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">📦</div>
              <h3 className="text-lg font-bold text-foreground mb-2">No products found</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {search ? `No results for "${search}"` : "No products in this category yet"}
              </p>
              <button onClick={clearFilters} className="text-primary hover:underline text-sm">Browse all products</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {paginated.map(p => <ProductCard key={p.id} product={p} />)}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-accent transition-colors disabled:opacity-40">
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${page === p ? "bg-primary text-white" : "border border-border hover:bg-accent"}`}>
                      {p}
                    </button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-accent transition-colors disabled:opacity-40">
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
