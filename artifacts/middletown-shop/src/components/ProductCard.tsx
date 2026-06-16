import { Link } from "react-router-dom";
import { ShoppingCart, Heart } from "lucide-react";
import type { Product } from "@/lib/types";
import { useCart } from "@/context/CartContext";
import toast from "react-hot-toast";

const CATEGORY_COLORS: Record<string, string> = {
  physical: "bg-blue-100 text-blue-700",
  digital: "bg-purple-100 text-purple-700",
  data: "bg-green-100 text-green-700",
  airtime: "bg-orange-100 text-orange-700",
  utility: "bg-yellow-100 text-yellow-700",
  service: "bg-pink-100 text-pink-700",
};

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.enabled || product.stock <= 0) return;
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: (product.images || [])[0] || "",
    });
    toast.success("Added to cart");
  };

  const image = (product.images || [])[0] || "https://placehold.co/300x300/e2e8f0/64748b?text=No+Image";

  return (
    <Link
      to={`/products/${product.id}`}
      data-testid={`card-product-${product.id}`}
      className="group bg-white border border-border rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col"
    >
      <div className="relative overflow-hidden aspect-square bg-gray-50">
        <img
          src={image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {!product.enabled && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white text-xs font-semibold bg-black/60 px-2 py-1 rounded">Unavailable</span>
          </div>
        )}
        {product.stock <= 0 && product.enabled && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <span className="text-white text-xs font-semibold bg-black/60 px-2 py-1 rounded">Out of Stock</span>
          </div>
        )}
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); }}
          className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
        >
          <Heart className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="p-3 flex flex-col flex-1">
        <div className="mb-1">
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide ${CATEGORY_COLORS[product.category] || "bg-gray-100 text-gray-600"}`}>
            {product.category}
          </span>
        </div>
        <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-1 flex-1 leading-snug">{product.name}</h3>
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-base font-bold text-primary" data-testid={`text-price-${product.id}`}>
            ₵{Number(product.price || 0).toLocaleString("en-GH")}
          </span>
          <button
            onClick={handleAddToCart}
            data-testid={`button-add-cart-${product.id}`}
            disabled={!product.enabled || product.stock <= 0}
            className="flex items-center gap-1 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-white text-xs px-2 py-1.5 rounded transition-colors font-medium"
          >
            <ShoppingCart className="w-3 h-3" />
            <span>Add</span>
          </button>
        </div>
        <div className="mt-1">
          <span className={`text-[10px] ${product.stock > 0 ? "text-green-600" : "text-destructive"}`}>
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </span>
        </div>
      </div>
    </Link>
  );
}
