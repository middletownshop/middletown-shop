import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { AgentCommission } from "@/lib/types";
import { getAgentCommissions } from "@/lib/firestore";
import { TrendingUp, Copy, DollarSign, Users, Award, Clock, CheckCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function AgentDashboardPage() {
  const { user, userProfile, isAgent } = useAuth();
  const navigate = useNavigate();
  const [commissions, setCommissions] = useState<AgentCommission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    if (!isAgent) { navigate("/agent/apply"); return; }
    getAgentCommissions(user.uid)
      .then(setCommissions)
      .catch(() => setCommissions([]))
      .finally(() => setLoading(false));
  }, [user, isAgent, navigate]);

  const totalEarned = commissions.filter(c => c.status === "paid").reduce((s, c) => s + c.commissionAmount, 0);
  const pendingEarned = commissions.filter(c => c.status === "pending").reduce((s, c) => s + c.commissionAmount, 0);
  const totalReferrals = commissions.length;

  const agentCode = userProfile?.agentCode || user?.uid.slice(0, 8).toUpperCase() || "N/A";

  const copyCode = () => {
    navigator.clipboard.writeText(agentCode).then(() => toast.success("Agent code copied!"));
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Agent Dashboard</h1>
        </div>
        <p className="text-muted-foreground text-sm">Track your commissions and performance</p>
      </div>

      {/* Referral code */}
      <div className="bg-gradient-to-r from-primary to-blue-700 rounded-2xl p-5 text-white mb-6 shadow-lg">
        <p className="text-sm text-blue-200 mb-1">Your Referral Code</p>
        <div className="flex items-center gap-3">
          <span className="text-3xl font-mono font-black">{agentCode}</span>
          <button onClick={copyCode}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
            <Copy className="w-3.5 h-3.5" /> Copy
          </button>
        </div>
        <p className="text-xs text-blue-200 mt-2">Share this code with customers to earn commissions on their purchases</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Earned", value: `₵${totalEarned.toLocaleString("en-GH")}`, icon: <DollarSign className="w-5 h-5 text-green-600" />, color: "bg-green-50 border-green-100" },
          { label: "Pending", value: `₵${pendingEarned.toLocaleString("en-GH")}`, icon: <Clock className="w-5 h-5 text-yellow-600" />, color: "bg-yellow-50 border-yellow-100" },
          { label: "Total Referrals", value: totalReferrals, icon: <Users className="w-5 h-5 text-blue-600" />, color: "bg-blue-50 border-blue-100" },
          { label: "Commission Rate", value: "5%", icon: <Award className="w-5 h-5 text-purple-600" />, color: "bg-purple-50 border-purple-100" },
        ].map(s => (
          <div key={s.label} className={`border rounded-xl p-4 ${s.color}`}>
            <div className="p-1.5 bg-white rounded-lg shadow-sm w-fit mb-2">{s.icon}</div>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Performance guide */}
      <div className="bg-white border border-border rounded-xl p-5 mb-5">
        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-primary" /> Commission Tiers
        </h3>
        <div className="space-y-3">
          {[
            { tier: "Starter", referrals: "0–10", rate: "5%", color: "bg-gray-100" },
            { tier: "Silver", referrals: "11–50", rate: "7%", color: "bg-gray-200" },
            { tier: "Gold", referrals: "51–200", rate: "10%", color: "bg-yellow-100" },
            { tier: "Platinum", referrals: "200+", rate: "12%", color: "bg-blue-100" },
          ].map(t => (
            <div key={t.tier} className={`flex items-center justify-between p-3 rounded-lg ${t.color}`}>
              <div>
                <span className="font-semibold text-sm text-foreground">{t.tier}</span>
                <span className="text-xs text-muted-foreground ml-2">{t.referrals} referrals</span>
              </div>
              <span className="font-bold text-primary text-sm">{t.rate}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Commission history */}
      <div className="bg-white border border-border rounded-xl p-5">
        <h3 className="font-bold text-foreground mb-4">Commission History</h3>
        {commissions.length === 0 ? (
          <div className="text-center py-10">
            <TrendingUp className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No commissions yet</p>
            <p className="text-xs text-muted-foreground mt-1">Share your referral code to start earning</p>
          </div>
        ) : (
          <div className="space-y-3">
            {commissions.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">Order #{c.orderId.slice(-8)}</p>
                  <p className="text-xs text-muted-foreground">
                    Order: ₵{Number(c.orderAmount || 0).toLocaleString("en-GH")} · Rate: {c.commissionRate}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString("en-GH") : "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">+₵{Number(c.commissionAmount || 0).toLocaleString("en-GH")}</p>
                  <div className={`flex items-center gap-1 text-xs mt-0.5 justify-end ${c.status === "paid" ? "text-green-600" : "text-yellow-600"}`}>
                    {c.status === "paid" ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    <span className="capitalize">{c.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
