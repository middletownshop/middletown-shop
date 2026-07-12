import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import type { WalletTransaction } from "@/lib/types";
import {
  getWalletTransactions,
  requestWalletWithdrawal,
  addWalletDeposit,
  getUserNotifications,
  markNotificationAsRead
} from "@/lib/firestore";
import { 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Plus, 
  Minus, 
  Clock, 
  CheckCircle, 
  XCircle,
  Bell,
  MessageSquare,
  ExternalLink
} from "lucide-react";
import toast from "react-hot-toast";

// Types & Interfaces
type Tab = "overview" | "deposit" | "withdraw" | "momo" | "history";

interface UserNotification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt?: {
    toDate: () => Date;
  };
}

interface PaystackResponse {
  reference: string;
  status: string;
}

// Fee Configuration Constants
const PAYSTACK_PERCENTAGE_FEE = 0.0195;
const PAYSTACK_FIXED_FEE = 0.10;
const MIN_DEPOSIT_GHS = 10; // Modified minimum floor limit bound

// Deterministic pricing formulas
const calculateTotalPaystackAmount = (targetAmount: number): number => {
  if (!targetAmount || targetAmount <= 0) return 0;
  return Math.ceil(((targetAmount + PAYSTACK_FIXED_FEE) / (1 - PAYSTACK_PERCENTAGE_FEE)) * 100) / 100;
};

export default function WalletPage() {
  const { user, userProfile, refreshProfile } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loadingTx, setLoadingTx] = useState<boolean>(true);
  const [loadingNotifications, setLoadingNotifications] = useState<boolean>(true);

  // Deposit state
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [depositing, setDepositing] = useState<boolean>(false);

  // Withdrawal state
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [bankName, setBankName] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [accountName, setAccountName] = useState<string>("");
  const [withdrawing, setWithdrawing] = useState<boolean>(false);

  const balance = useMemo(() => Number(userProfile?.walletBalance || 0), [userProfile?.walletBalance]);

  // Fetch data cleanly on user state change
  useEffect(() => {
    if (!user?.uid) return;

    let isMounted = true;
    setLoadingTx(true);

    getWalletTransactions(user.uid)
      .then((txs) => {
        if (isMounted) setTransactions(txs);
      })
      .catch((err) => {
        console.error("Failed to fetch transactions:", err);
        if (isMounted) setTransactions([]);
      })
      .finally(() => {
        if (isMounted) setLoadingTx(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user?.uid, tab]);

  // Isolate notifications from layout state loops
  useEffect(() => {
    if (!user?.uid) return;

    let isMounted = true;
    setLoadingNotifications(true);

    getUserNotifications(user.uid)
      .then((notices) => {
        if (isMounted) setNotifications(notices);
      })
      .catch((err) => {
        console.error("Failed to fetch notifications:", err);
        if (isMounted) setNotifications([]);
      })
      .finally(() => {
        if (isMounted) setLoadingNotifications(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  const handlePaystackSuccess = useCallback(async (response: PaystackResponse) => {
    if (!user?.uid) return;

    try {
      setDepositing(true);
      await addWalletDeposit(user.uid, Number(depositAmount), response.reference);
      await refreshProfile();

      const updatedTxs = await getWalletTransactions(user.uid);
      setTransactions(updatedTxs);

      toast.success(`₵${Number(depositAmount).toFixed(2)} credited successfully`);
      setDepositAmount("");
      setTab("overview");
    } catch (err) {
      console.error("WALLET UPDATE ERROR:", err);
      toast.error("Failed to update wallet ledger state");
    } finally {
      setDepositing(false);
    }
  }, [user?.uid, depositAmount, refreshProfile]);

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);

    if (!amount || amount < MIN_DEPOSIT_GHS) {
      toast.error(`Minimum deposit amount is ₵${MIN_DEPOSIT_GHS}`);
      return;
    }

    if (!user) {
      toast.error("Authentication session missing");
      return;
    }

    const paystackPop = (window as any).PaystackPop;
    if (!paystackPop) {
      toast.error("Payment secure layer gateway uninitialized. Please refresh.");
      return;
    }

    const grossAmountPayable = calculateTotalPaystackAmount(amount);
    const userEmailAddress = user.email || userProfile?.email || `${user.uid}@wallet.com`;

    const handler = paystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      email: userEmailAddress,
      amount: Math.round(grossAmountPayable * 100),
      currency: "GHS",
      ref: `WLT-${user.uid.slice(0, 5).toUpperCase()}-${Date.now()}`,
      callback: (response: PaystackResponse) => {
        handlePaystackSuccess(response);
      },
      onClose: () => {
        toast.error("Payment session aborted by user");
      },
    });

    handler.openIframe();
  };

  const handleNotificationClick = async (notice: UserNotification) => {
    if (notice.read) return;

    setNotifications(prev => prev.map(n => n.id === notice.id ? { ...n, read: true } : n));

    try {
      await markNotificationAsRead(notice.id);
    } catch (error) {
      console.error("Failed to sync read status:", error);
      setNotifications(prev => prev.map(n => n.id === notice.id ? { ...n, read: false } : n));
    }
  };

  const getTransactionVisuals = (type: string) => {
    const isCredit = ["deposit", "commission", "refund"].includes(type);
    return {
      containerClass: isCredit ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600",
      icon: isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />,
      textClass: isCredit ? "text-emerald-600" : "text-rose-600",
      prefix: isCredit ? "+" : "-"
    };
  };

  const renderStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />;
      case "failed":
        return <XCircle className="w-3.5 h-3.5 text-rose-500" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-amber-500" />;
    }
  };

  const parsedTotalPaystackAmount = useMemo(() => {
    return calculateTotalPaystackAmount(Number(depositAmount)).toFixed(2);
  }, [depositAmount]);

  const momoMessageString = "Good day Middletown Shop, I would like to make a MoMo deposit to my wallet account. Kindly assist with confirmation. Thank you.";

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      {/* Header View Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">My Wallet</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your balance ledger, secure deposits, and withdrawal accounts</p>
      </div>

      {/* Premium Balance Card Display */}
      <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl shadow-blue-500/10 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10">
          <Wallet className="w-40 h-40" />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-blue-100" />
              <span className="text-blue-100/90 text-sm font-medium tracking-wide">Available Balance</span>
            </div>
            <span className="bg-white/15 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">GHS Account</span>
          </div>

          <p className="text-4xl font-extrabold tracking-tight">
            ₵{balance.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>

          <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-3 flex items-center justify-between border border-white/5">
            <div>
              <p className="text-blue-100/80 text-xs uppercase tracking-wider font-semibold">Reward Metrics</p>
              <p className="text-xl font-bold mt-0.5">⭐ {userProfile?.rewardPoints ?? 0}</p>
            </div>
            <div className="text-right">
              <p className="text-blue-100/80 text-xs uppercase tracking-wider font-semibold">Tier status</p>
              <p className="text-sm font-bold bg-white text-blue-700 px-2 py-0.5 rounded-md mt-1 shadow-sm inline-block">Premium Member</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              onClick={() => setTab("deposit")}
              className="flex-1 flex items-center justify-center gap-2 bg-white text-blue-700 text-sm font-bold px-4 py-3 rounded-xl hover:bg-slate-50 active:scale-[0.98] transition-all shadow-md shadow-slate-900/10"
            >
              <Plus className="w-4 h-4" /> Add Funds
            </button>
            <button 
              onClick={() => setTab("withdraw")}
              className="flex-1 flex items-center justify-center gap-2 bg-white/15 text-white text-sm font-bold px-4 py-3 rounded-xl border border-white/10 hover:bg-white/25 active:scale-[0.98] transition-all"
            >
              <Minus className="w-4 h-4" /> Withdraw
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200/50 dark:border-slate-700">
        {(["overview", "deposit", "withdraw", "momo", "history"] as Tab[]).map((t) => (
          <button 
            key={t} 
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all capitalize tracking-medium ${
              tab === t 
                ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-white" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            {t === "momo" ? "MoMo" : t}
          </button>
        ))}
      </div>

      {/* Segment Render Block Layouts */}
      {tab === "overview" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Recent Transactions</h3>
            {transactions.length > 0 && (
              <button onClick={() => setTab("history")} className="text-xs font-bold text-blue-600 hover:underline">
                View Ledger
              </button>
            )}
          </div>

          {loadingTx ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl animate-pulse" />)}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
              <Wallet className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No account transaction entries detected</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">Your processed ledger deposits or purchases will display here.</p>
              <button onClick={() => setTab("deposit")} className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 px-3 py-2 rounded-lg font-bold transition-all text-slate-700 dark:text-slate-300">
                Add Funds to Wallet
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.slice(0, 6).map((tx) => {
                const styleMeta = getTransactionVisuals(tx.type);
                return (
                  <div key={tx.id} className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl p-4 shadow-sm hover:border-slate-200 transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${styleMeta.containerClass}`}>
                        {styleMeta.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{tx.description}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-slate-400 text-xs">
                          {renderStatusIcon(tx.status)}
                          <span className="capitalize">{tx.status}</span>
                          <span>•</span>
                          <span>{tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleDateString("en-GH", { month: "short", day: "numeric" }) : "—"}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`font-bold text-sm tracking-tight pl-2 flex-shrink-0 ${styleMeta.textClass}`}>
                      {styleMeta.prefix}₵{Number(tx.amount || 0).toLocaleString("en-GH", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Notifications Block */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Updates & Inbox</h3>
            </div>

            {loadingNotifications ? (
              <div className="h-16 bg-slate-50 dark:bg-slate-800 rounded-xl animate-pulse" />
            ) : notifications.length === 0 ? (
              <p className="text-xs text-slate-400 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-4 rounded-xl text-center">
                Your notifications box is empty
              </p>
            ) : (
              <div className="space-y-2.5">
                {notifications.slice(0, 3).map((notice) => (
                  <div
                    key={notice.id}
                    onClick={() => handleNotificationClick(notice)}
                    className={`rounded-xl p-4 border text-left transition-all relative overflow-hidden ${
                      notice.read
                        ? "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/60"
                        : "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50 shadow-sm cursor-pointer hover:bg-blue-50"
                    }`}
                  >
                    {!notice.read && <div className="absolute top-0 left-0 bottom-0 w-1 bg-blue-600" />}
                    <div className="flex items-start justify-between gap-4">
                      <p className={`text-sm ${notice.read ? "font-medium text-slate-700 dark:text-slate-300" : "font-bold text-slate-900 dark:text-white"}`}>
                        {notice.title}
                      </p>
                      {!notice.read && (
                        <span className="bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded-md font-extrabold flex-shrink-0 tracking-wider">NEW</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{notice.message}</p>
                    {notice.createdAt?.toDate && (
                      <p className="text-[10px] text-slate-400 mt-2 font-medium">
                        {notice.createdAt.toDate().toLocaleDateString("en-GH", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Deposit Gateway Form */}
      {tab === "deposit" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm rounded-xl p-6 space-y-5">
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Add Secure Funds</h3>
            <p className="text-xs text-slate-400 mt-0.5">Instant checkout settlements verified powered via Paystack engine.</p>
          </div>

          <form onSubmit={handleDeposit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">Amount to Credit (₵)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">₵</span>
                <input 
                  type="number" 
                  min={MIN_DEPOSIT_GHS} 
                  step="0.01" 
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)} 
                  required
                  placeholder="Minimum value 10.00"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                />
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-400 font-semibold mb-2">Preset Quick Amounts</p>
              <div className="grid grid-cols-4 gap-2">
                {[10, 20, 50, 100].map((a) => (
                  <button 
                    key={a} 
                    type="button" 
                    onClick={() => setDepositAmount(String(a))}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      depositAmount === String(a) 
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm" 
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-blue-500 hover:text-blue-500"
                    }`}
                  >
                    ₵{a}
                  </button>
                ))}
              </div>
            </div>

            {Number(depositAmount) > 0 && (
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 text-xs text-slate-500 space-y-1 border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between">
                  <span>Base Funding Request:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">₵{Number(depositAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Gateway Settlement Fees (1.95% + ₵0.10):</span>
                  <span>₵{(Number(parsedTotalPaystackAmount) - Number(depositAmount)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1.5 mt-1 font-bold text-slate-800 dark:text-slate-200">
                  <span>Total Debit Remittance:</span>
                  <span className="text-blue-600 dark:text-blue-400">₵{parsedTotalPaystackAmount}</span>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={depositing || !depositAmount || Number(depositAmount) < MIN_DEPOSIT_GHS}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white py-3.5 rounded-xl font-bold transition-all text-sm shadow-md shadow-blue-500/10"
            >
              {depositing ? "Validating Settlement..." : `Authorize Payment of ₵${parsedTotalPaystackAmount}`}
            </button>
          </form>
        </div>
      )}

      {/* Withdraw State View Container */}
      {tab === "withdraw" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-xl p-6 text-center space-y-3">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-amber-800 dark:text-amber-400">Automated Settlements Updating</h3>
              <p className="text-xs text-amber-700/80 dark:text-amber-500/90 mt-1 max-w-sm mx-auto leading-relaxed">
                Direct settlement withdrawals are undergoing systemic node updates. Clearing features will re-open within short order frameworks.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MoMo Manual Channel Configuration */}
      {tab === "momo" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm rounded-xl p-6 space-y-5">
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Mobile Money Over-The-Counter</h3>
            <p className="text-xs text-slate-400 mt-0.5">Bypass third-party gateway clearing percentages via offline processing streams.</p>
          </div>

          <div className="bg-blue-50/70 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 text-xs text-blue-900 dark:text-blue-300 space-y-1.5 leading-relaxed">
            <p className="font-bold text-blue-950 dark:text-blue-100">Execution Manual:</p>
            <p>1. Transact your desired funding total to the verified Merchant address detail below.</p>
            <p>2. Tap the WhatsApp validation routing clip to transmit payment logs directly onto customer clearing operations.</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-xl space-y-2 text-sm font-medium">
            <div className="flex justify-between border-b border-slate-200/50 dark:border-slate-700 pb-2">
              <span className="text-slate-400 text-xs">Operator Destination:</span>
              <span className="font-mono text-slate-800 dark:text-white select-all">0257869403</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-400 text-xs">Reference Receiver:</span>
              <span className="text-slate-800 dark:text-white font-bold tracking-wide">FRANCIS DZAMESI</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
            <p className="font-bold text-slate-400 mb-1 uppercase tracking-wider">Validation Copy-Template</p>
            <p className="text-slate-600 dark:text-slate-400 italic font-medium leading-relaxed bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/80">
              "{momoMessageString}"
            </p>
          </div>

          <a
            href={`https://wa.me/233257869403?text=${encodeURIComponent(momoMessageString)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-center bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-emerald-500/10 active:scale-[0.99]"
          >
            <MessageSquare className="w-4 h-4" /> Forward WhatsApp Confirmation <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>
        </div>
      )}

      {/* Complete System Full History Ledger */}
      {tab === "history" && (
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">All Core System Entries ({transactions.length})</h3>

          {loadingTx ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              <p className="text-sm font-medium text-slate-400">No account transaction records linked to this account profile</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => {
                const styleMeta = getTransactionVisuals(tx.type);
                return (
                  <div key={tx.id} className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${styleMeta.containerClass}`}>
                        {styleMeta.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{tx.description}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-slate-400 text-xs">
                          {renderStatusIcon(tx.status)}
                          <span className="capitalize text-[11px] font-medium bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">{tx.type}</span>
                          <span>•</span>
                          <span>{tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleDateString("en-GH", { dateStyle: "medium" }) : "—"}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`font-bold text-sm tracking-tight pl-2 flex-shrink-0 ${styleMeta.textClass}`}>
                      {styleMeta.prefix}₵{Number(tx.amount || 0).toLocaleString("en-GH", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}