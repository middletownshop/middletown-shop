import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X, ChevronRight, Star, Percent, ShieldCheck, Zap } from "lucide-react";

import ProductCard from "@/components/ProductCard";
import { getProducts } from "@/lib/firestore";
import type { Product } from "@/lib/types";

const PAGE_SIZE = 12;

const CATEGORIES = [
  { label: "All Categories", value: "" },
  { label: "Market Goods", value: "market" },

];

const SORT_OPTIONS = [
  { label: "Popularity", value: "newest" },
  { label: "Product Name", value: "name_asc" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
];

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");

  const category = searchParams.get("category") || "";
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "newest";
  const min = searchParams.get("min") || "";
  const max = searchParams.get("max") || "";
  const page = Number(searchParams.get("page") || 1);

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        const data = await getProducts({ enabled: true });
        setProducts(data);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    if (!updates.page) params.set("page", "1");
    setSearchParams(params);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ search: searchInput });
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearchParams({});
  };

  const filteredProducts = useMemo(() => {
    return products
      .filter(product => {
        if (!category) return true;
        const prodCat = product?.category || "";
        if (category === "market") return ["market", "physical", "digital"].includes(prodCat);
        return prodCat === category;
      })
      .filter(product => {
        if (!search) return true;
        const query = search.toLowerCase();
        const productName = (product?.name || "").toLowerCase();
        const productDesc = (product?.description || "").toLowerCase();

        return productName.includes(query) || productDesc.includes(query);
      })
      .filter(product => {
        if (!min) return true;
        return (product?.price || 0) >= Number(min);
      })
      .filter(product => {
        if (!max) return true;
        return (product?.price || 0) <= Number(max);
      });
  }, [products, category, search, min, max]);

  const sortedProducts = useMemo(() => {
    const result = [...filteredProducts];
    switch (sort) {
      case "price_asc": return result.sort((a, b) => a.price - b.price);
      case "price_desc": return result.sort((a, b) => b.price - a.price);
      case "name_asc": return result.sort((a, b) => a.name.localeCompare(b.name));
      case "newest":
      default:
        return result.sort((a: any, b: any) => (b.createdAt?.toDate?.()?.getTime?.() || 0) - (a.createdAt?.toDate?.()?.getTime?.() || 0));
    }
  }, [filteredProducts, sort]);

  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / PAGE_SIZE));
  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedProducts.slice(start, start + PAGE_SIZE);
  }, [sortedProducts, page]);

  const hasFilters = !!category || !!search || !!min || !!max || sort !== "newest";

  return (
    <div className="bg-[#F1F1F2] min-h-screen text-[#282828] pb-16 font-sans antialiased">

      {/* MIDDLETOWN SHOP TOP BANNER ROW */}
      <div className="bg-[#E07E1B] text-white text-[11px] font-bold py-1.5 px-4 hidden md:flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4 mx-auto max-w-7xl w-full">
          <span className="flex items-center gap-1 hover:underline cursor-pointer"><Zap size={12} fill="white"/> MIDDLETOWN SHOP <span className="font-black text-yellow-300">EXPRESS</span></span>
          <span className="opacity-40">|</span>
          <span className="flex items-center gap-1"><ShieldCheck size={12}/> 100% Authentic Products</span>
          <span className="opacity-40">|</span>
          <span className="flex items-center gap-1"><Percent size={12}/> Best Deals Guaranteed</span>
        </div>
      </div>

      {/* MIDDLETOWN SHOP BRAND HEADER BLOCK (SEARCH BOX REMOVED) */}
      <div className="bg-white border-b border-slate-200 shadow-xs sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-xl font-black tracking-tight text-[#F68B1E] uppercase">
            Middletown <span className="text-[#282828] font-semibold">Shop</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(prev => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F68B1E] hover:bg-[#E07E1B] text-white text-xs font-bold uppercase tracking-wider rounded shadow-2xs transition-colors"
            >
              <SlidersHorizontal size={13} className="stroke-[2.5]" />
              Filters
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4">

        {/* LAYOUT FRAMEWRAP: SIDEBAR + CATALOG */}
        <div className="flex flex-col lg:flex-row gap-4 items-start">

          {/* STATIC SIDEBAR Left Column */}
          <aside className="w-full lg:w-56 bg-white border border-slate-200 rounded p-4 shrink-0 shadow-xs space-y-5">
            <div>
              <h3 className="font-bold text-xs uppercase tracking-tight text-slate-900 border-b border-slate-100 pb-2 mb-2">
                Category
              </h3>
              <div className="space-y-1">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => updateParams({ category: cat.value })}
                    className={`block w-full text-left px-2 py-1.5 text-xs font-medium rounded transition-colors ${
                      category === cat.value
                        ? "text-[#F68B1E] font-bold bg-orange-50/50"
                        : "text-slate-700 hover:text-[#F68B1E]"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-xs uppercase tracking-tight text-slate-900 border-b border-slate-100 pb-2 mb-2">
                Price (₵)
              </h3>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={min}
                  onChange={e => updateParams({ min: e.target.value })}
                  className="w-full border border-slate-300 rounded px-2 py-1 text-xs text-slate-700 bg-white focus:outline-none focus:border-[#F68B1E]"
                />
                <span className="text-slate-400 text-xs">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={max}
                  onChange={e => updateParams({ max: e.target.value })}
                  className="w-full border border-slate-300 rounded px-2 py-1 text-xs text-slate-700 bg-white focus:outline-none focus:border-[#F68B1E]"
                />
              </div>
            </div>
          </aside>

          {/* MAIN GRID DISPLAY MATRICES */}
          <div className="flex-1 w-full space-y-3">

            {/* INVENTORY STATE HEADER BLOCK */}
            <div className="bg-white rounded border border-slate-200 px-4 py-2.5 flex items-center justify-between shadow-xs">
              <h2 className="text-sm font-bold uppercase tracking-tight text-slate-800">
                {search ? `Results for "${search}"` : "Top Deals Selection"}
              </h2>

              <div className="flex items-center gap-4">
                {hasFilters && (
                  <button onClick={clearFilters} className="flex items-center gap-0.5 text-xs font-bold text-red-600 hover:underline">
                    <X size={12} /> Clear
                  </button>
                )}

                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-400 whitespace-nowrap">Sort by:</span>
                  <select
                    value={sort}
                    onChange={e => updateParams({ sort: e.target.value })}
                    className="bg-transparent border border-slate-300 rounded text-xs font-medium px-2 py-1 text-slate-700 focus:outline-none focus:border-[#F68B1E] cursor-pointer"
                  >
                    {SORT_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* PRODUCT GRID FEED CONTAINER */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-2.5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-white border border-slate-200 rounded animate-pulse shadow-2xs" />
                ))}
              </div>
            ) : paginatedProducts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded border border-slate-200 shadow-xs">
                <Percent size={36} className="text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-800 mb-0.5">No products found</h3>
                <p className="text-xs text-slate-400 mb-4">There are no active stock allocations matching these choices.</p>
                <button onClick={clearFilters} className="text-xs bg-[#F68B1E] text-white px-4 py-2 rounded font-bold shadow-xs hover:bg-[#E07E1B]">
                  See All Products
                </button>
              </div>
            ) : (
              <>
                {/* Boxy Grid Container */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {paginatedProducts.map(product => (
                    <div key={product.id} className="relative bg-white border border-slate-200 hover:border-slate-300 rounded overflow-hidden shadow-2xs hover:shadow-md transition-shadow flex flex-col group">

                      {/* Style Tag Overlays */}
                      <span className="absolute top-2 left-2 z-10 bg-[#F68B1E]/10 text-[#F68B1E] text-[9px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5 tracking-tight uppercase">
                        Official Store
                      </span>

                      <span className="absolute top-2 right-2 z-10 bg-[#FFEEDD] text-[#F68B1E] text-[10px] font-black px-1.5 py-0.5 rounded shadow-2xs">
                        -25%
                      </span>

                      {/* Dynamic Component Inner Injection */}
                      <div className="flex-1">
                        <ProductCard product={product} />
                      </div>

                      {/* Stars Review Footer (120 reviews removed) */}
                      <div className="px-3 pb-3 pt-1 bg-white text-[10px] flex flex-col gap-1 border-t border-slate-50">
                        <div className="flex items-center text-amber-500 gap-0.5">
                          <Star size={10} fill="currentColor"/>
                          <Star size={10} fill="currentColor"/>
                          <Star size={10} fill="currentColor"/>
                          <Star size={10} fill="currentColor"/>
                        </div>
                        <span className="text-emerald-600 font-bold tracking-tight text-[9px] uppercase flex items-center gap-0.5">
                          <Zap size={9} fill="currentColor" /> Middletown Shop Express eligible
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* DENSE GRID PAGINATION BUTTON CONTAINER */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8 border-t border-slate-200 pt-5">
                    <button
                      disabled={page === 1}
                      onClick={() => updateParams({ page: String(page - 1) })}
                      className="px-4 py-1.5 text-xs font-bold bg-white text-slate-700 border border-slate-300 rounded disabled:opacity-40 hover:bg-slate-50 transition-colors shadow-2xs"
                    >
                      PREV
                    </button>

                    <div className="text-xs font-bold text-slate-600 bg-slate-200 px-3 py-1.5 rounded">
                      {page} / {totalPages}
                    </div>

                    <button
                      disabled={page === totalPages}
                      onClick={() => updateParams({ page: String(page + 1) })}
                      className="px-4 py-1.5 text-xs font-bold bg-white text-slate-700 border border-slate-300 rounded disabled:opacity-40 hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-0.5"
                    >
                      NEXT <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}