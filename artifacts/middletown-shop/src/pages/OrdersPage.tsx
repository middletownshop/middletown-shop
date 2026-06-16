import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getCustomerOrders } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import type { Order } from "@/lib/types";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import { Package, ChevronRight } from "lucide-react";

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

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">My Orders</h1>
      {orders.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">No orders yet</h2>
          <p className="text-muted-foreground mb-6">Place your first order to see it here</p>
          <Link to="/products" className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors inline-block">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              data-testid={`order-row-${order.id}`}
              className="block bg-white border border-border rounded-xl p-4 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-foreground text-sm">{order.orderId}</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>{order.items.length} item(s)</span>
                    <span className="font-semibold text-foreground">₦{order.totalAmount.toLocaleString()}</span>
                    <span>{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : "—"}</span>
                  </div>
                  <div className="flex gap-2 mt-2 overflow-hidden">
                    {order.items.slice(0, 3).map((item, i) => (
                      <img key={i} src={item.image || "https://placehold.co/40x40/e2e8f0/64748b?text=Item"} alt={item.name}
                        className="w-10 h-10 rounded-lg object-cover border border-border flex-shrink-0" />
                    ))}
                    {order.items.length > 3 && (
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground font-medium border border-border flex-shrink-0">
                        +{order.items.length - 3}
                      </div>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
