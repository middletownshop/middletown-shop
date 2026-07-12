import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getCustomerOrders } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import type { Order } from "@/lib/types";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

import { 
  Package, 
  ChevronRight, 
  Sparkles, 
  Calendar, 
  Layers, 
  ArrowRight 
} from "lucide-react";

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getCustomerOrders(user.uid)
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <div className="flex items-center gap-3 mb-8">
          <Skeleton className="h-14 w-14 rounded-3xl" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 rounded-xl" />
            <Skeleton className="h-4 w-32 rounded-lg" />
          </div>
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-3xl w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Premium Header Layout */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-3xl bg-primary/10 flex items-center justify-center shadow-inner">
            <Package className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              My Orders
            </h1>
            <p className="text-muted-foreground text-sm font-medium mt-0.5">
              “Track details • Dynamic purchase history”
            </p>
          </div>
        </div>

        {orders.length > 0 && (
          <div className="bg-background border rounded-2xl px-4 py-2 text-xs font-bold text-muted-foreground inline-flex items-center gap-2 self-start md:self-auto">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Total Orders: {orders.length}
          </div>
        )}
      </div>

      {/* Main Content View */}
      {orders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/60 bg-card p-12 text-center shadow-sm max-w-lg mx-auto mt-8">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-5 shadow-sm">
            <Package className="w-8 h-8 text-muted-foreground/80" />
          </div>
          <h2 className="text-xl font-extrabold text-foreground tracking-tight mb-2">
            No orders registered yet
          </h2>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-6 leading-relaxed">
            Your dynamic fulfillment queue is empty. Place your initial order to inspect delivery states.
          </p>
          <Button asChild size="lg" className="rounded-2xl font-bold shadow-lg shadow-primary/20 px-8">
            <Link to="/products" className="flex items-center gap-2">
              Start Shopping
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              data-testid={`order-row-${order.id}`}
              className="group relative block bg-card border border-border/80 rounded-3xl p-5 hover:shadow-xl hover:border-primary/20 transition-all duration-300 overflow-hidden"
            >
              {/* Subtle visual accent line on hover */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-center" />

              <div className="flex items-center justify-between gap-6">
                <div className="flex-1 min-w-0 space-y-3.5">
                  {/* Row Header */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-black text-foreground text-sm tracking-wide font-mono bg-muted/60 border px-2.5 py-1 rounded-xl">
                      {order.orderId}
                    </span>
                    <OrderStatusBadge status={order.status} />
                  </div>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground font-medium">
                    <span className="flex items-center gap-1.5 bg-muted/40 px-2 py-0.5 rounded-lg">
                      <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                      {order.items.length} {order.items.length === 1 ? "Item" : "Items"}
                    </span>
                    <span className="flex items-center gap-1.5 bg-muted/40 px-2 py-0.5 rounded-lg">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : "—"}
                    </span>
                    <span className="font-black text-base text-foreground sm:ml-auto">
                      ₵{Number(order?.totalAmount || 0).toLocaleString("en-GH", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Item Images Grid */}
                  <div className="flex items-center gap-2.5 pt-1">
                    {order.items.slice(0, 4).map((item, i) => (
                      <img
                        key={i}
                        src={item.image || "https://placehold.co/40x40/e2e8f0/64748b?text=Item"}
                        alt={item.name}
                        className="w-11 h-11 rounded-xl object-cover border border-border/80 flex-shrink-0 bg-background shadow-sm hover:scale-105 transition-transform"
                      />
                    ))}
                    {order.items.length > 4 && (
                      <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center text-xs text-muted-foreground font-bold border border-border/80 shadow-sm flex-shrink-0">
                        +{order.items.length - 4}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Arrow Navigation Indicator */}
                <div className="h-9 w-9 rounded-xl bg-muted/40 group-hover:bg-primary/10 border border-border/40 flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:translate-x-1">
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}