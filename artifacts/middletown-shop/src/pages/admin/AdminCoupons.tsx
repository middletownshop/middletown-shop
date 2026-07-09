import { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Coupon {
  id: string;
  code: string;
  discount: number;
  used: boolean;
  userId: string;
  userName?: string;
  userEmail?: string;
  expiresAt: any;
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCoupons() {
      try {
        const snapshot = await getDocs(
          collection(db, "coupons")
        );

        const data = await Promise.all(
          snapshot.docs.map(async (couponDoc) => {

            const coupon = couponDoc.data();

            let userName = "";
            let userEmail = "";

            if (coupon.userId) {
              const userSnap = await getDoc(
                doc(db, "users", coupon.userId)
              );

              if (userSnap.exists()) {
                const userData = userSnap.data();

                userName =
                  userData.displayName || "Unknown";

                userEmail =
                  userData.email || "";
              }
            }

            return {
              id: couponDoc.id,
              ...coupon,
              userName,
              userEmail,
            };

          })
        );

        setCoupons(data as Coupon[]);

      } catch (error) {
        console.error(error);

      } finally {
        setLoading(false);
      }
    }

    loadCoupons();

  }, []);

  if (loading) {
    return (
      <div className="p-6">
        Loading coupons...
      </div>
    );
  }


  return (
    <div className="p-6">

      <h1 className="text-2xl font-bold mb-6">
        🎟 Coupon Management
      </h1>

      <div className="grid grid-cols-3 gap-4 mb-6">

        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-gray-500">
            Total Coupons
          </p>
          <p className="text-2xl font-bold">
            {coupons.length}
          </p>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-gray-500">
            Active
          </p>
          <p className="text-2xl font-bold">
            {coupons.filter(c => !c.used).length}
          </p>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-gray-500">
            Used
          </p>
          <p className="text-2xl font-bold">
            {coupons.filter(c => c.used).length}
          </p>
        </div>

      </div>
      
      <div className="bg-white rounded-xl border overflow-hidden">

        <table className="w-full">

          <thead className="bg-gray-100">

            <tr>
              <th className="p-3 text-left">
                Code
              </th>

              <th className="p-3 text-left">
                Discount
              </th>

              <th className="p-3 text-left">
                Customer
              </th>

              <th className="p-3 text-left">
                Email
              </th>

              <th className="p-3 text-left">
                Status
              </th>

              <th className="p-3 text-left">
                Expiry
              </th>

            </tr>

          </thead>


          <tbody>

            {coupons.map((coupon)=>(

              <tr key={coupon.id}
                className="border-t">

                <td className="p-3 font-semibold">
                  {coupon.code}
                </td>

                <td className="p-3">
                  {coupon.discount}%
                </td>

                <td className="p-3">
                  {coupon.userName}
                </td>

                <td className="p-3">
                  {coupon.userEmail}
                </td>

                <td className="p-3">
                  {coupon.used 
                    ? "Used" 
                    : "Active"}
                </td>

                <td className="p-3">
                  {coupon.expiresAt?.toDate
                    ? coupon.expiresAt.toDate().toDateString()
                    : "N/A"}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}