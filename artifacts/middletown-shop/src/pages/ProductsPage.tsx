import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";

import ProductCard from "@/components/ProductCard";
import { getProducts } from "@/lib/firestore";
import type { Product } from "@/lib/types";

const PAGE_SIZE = 12;

const CATEGORIES = [
  { label: "All", value: "" },
  { label: "Shop Products", value: "market" },
  { label: "Data Bundles", value: "data" },
  { label: "Services", value: "service" },
];

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Name A-Z", value: "name_asc" },
];

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

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

    if (!updates.page) {
      params.set("page", "1");
    }

    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const filteredProducts = useMemo(() => {
    return products
      .filter(product => {
        if (!category) return true;

        if (category === "market") {
          return ["market", "physical", "digital"].includes(
            product.category
          );
        }

        return product.category === category;
      })
      .filter(product => {
        if (!search) return true;

        const query = search.toLowerCase();

        return (
          product.name.toLowerCase().includes(query) ||
          (product.description || "")
            .toLowerCase()
            .includes(query)
        );
      })
      .filter(product => {
        if (!min) return true;
        return product.price >= Number(min);
      })
      .filter(product => {
        if (!max) return true;
        return product.price <= Number(max);
      });
  }, [products, category, search, min, max]);

  const sortedProducts = useMemo(() => {
    const result = [...filteredProducts];

    switch (sort) {
      case "price_asc":
        return result.sort((a, b) => a.price - b.price);

      case "price_desc":
        return result.sort((a, b) => b.price - a.price);

      case "name_asc":
        return result.sort((a, b) =>
          a.name.localeCompare(b.name)
        );

      case "newest":
      default:
        return result.sort(
          (a: any, b: any) =>
            (b.createdAt?.toDate?.()?.getTime?.() || 0) -
            (a.createdAt?.toDate?.()?.getTime?.() || 0)
        );
    }
  }, [filteredProducts, sort]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedProducts.length / PAGE_SIZE)
  );

  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;

    return sortedProducts.slice(
      start,
      start + PAGE_SIZE
    );
  }, [sortedProducts, page]);

  const activeCategory =
    CATEGORIES.find(c => c.value === category)?.label ||
    "All Products";

  const hasFilters =
    !!category ||
    !!search ||
    !!min ||
    !!max ||
    sort !== "newest";

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {search
              ? `Results for "${search}"`
              : activeCategory}
          </h1>

          <p className="text-sm text-muted-foreground">
            {filteredProducts.length} product
            {filteredProducts.length !== 1 ? "s" : ""} found
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive"
            >
              <X size={16} />
              Clear
            </button>
          )}

          <button
            onClick={() =>
              setShowFilters(prev => !prev)
            }
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
              showFilters
                ? "bg-primary text-white border-primary"
                : "border-border"
            }`}
          >
            <SlidersHorizontal size={16} />
            Filters
          </button>

          <select
            value={sort}
            onChange={e =>
              updateParams({
                sort: e.target.value,
              })
            }
            className="border rounded-lg px-3 py-2"
          >
            {SORT_OPTIONS.map(option => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {showFilters && (
          <aside className="w-full lg:w-64">
            <div className="border rounded-xl p-4 sticky top-24">
              <h3 className="font-semibold mb-4">
                Filters
              </h3>

              <div className="space-y-2 mb-6">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() =>
                      updateParams({
                        category: cat.value,
                      })
                    }
                    className={`block w-full text-left px-3 py-2 rounded-lg ${
                      category === cat.value
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-accent"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <input
                  type="number"
                  placeholder="Min Price"
                  value={min}
                  onChange={e =>
                    updateParams({
                      min: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                />

                <input
                  type="number"
                  placeholder="Max Price"
                  value={max}
                  onChange={e =>
                    updateParams({
                      max: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>
          </aside>
        )}

        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-lg bg-gray-200 animate-pulse"
                />
              ))}
            </div>
          ) : paginatedProducts.length === 0 ? (
            <div className="text-center py-20">
              <h3 className="text-xl font-semibold mb-2">
                No products found
              </h3>

              <button
                onClick={clearFilters}
                className="text-primary hover:underline"
              >
                Browse all products
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {paginatedProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    disabled={page === 1}
                    onClick={() =>
                      updateParams({
                        page: String(page - 1),
                      })
                    }
                    className="px-4 py-2 border rounded-lg disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <span className="px-4 py-2">
                    {page} / {totalPages}
                  </span>

                  <button
                    disabled={page === totalPages}
                    onClick={() =>
                      updateParams({
                        page: String(page + 1),
                      })
                    }
                    className="px-4 py-2 border rounded-lg disabled:opacity-40"
                  >
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