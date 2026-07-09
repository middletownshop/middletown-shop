import { useEffect, useState } from "react";
import { Gift, DollarSign, Trophy, Users } from "lucide-react";
import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function SpinManagement() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [winners, setWinners] = useState<any[]>([]);

  const [stats, setStats] = useState({
    revenue: 0,
    spinsSold: 0,
    players: 0,
    rewards: 0,
  });

  useEffect(() => {
    async function loadData() {
      // Purchases
      const purchaseSnap = await getDocs(
        query(
          collection(db, "spinPurchases"),
          orderBy("createdAt", "desc")
        )
      );

      const purchaseData = purchaseSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPurchases(purchaseData);

      // Winners
      const winnerSnap = await getDocs(
        query(
          collection(db, "spinWinners"),
          orderBy("createdAt", "desc")
        )
      );

      const winnerData = winnerSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setWinners(winnerData);

      // Statistics
      const revenue = purchaseData.reduce(
        (sum: number, p: any) => sum + Number(p.amount || 0),
        0
      );

      const spinsSold = purchaseData.reduce(
        (sum: number, p: any) => sum + Number(p.spins || 0),
        0
      );

      const players = new Set(
        purchaseData.map((p: any) => p.userId)
      ).size;

      setStats({
        revenue,
        spinsSold,
        players,
        rewards: winnerData.length,
      });
    }

    loadData();
  }, []);
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          🎰 Spin Management
        </h1>

        <p className="text-gray-500 mt-2">
          Manage Spin & Win purchases, prizes and winners.
        </p>
      </div>

     
      {/* Statistics */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">

        <div className="bg-white rounded-xl shadow p-5">
          <DollarSign className="text-green-600 mb-3" />
          <p className="text-gray-500 text-sm">Spin Revenue</p>
          <h2 className="text-2xl font-bold">₵{stats.revenue.toLocaleString("en-GH")}</h2>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <Gift className="text-orange-600 mb-3" />
          <p className="text-gray-500 text-sm">Spins Sold</p>
          <h2 className="text-2xl font-bold">{stats.spinsSold}</h2>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <Users className="text-blue-600 mb-3" />
          <p className="text-gray-500 text-sm">Players</p>
          <h2 className="text-2xl font-bold">{stats.players}</h2>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <Trophy className="text-yellow-600 mb-3" />
          <p className="text-gray-500 text-sm">Rewards Given</p>
          <h2 className="text-2xl font-bold">{stats.rewards}</h2>
        </div>

      </div>

      {/* Purchases */}

      <div className="bg-white rounded-xl shadow mb-8">

        <div className="border-b px-6 py-4">
          <h2 className="font-bold text-lg">
            Spin Purchases
          </h2>
        </div>

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-gray-100">

              <tr>

                <th className="text-left p-3">Customer</th>
                <th className="text-left p-3">Spins</th>
                <th className="text-left p-3">Amount</th>
                <th className="text-left p-3">Payment</th>
                <th className="text-left p-3">Date</th>

              </tr>

            </thead>

            <tbody>

              {purchases.map((purchase) => (

                <tr
                  key={purchase.id}
                  className="border-t"
                >

                  <td className="p-3">
                    {purchase.userName}
                  </td>

                  <td className="p-3">
                    {purchase.spins}
                  </td>

                  <td className="p-3">
                    ₵{purchase.amount}
                  </td>

                  <td className="p-3 capitalize">
                    {purchase.paymentMethod}
                  </td>

                  <td className="p-3">
                    {purchase.createdAt?.toDate
                      ? purchase.createdAt
                          .toDate()
                          .toLocaleString("en-GH")
                      : "-"}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

      {/* Winners */}

      <div className="bg-white rounded-xl shadow">

        <div className="border-b px-6 py-4">
          <h2 className="font-bold text-lg">
            Recent Winners
          </h2>
        </div>

        <div className="divide-y">
          {winners.length === 0 ? (
            <div className="p-6 text-gray-500">
              No winners yet.
            </div>
          ) : (
            winners.map((winner) => (
              <div
                key={winner.id}
                className="flex justify-between p-4"
              >
                <div>
                  <p className="font-semibold">
                    {winner.name}
                  </p>

                  <p className="text-sm text-gray-500">
                    {winner.prize}
                  </p>
                </div>

                <div className="text-sm text-gray-500">
                  {winner.createdAt?.toDate
                    ? winner.createdAt
                        .toDate()
                        .toLocaleDateString("en-GH")
                    : "-"}
                </div>
              </div>
            ))
          )}
        </div>

      </div>

    </div>
  );
}
0