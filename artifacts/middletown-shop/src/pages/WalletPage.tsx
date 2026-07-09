import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import type { WalletTransaction } from "@/lib/types";
import {
  getWalletTransactions,
  requestWalletWithdrawal,
  addWalletDeposit,
  getUserNotifications,
  markNotificationAsRead
} from "@/lib/firestore";
import { Wallet, ArrowDownLeft, ArrowUpRight, Plus, Minus, Clock, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";

type Tab = "overview" | "deposit" | "withdraw" | "history" | "momo";

export default function WalletPage() {
  const { user, userProfile, refreshProfile } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);

  // Deposit state
  const [depositAmount, setDepositAmount] = useState("");
  const [depositing, setDepositing] = useState(false);

  // Withdrawal state
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    if (!user) return;

    setLoadingTx(true);

    getWalletTransactions(user.uid)
      .then(setTransactions)
      .catch(() => setTransactions([]))
      .finally(() => setLoadingTx(false));

    getUserNotifications(user.uid)
      .then(setNotifications)
      .catch(() => setNotifications([]));

  }, [user, tab]);

  const balance = Number(userProfile?.walletBalance || 0);

  const handlePaystackSuccess = async (response: any) => {
    try {
      setDepositing(true);

      console.log("PAYSTACK SUCCESS:", response.reference);

      await addWalletDeposit(
        user!.uid,
        Number(depositAmount),
        response.reference
      );

      await refreshProfile();

      const txs = await getWalletTransactions(user!.uid);
      setTransactions(txs);

      setDepositAmount("");

      toast.success(`₵${depositAmount} added to wallet`);

      setTab("overview");
    } catch (err) {
      console.error("WALLET UPDATE ERROR:", err);
      toast.error("Failed to update wallet");
    } finally {
      setDepositing(false);
    }
  };
  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(depositAmount);

    if (!amount || amount < 50) {
      toast.error("Minimum deposit is ₵50");
      return;
    }

    if (!user) return;

    if (!(window as any).PaystackPop) {
      toast.error("Paystack not loaded");
      return;
    }

    const percentageFee = 0.0195;
    const fixedFee = 0.10;

    const totalToPay =
      Math.ceil(((amount + fixedFee) / (1 - percentageFee)) * 100) / 100;

    const handler = (window as any).PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,

      email:
        user.email ||
        userProfile?.email ||
        `${user.uid}@wallet.com`,

      amount: Math.round(totalToPay * 100),

      currency: "GHS",

      ref: `WALLET-${Date.now()}`,

      callback: function (response: any) {
        handlePaystackSuccess(response);
      },

      onClose: function () {
        toast.error("Payment cancelled");
      },
    });

    handler.openIframe();
  };
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount < 10) { toast.error("Minimum withdrawal is ₵10"); return; }
    if (amount > balance) { toast.error("Insufficient wallet balance"); return; }
    if (!user || !userProfile) return;

    setWithdrawing(true);
    try {
      await requestWalletWithdrawal({
        userId: user.uid,
        userName: userProfile.displayName || userProfile.email,
        userEmail: userProfile.email,
        amount,
        bankName,
        accountNumber,
        accountName,
      });
      await refreshProfile();
      const txs = await getWalletTransactions(user.uid);
      setTransactions(txs);
      setWithdrawAmount(""); setBankName(""); setAccountNumber(""); setAccountName("");
      toast.success("Withdrawal request submitted! Processing within 24hrs.");
      setTab("overview");
    } catch {
      toast.error("Failed to submit withdrawal request");
    } finally {
      setWithdrawing(false);
    }
  };

  const txTypeIcon = (type: string) => {
    if (type === "deposit" || type === "commission" || type === "refund")
      return <ArrowDownLeft className="w-4 h-4 text-green-600" />;
    return <ArrowUpRight className="w-4 h-4 text-red-500" />;
  };

  const txStatusIcon = (status: string) => {
    if (status === "completed") return <CheckCircle className="w-3.5 h-3.5 text-green-600" />;
    if (status === "failed") return <XCircle className="w-3.5 h-3.5 text-red-500" />;
    return <Clock className="w-3.5 h-3.5 text-yellow-500" />;
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Wallet</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage your balance, deposits and withdrawals</p>
      </div>

      {/* Balance card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white mb-6 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="w-5 h-5 text-blue-200" />
          <span className="text-blue-200 text-sm">Available Balance</span>
        </div>
        <p className="text-4xl font-bold mb-4">
          ₵{balance.toLocaleString("en-GH", { minimumFractionDigits: 2 })}
        </p>
        <div className="bg-white/10 rounded-xl px-4 py-3 mb-4">
          <p className="text-blue-100 text-sm">
            Reward Points
          </p>

          <p className="text-2xl font-bold">
            ⭐ {userProfile?.rewardPoints ?? 0}
          </p>
        </div>
        
        <div className="flex gap-3">
          <button onClick={() => setTab("deposit")}
            className="flex items-center gap-1.5 bg-white text-blue-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">
            <Plus className="w-4 h-4" /> Add Funds
          </button>
          <button onClick={() => setTab("withdraw")}
            className="flex items-center gap-1.5 bg-white/20 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-white/30 transition-colors">
            <Minus className="w-4 h-4" /> Withdraw
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-muted rounded-lg p-1">
        {(["overview", "deposit", "withdraw","momo", "history"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
              tab === t ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Recent Transactions</h3>
          {loadingTx ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-200 rounded-xl animate-pulse" />)}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 bg-white border border-border rounded-xl">
              <Wallet className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No transactions yet</p>
              <button onClick={() => setTab("deposit")} className="text-primary text-sm hover:underline mt-1">Add funds to get started</button>
            </div>
          ) : (
            transactions.slice(0, 8).map(tx => (
              <div key={tx.id} className="flex items-center gap-3 bg-white border border-border rounded-xl p-4">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                  ["deposit","commission","refund"].includes(tx.type) ? "bg-green-100" : "bg-red-50"
                }`}>
                  {txTypeIcon(tx.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{tx.description}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {txStatusIcon(tx.status)}
                    <p className="text-xs text-muted-foreground capitalize">{tx.status}</p>
                    <span className="text-muted-foreground text-xs">·</span>
                    <p className="text-xs text-muted-foreground">
                      {tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleDateString("en-GH") : "—"}
                    </p>
                  </div>
                </div>
                <span className={`font-bold text-sm flex-shrink-0 ${
                  ["deposit","commission","refund"].includes(tx.type) ? "text-green-600" : "text-red-500"
                }`}>
                  {["deposit","commission","refund"].includes(tx.type) ? "+" : "-"}₵{Number(tx.amount || 0).toLocaleString("en-GH")}
                </span>
              </div>
            ))
          )}
          {transactions.length > 8 && (
            <button onClick={() => setTab("history")} className="w-full text-center text-primary text-sm hover:underline py-2">
              View all {transactions.length} transactions
            </button>
          )}
        </div>
      )}
      <div className="mb-6">
        <h3 className="font-semibold text-foreground mb-3">
          Notifications
        </h3>

        {notifications.length === 0 ? (
          <div className="bg-white border border-border rounded-xl p-4 text-sm text-muted-foreground">
            No notifications yet.
          </div>
        ) : (
          notifications.slice(0, 5).map((notice: any) => (
            <div
              key={notice.id}
              onClick={async () => {
                if (!notice.read) {
                  await markNotificationAsRead(notice.id);

                  setNotifications(prev =>
                    prev.map(n =>
                      n.id === notice.id
                        ? { ...n, read: true }
                        : n
                    )
                  );
                }
              }}
              className={`rounded-xl p-4 mb-3 border cursor-pointer transition ${
                notice.read
                  ? "bg-white border-border"
                  : "bg-blue-50 border-blue-500"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold">{notice.title}</p>

                {!notice.read && (
                  <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
                    NEW
                  </span>
                )}
              </div>

              <p className="text-sm text-muted-foreground mt-1">
                {notice.message}
              </p>

              <p className="text-xs text-gray-500 mt-2">
                {notice.createdAt?.toDate
                  ? notice.createdAt.toDate().toLocaleString("en-GH")
                  : ""}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Deposit */}
      {tab === "deposit" && (
        <div className="bg-white border border-border rounded-xl p-6">
          <h3 className="font-bold text-foreground mb-4">Add Funds via Paystack</h3>
          <form onSubmit={handleDeposit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Amount (₵)</label>
              <input type="number" min="1" step="0.01" value={depositAmount}
                onChange={e => setDepositAmount(e.target.value)} required
                placeholder="Enter amount e.g. 50"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
            {/* Quick amounts */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Quick amounts</p>
              <div className="flex flex-wrap gap-2">
                {[50, 100, 200, 500].map(a => (
                  <button key={a} type="button" onClick={() => setDepositAmount(String(a))}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      depositAmount === String(a) ? "bg-primary text-white border-primary" : "border-border hover:border-primary hover:text-primary"
                    }`}>
                    ₵{a}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={depositing || !depositAmount}
              className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-bold transition-colors disabled:opacity-50">
              {depositing
                ? "Processing..."
                : `Pay ₵${
                    depositAmount
                      ? (
                          Math.ceil(
                            ((Number(depositAmount) + 0.1) /
                              (1 - 0.0195)) *
                              100
                          ) / 100
                        ).toFixed(2)
                      : "0"
                  } via Paystack`}
            </button>
          </form>
        </div>
      )}

      {/* Withdraw */}
      {tab === "withdraw" && (
        <div className="bg-white border border-border rounded-xl p-6">

          {/* Coming Soon Message */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
            <h3 className="font-bold text-yellow-700 mb-2">
              Withdrawals Coming Soon
            </h3>
            <p className="text-sm text-yellow-600">
              This feature is currently disabled and will be available shortly.
            </p>
          </div>

        </div>
      )}

      {tab === "momo" && (
        <div className="bg-white border border-border rounded-xl p-6 space-y-4">

          <h3 className="font-bold text-foreground text-lg">
            Momo Direct Deposit
          </h3>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            <p className="font-semibold mb-1">How it works</p>
            <p>
              Send your deposit directly via Mobile Money to avoid Paystack fees.
              After payment, please notify us for quick wallet credit.
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <p><strong>MoMo Number:</strong> 0257869403</p>
            <p><strong>Name:</strong> FRANCIS DZAMESI</p>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg text-sm">
            <p className="font-semibold mb-1">Message to send</p>
            <p>
              Good day Middletown Shop, I would like to make a MoMo deposit to my wallet account. Kindly assist with confirmation. Thank you.
            </p>
          </div>

          <a
            href={`https://wa.me/233257869403?text=${encodeURIComponent(
              "Good day Middletown Shop, I would like to make a MoMo deposit to my wallet account. Kindly assist with confirmation. Thank you."
            )}`}
            target="_blank"
            className="block text-center bg-green-600 text-white py-2 rounded-lg font-semibold"
          >
            Send WhatsApp Message
          </a>

        </div>
      )}
      
      {/* Full history */}
      {tab === "history" && (
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">All Transactions ({transactions.length})</h3>
          {loadingTx ? (
            <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-gray-200 rounded-xl animate-pulse" />)}</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 bg-white border border-border rounded-xl">
              <p className="text-sm text-muted-foreground">No transactions yet</p>
            </div>
          ) : transactions.map(tx => (
            <div key={tx.id} className="flex items-center gap-3 bg-white border border-border rounded-xl p-4">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                ["deposit","commission","refund"].includes(tx.type) ? "bg-green-100" : "bg-red-50"
              }`}>
                {txTypeIcon(tx.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{tx.description}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  {txStatusIcon(tx.status)}
                  <p className="text-xs text-muted-foreground capitalize">{tx.type} · {tx.status}</p>
                  <span className="text-xs text-muted-foreground">·</span>
                  <p className="text-xs text-muted-foreground">
                    {tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleDateString("en-GH") : "—"}
                  </p>
                </div>
              </div>
              <span className={`font-bold text-sm flex-shrink-0 ${
                ["deposit","commission","refund"].includes(tx.type) ? "text-green-600" : "text-red-500"
              }`}>
                {["deposit","commission","refund"].includes(tx.type) ? "+" : "-"}₵{Number(tx.amount || 0).toLocaleString("en-GH")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

