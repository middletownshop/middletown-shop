import { useState, useEffect } from "react";
import { getAllWithdrawalRequests, updateWithdrawalStatus } from "@/lib/firestore";
import type { WithdrawalRequest } from "@/lib/types";
import { Wallet, CheckCircle, XCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";

const STATUS_CONFIG = {
  pending:  { label: "Pending",  color: "bg-yellow-100 text-yellow-700", icon: <Clock className="w-3.5 h-3.5" /> },
  approved: { label: "Approved", color: "bg-green-100 text-green-700",   icon: <CheckCircle className="w-3.5 h-3.5" /> },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-600",       icon: <XCircle className="w-3.5 h-3.5" /> },
};

export default function AdminWithdrawals() {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  const load = () => {
    setLoading(true);
    getAllWithdrawalRequests().then(setRequests).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (id: string, status: "approved" | "rejected") => {
    try {
      await updateWithdrawalStatus(id, status);
      toast.success(`Request ${status}`);
      load();
    } catch {
      toast.error("Failed to update request");
    }
  };

  const filtered = requests.filter(r => filter === "all" || r.status === filter);
  const counts = {
    all: requests.length,
    pending: requests.filter(r => r.status === "pending").length,
    approved: requests.filter(r => r.status === "approved").length,
    rejected: requests.filter(r => r.status === "rejected").length,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Wallet className="w-6 h-6 text-primary" /> Withdrawal Requests
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Process customer withdrawal requests</p>
      </div>

      <div className="flex gap-2 mb-6 bg-muted rounded-lg p-1">
        {(["all", "pending", "approved", "rejected"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
              filter === f ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
            }`}>
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-border rounded-xl">
          <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No {filter === "all" ? "" : filter} withdrawal requests</p>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                {["User", "Amount", "Bank", "Account", "Status", "Date", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const s = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
                return (
                  <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground text-sm">{r.userName}</p>
                      <p className="text-xs text-muted-foreground">{r.userEmail}</p>
                    </td>
                    <td className="px-4 py-3 font-bold text-primary">₵{Number(r.amount || 0).toLocaleString("en-GH")}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.bankName}</td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-mono text-foreground">{r.accountNumber}</p>
                      <p className="text-xs text-muted-foreground">{r.accountName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${s.color}`}>
                        {s.icon} {s.label}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString("en-GH") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {r.status === "pending" && (
                        <div className="flex gap-2">
                          <button onClick={() => handleAction(r.id, "approved")}
                            className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200">
                            Approve
                          </button>
                          <button onClick={() => handleAction(r.id, "rejected")}
                            className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs font-medium hover:bg-red-100">
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
