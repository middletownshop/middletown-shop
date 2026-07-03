import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

import {
  Signal,
  Phone,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
} from "lucide-react";

const STATUS_STYLES: Record<
  string,
  {
    color: string;
    icon: React.ReactNode;
    label: string;
  }
> = {
  pending: {
    color: "bg-yellow-100 text-yellow-700",
    icon: <Clock className="w-3.5 h-3.5" />,
    label: "Pending",
  },

  processing: {
    color: "bg-purple-100 text-purple-700",
    icon: (
      <Loader2 className="w-3.5 h-3.5 animate-spin" />
    ),
    label: "Processing",
  },

  delivered: {
    color: "bg-green-100 text-green-700",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    label: "Delivered",
  },

  failed: {
    color: "bg-red-100 text-red-700",
    icon: <XCircle className="w-3.5 h-3.5" />,
    label: "Failed",
  },
};

const NETWORK_BADGE: Record<string, string> = {
  MTN: "bg-yellow-100 text-yellow-800",
  Telecel: "bg-red-100 text-red-700",
  AirtelTigo: "bg-blue-100 text-blue-700",
};

export default function BundleOrdersPage() {
  const { user, userProfile } = useAuth();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !userProfile) return;

    let q;

    // ADMIN sees all orders
    if (userProfile.role === "admin") {
      q = query(collection(db, "orders"));
    }

    // AGENT sees their orders
    else if (userProfile.role === "agent") {
      q = query(
        collection(db, "orders"),
        where("uid", "==", user.uid)
      );
    }

    // CUSTOMER sees own orders
    else {
      q = query(
        collection(db, "orders"),
        where("uid", "==", user.uid)
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        data.sort(
          (a: any, b: any) =>
            (b.timestamp?.toMillis?.() || 0) -
            (a.timestamp?.toMillis?.() || 0)
        );

        setOrders(data);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsubscribe();
  }, [user, userProfile]);

  const updateStatus = async (
    orderId: string,
    status: string
  ) => {
    await updateDoc(doc(db, "orders", orderId), {
      status,
      updatedAt: new Date(),
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {userProfile?.role === "admin"
            ? "Bundle Orders"
            : "My Bundle Orders"}
        </h1>

        <p className="text-sm text-muted-foreground">
          Real-time bundle order history
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 bg-gray-200 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white border rounded-xl">
          <Signal className="w-12 h-12 mx-auto mb-3 text-gray-400" />

          <h3 className="font-semibold mb-1">
            No bundle orders found
          </h3>

          <p className="text-sm text-gray-500">
            Orders will appear here after purchase
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status =
              STATUS_STYLES[order.status] ||
              STATUS_STYLES.pending;

            return (
              <div
                key={order.id}
                className="bg-white border rounded-xl p-5"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold">
                      {order.network} {order.size}
                    </h3>

                    <p className="text-xs text-gray-500">
                      {order.timestamp?.toDate?.()
                        ?.toLocaleString() || "-"}
                    </p>
                  </div>

                  <div
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${status.color}`}
                  >
                    {status.icon}
                    {status.label}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      NETWORK_BADGE[
                        order.network
                      ] ||
                      "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {order.network}
                  </span>

                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                    {order.validity}
                  </span>

                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {order.recipientPhone}
                  </span>
                </div>

                <div className="flex justify-between items-center border-t pt-3">
                  <div>
                    <p className="text-xs text-gray-500">
                      Customer
                    </p>

                    <p className="font-medium">
                      {order.userName}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-primary">
                      GHS{" "}
                      {Number(
                        order.amountPaid || 0
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>

                {userProfile?.role === "admin" && (
                  <div className="mt-4">
                    <select
                      value={
                        order.status || "pending"
                      }
                      onChange={(e) =>
                        updateStatus(
                          order.id,
                          e.target.value
                        )
                      }
                      className="w-full border rounded-lg p-2"
                    >
                      <option value="pending">
                        Pending
                      </option>

                      <option value="processing">
                        Processing
                      </option>

                      <option value="delivered">
                        Delivered
                      </option>

                      <option value="failed">
                        Failed
                      </option>
                    </select>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}