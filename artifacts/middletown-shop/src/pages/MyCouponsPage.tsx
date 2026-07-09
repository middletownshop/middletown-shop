import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { Copy } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  discount: number;
  used: boolean;
  expiresAt: any;
}

export default function MyCouponsPage() {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCoupons = async () => {
      if (!user) return;

      try {
        const q = query(
          collection(db, "coupons"),
          where("userId", "==", user.uid)
        );

        const snapshot = await getDocs(q);

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Coupon[];

        setCoupons(data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load coupons");
      } finally {
        setLoading(false);
      }
    };

    loadCoupons();
  }, [user]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Coupon copied");
  };

  if (loading) {
    return <div className="p-6">Loading coupons...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        🎟 My Coupons
      </h1>

      {coupons.length === 0 ? (
        <p>No coupons available.</p>
      ) : (
        <div className="space-y-4">
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className="border rounded-lg p-5 bg-white shadow-sm"
            >
              <p className="font-bold text-lg">
                Code: {coupon.code}
              </p>

              <p>
                Discount: {coupon.discount}%
              </p>

              <p>
                Status: {coupon.used ? "Used" : "Active"}
              </p>

              <p>
                Expires:{" "}
                {coupon.expiresAt?.toDate
                  ? coupon.expiresAt.toDate().toDateString()
                  : "N/A"}
              </p>

              {!coupon.used && (
                <button
                  onClick={() => copyCode(coupon.code)}
                  className="mt-3 flex items-center gap-2 px-4 py-2 rounded bg-blue-600 text-white"
                >
                  <Copy size={16} />
                  Copy Code
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}