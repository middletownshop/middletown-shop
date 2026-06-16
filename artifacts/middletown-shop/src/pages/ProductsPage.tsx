import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getProducts } from "@/lib/firestore";
import type { Product } from "@/lib/types";
import ProductCard from "@/components/ProductCard";
import { Search, SlidersHorizontal, X } from "lucide-react";

const CATEGORIES = [
  { label: "All", value: "" },
  { label: "Physical", value: "physical" },
  { label: "Digital", value: "digital" },
  { label: "Data Bundles", value: "data" },
  { label: "Airtime", value: "airtime" },
  { label: "Utilities", value: "utility" },
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
    .filter(p => !category || p.category === category)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()))
    .filter(p => !priceMin || p.price >= Number(priceMin))
    .filter(p => !priceMax || p.price <= Number(priceMax))
    .sort((a, b) => {
      if (sort === "price_asc") return a.price - b.price;
      if (sort === "price_desc") return b.price - a.price;
      if (sort === "name_asc") return a.name.localeCompare(b.name);
      return 0;
    });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const setCategory = (val: string) => {
    const params = new URLSearchParams(searchParams);
    if (val) params.set("category", val); else params.delete("category");
    params.delete("search");
    setSearchParams(params);
    setPage(1);
  };

  const clearSearch = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("search");
    setSearchParams(params);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters sidebar */}
        <aside className={`${showFilters ? "block" : "hidden md:block"} w-full md:w-56 flex-shrink-0`}>
          <div className="bg-white border border-border rounded-xl p-4 sticky top-20">
            <h3 className="font-bold text-foreground mb-4">Filters</h3>
            {/* Category */}
            <div className="mb-5">
              <h4 className="text-sm font-semibold text-foreground mb-2">Category</h4>
              <div className="space-y-1">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    data-testid={`filter-category-${cat.value || "all"}`}
                    className={`w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors ${category === cat.value ? "bg-primary text-white" : "text-foreground hover:bg-accent"}`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Price range */}
            <div className="mb-5">
              <h4 className="text-sm font-semibold text-foreground mb-2">Price Range (₦)</h4>
              <div className="flex gap-2">
                <input type="number" value={priceMin} onChange={e => setPriceMin(e.target.value)} placeholder="Min" data-testid="input-price-min"
                  className="w-full border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                <input type="number" value={priceMax} onChange={e => setPriceMax(e.target.value)} placeholder="Max" data-testid="input-price-max"
                  className="w-full border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </div>
            {(priceMin || priceMax) && (
              <button onClick={() => { setPriceMin(""); setPriceMax(""); }} className="text-xs text-destructive hover:underline">Clear price filter</button>
            )}
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {search && (
                <div className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                  <Search className="w-3 h-3" />
                  <span>"{search}"</span>
                  <button onClick={clearSearch}><X className="w-3 h-3" /></button>
                </div>
              )}
              <span className="text-sm text-muted-foreground">{filtered.length} products</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowFilters(!showFilters)} className="md:hidden flex items-center gap-1 px-3 py-1.5 border border-border rounded-lg text-sm text-foreground hover:bg-accent transition-colors">
                <SlidersHorizontal className="w-4 h-4" /> Filters
              </button>
              <select value={sort} onChange={e => setSort(e.target.value)} data-testid="select-sort"
                className="border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <div key={i} className="bg-white border border-border rounded-lg overflow-hidden animate-pulse">
                  <div className="aspect-square bg-gray-200" />
                  <div className="p-3 space-y-2"><div className="h-3 bg-gray-200 rounded w-3/4" /><div className="h-3 bg-gray-200 rounded w-1/2" /></div>
                </div>
              ))}
            </div>
          ) : paginated.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-lg font-medium">No products found</p>
              <p className="text-sm mt-1">Try a different search or category</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {paginated.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-2 border border-border rounded-lg text-sm disabled:opacity-50 hover:bg-accent transition-colors">
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${p === page ? "bg-primary text-white" : "border border-border hover:bg-accent"}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-4 py-2 border border-border rounded-lg text-sm disabled:opacity-50 hover:bg-accent transition-colors">
                Next
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
