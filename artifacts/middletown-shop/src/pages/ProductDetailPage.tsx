import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { getProduct, getProducts } from "@/lib/firestore";
import type { Product } from "@/lib/types";
import { useCart } from "@/context/CartContext";
import ProductCard from "@/components/ProductCard";
import toast from "react-hot-toast";
import { ShoppingCart, X, ChevronLeft, ChevronRight, Truck, Shield, Zap, Star } from "lucide-react";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [qty, setQty] = useState(1);
  const { addToCart } = useCart();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getProduct(id)
      .then(p => {
        setProduct(p);
        setActiveImg(0);
        if (p) {
          getProducts({ enabled: true }).then(all => {
            setRelated(all.filter(x => x.id !== id && x.category === p.category).slice(0, 4));
          });
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const closeOnEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setLightbox(false);
    if (e.key === "ArrowRight") setActiveImg(i => (i + 1) % (product?.images.length || 1));
    if (e.key === "ArrowLeft") setActiveImg(i => (i - 1 + (product?.images.length || 1)) % (product?.images.length || 1));
  }, [product]);

  useEffect(() => {
    if (lightbox) {
      window.addEventListener("keydown", closeOnEsc);
      return () => window.removeEventListener("keydown", closeOnEsc);
    }
  }, [lightbox, closeOnEsc]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({ productId: product.id, name: product.name, price: product.price, quantity: qty, image: product.images[0] || "" });
    toast.success(`${qty} item(s) added to cart`);
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-square bg-gray-200 rounded-xl" />
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-20 bg-gray-200 rounded" />
          <div className="h-12 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <div className="text-5xl mb-4">😕</div>
      <h2 className="text-xl font-bold text-foreground mb-2">Product not found</h2>
      <Link to="/products" className="text-primary hover:underline">Browse all products</Link>
    </div>
  );

  const images = product.images.length > 0 ? product.images : ["https://placehold.co/600x600/e2e8f0/64748b?text=No+Image"];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground mb-4 flex items-center gap-1">
        <Link to="/" className="hover:text-primary">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-primary">Products</Link>
        <span>/</span>
        <Link to={`/products?category=${product.category}`} className="hover:text-primary capitalize">{product.category}</Link>
        <span>/</span>
        <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 mb-10">
        {/* Gallery */}
        <div>
          <div
            className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden cursor-zoom-in border border-border"
            onClick={() => setLightbox(true)}
          >
            <img src={images[activeImg]} alt={product.name} className="w-full h-full object-contain" />
            {images.length > 1 && (
              <>
                <button onClick={e => { e.stopPropagation(); setActiveImg(i => (i - 1 + images.length) % images.length); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-1.5 shadow hover:bg-white transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={e => { e.stopPropagation(); setActiveImg(i => (i + 1) % images.length); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-1.5 shadow hover:bg-white transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
            <span className="absolute bottom-2 right-2 bg-black/40 text-white text-xs px-2 py-0.5 rounded">Click to zoom</span>
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)} data-testid={`thumb-${i}`}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${i === activeImg ? "border-primary" : "border-border hover:border-primary/50"}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded uppercase mb-2">{product.category}</span>
          <h1 className="text-2xl font-bold text-foreground mb-2">{product.name}</h1>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-0.5 text-yellow-400">
              {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-current" />)}
            </div>
            <span className="text-sm text-muted-foreground">(No reviews yet)</span>
          </div>
          <div className="text-3xl font-bold text-primary mb-4">₵{Number(product.price || 0).toLocaleString("en-GH")}</div>

          {/* Stock */}
          <div className="mb-4 flex items-center gap-2">
            <span className={`inline-block w-2 h-2 rounded-full ${product.stock > 0 ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-sm font-medium">{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</span>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{product.description}</p>

          {/* Delivery */}
          {product.deliveryOptions?.length > 0 && (
            <div className="mb-5">
              <h4 className="text-sm font-semibold mb-2">Delivery Options</h4>
              <div className="flex flex-wrap gap-2">
                {product.deliveryOptions.map(opt => (
                  <span key={opt} className="flex items-center gap-1 bg-muted text-foreground text-xs px-2 py-1 rounded-lg">
                    <Truck className="w-3 h-3 text-primary" /> {opt}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Qty + Cart */}
          {product.enabled && product.stock > 0 && (
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center border border-border rounded-lg overflow-hidden">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} data-testid="button-qty-minus"
                  className="px-3 py-2 hover:bg-accent transition-colors font-bold">-</button>
                <span data-testid="text-qty" className="px-4 py-2 text-sm font-medium border-x border-border">{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} data-testid="button-qty-plus"
                  className="px-3 py-2 hover:bg-accent transition-colors font-bold">+</button>
              </div>
              <button onClick={handleAddToCart} data-testid="button-add-to-cart"
                className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-semibold transition-colors">
                <ShoppingCart className="w-4 h-4" /> Add to Cart
              </button>
            </div>
          )}

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 border-t border-border pt-4">
            {[
              { icon: <Shield className="w-4 h-4 text-primary" />, text: "Secure Checkout" },
              { icon: <Truck className="w-4 h-4 text-primary" />, text: "Tracked Delivery" },
              { icon: <Zap className="w-4 h-4 text-primary" />, text: "Paystack Secure" },
            ].map(b => (
              <div key={b.text} className="flex flex-col items-center text-center gap-1">
                {b.icon}
                <span className="text-[11px] text-muted-foreground">{b.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4">Related Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightbox(false)}>
          <button onClick={() => setLightbox(false)} className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 z-10">
            <X className="w-6 h-6" />
          </button>
          {images.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); setActiveImg(i => (i - 1 + images.length) % images.length); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 p-2 bg-black/30 rounded-full">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button onClick={e => { e.stopPropagation(); setActiveImg(i => (i + 1) % images.length); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 p-2 bg-black/30 rounded-full">
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          <img src={images[activeImg]} alt={product.name} className="max-w-full max-h-[90vh] object-contain" onClick={e => e.stopPropagation()} />
          <div className="absolute bottom-4 text-white/60 text-sm">{activeImg + 1} / {images.length}</div>
        </div>
      )}
    </div>
  );
}
