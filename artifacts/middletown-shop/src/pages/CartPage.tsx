import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { Trash2, ShoppingBag, Plus, Minus } from "lucide-react";

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();

  if (cartItems.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-6">Add products to your cart to get started</p>
        <Link to="/products" data-testid="link-browse-products" className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors inline-block">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">Shopping Cart ({cartItems.length} {cartItems.length === 1 ? "item" : "items"})</h1>
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {cartItems.map(item => (
            <div key={item.productId} data-testid={`cart-item-${item.productId}`} className="bg-white border border-border rounded-xl p-4 flex gap-4">
              <img
                src={item.image || "https://placehold.co/80x80/e2e8f0/64748b?text=Item"}
                alt={item.name}
                className="w-20 h-20 object-cover rounded-lg flex-shrink-0 border border-border"
              />
              <div className="flex-1 min-w-0">
                <Link to={`/products/${item.productId}`} className="font-medium text-foreground hover:text-primary line-clamp-2 text-sm">{item.name}</Link>
                <p className="text-primary font-bold mt-1">₦{item.price.toLocaleString()}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center border border-border rounded-lg overflow-hidden">
                    <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} data-testid={`button-qty-minus-${item.productId}`}
                      className="p-1.5 hover:bg-accent transition-colors"><Minus className="w-3 h-3" /></button>
                    <span className="px-3 text-sm font-medium border-x border-border">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} data-testid={`button-qty-plus-${item.productId}`}
                      className="p-1.5 hover:bg-accent transition-colors"><Plus className="w-3 h-3" /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.productId)} data-testid={`button-remove-${item.productId}`}
                    className="text-destructive hover:text-destructive/80 transition-colors p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="font-bold text-foreground">₦{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div>
          <div className="bg-white border border-border rounded-xl p-5 sticky top-20">
            <h3 className="font-bold text-foreground mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm mb-4">
              {cartItems.map(item => (
                <div key={item.productId} className="flex justify-between text-muted-foreground">
                  <span className="truncate max-w-[140px]">{item.name} x{item.quantity}</span>
                  <span>₦{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3 mb-5">
              <div className="flex justify-between font-bold text-foreground">
                <span>Total</span>
                <span data-testid="text-cart-total">₦{cartTotal.toLocaleString()}</span>
              </div>
            </div>
            <Link to="/checkout" data-testid="link-checkout"
              className="w-full block text-center bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-semibold transition-colors">
              Proceed to Checkout
            </Link>
            <Link to="/products" className="w-full block text-center mt-3 text-primary text-sm hover:underline">Continue Shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
