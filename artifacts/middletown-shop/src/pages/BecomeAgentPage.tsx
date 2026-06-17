import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import type { AgentApplication } from "@/lib/types";
import { submitAgentApplication, getAgentApplication } from "@/lib/firestore";
import { Handshake, TrendingUp, Users, DollarSign, CheckCircle, Clock, XCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const BENEFITS = [
  { icon: <DollarSign className="w-5 h-5 text-green-600" />, title: "Earn Commissions", desc: "Earn up to 5% commission on every sale made through your referral" },
  { icon: <TrendingUp className="w-5 h-5 text-blue-600" />, title: "Performance Bonuses", desc: "Hit monthly targets and unlock extra bonus payouts" },
  { icon: <Users className="w-5 h-5 text-purple-600" />, title: "Build Your Network", desc: "Grow your customer base and increase passive earnings" },
  { icon: <Handshake className="w-5 h-5 text-orange-600" />, title: "Dedicated Support", desc: "Get access to exclusive agent support and resources" },
];

export default function BecomeAgentPage() {
  const { user, userProfile } = useAuth();
  const [application, setApplication] = useState<AgentApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    phone: "",
    location: "",
    businessName: "",
    idType: "Ghana Card",
    idNumber: "",
  });

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getAgentApplication(user.uid)
      .then(setApplication)
      .catch(() => setApplication(null))
      .finally(() => setLoading(false));
  }, [user]);

  const isAgent = userProfile?.role === "agent";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) return;
    setSubmitting(true);
    try {
      await submitAgentApplication({
        userId: user.uid,
        userName: userProfile.displayName || user.email?.split("@")[0] || "User",
        userEmail: userProfile.email || user.email || "",
        ...form,
      });
      const app = await getAgentApplication(user.uid);
      setApplication(app);
      toast.success("Application submitted! We'll review within 48 hours.");
    } catch {
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (isAgent) {
    return (
      <div className="p-4 md:p-6 max-w-xl mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">You're an Agent!</h2>
          <p className="text-muted-foreground mb-2">Your agent code:</p>
          <div className="bg-white border border-green-300 rounded-xl px-6 py-3 inline-block mb-4">
            <span className="text-2xl font-mono font-black text-primary">{userProfile?.agentCode || "N/A"}</span>
          </div>
          <p className="text-sm text-muted-foreground mb-6">Share this code with customers to earn commissions</p>
          <a href="/agent/dashboard"
            className="inline-block bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors">
            View Agent Dashboard
          </a>
        </div>
      </div>
    );
  }

  if (application) {
    const statusConfig = {
      pending: { icon: <Clock className="w-12 h-12 text-yellow-500" />, title: "Application Under Review", desc: "We're reviewing your application. This usually takes 24–48 hours.", color: "bg-yellow-50 border-yellow-200" },
      approved: { icon: <CheckCircle className="w-12 h-12 text-green-500" />, title: "Application Approved!", desc: "Congratulations! Your agent account is being set up.", color: "bg-green-50 border-green-200" },
      rejected: { icon: <XCircle className="w-12 h-12 text-red-500" />, title: "Application Not Approved", desc: "Unfortunately your application wasn't approved. Contact support for more info.", color: "bg-red-50 border-red-200" },
    };
    const s = statusConfig[application.status];
    return (
      <div className="p-4 md:p-6 max-w-xl mx-auto">
        <div className={`border rounded-2xl p-8 text-center ${s.color}`}>
          <div className="flex justify-center mb-4">{s.icon}</div>
          <h2 className="text-xl font-bold text-foreground mb-2">{s.title}</h2>
          <p className="text-muted-foreground text-sm">{s.desc}</p>
          {application.status === "rejected" && (
            <button onClick={() => setApplication(null)} className="mt-4 text-primary text-sm hover:underline">Apply again</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Handshake className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Become an Agent</h1>
        </div>
        <p className="text-muted-foreground text-sm">Join our agent network and earn commissions on every sale</p>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {BENEFITS.map(b => (
          <div key={b.title} className="bg-white border border-border rounded-xl p-4">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center mb-3">{b.icon}</div>
            <p className="font-semibold text-foreground text-sm mb-1">{b.title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
          </div>
        ))}
      </div>

      {/* Application form */}
      <div className="bg-white border border-border rounded-xl p-6">
        <h3 className="font-bold text-foreground mb-4">Agent Application Form</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Phone Number *</label>
              <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required
                placeholder="0244123456"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Location *</label>
              <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} required
                placeholder="e.g. Accra, Kumasi"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Business Name (Optional)</label>
            <input type="text" value={form.businessName} onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))}
              placeholder="Your business name"
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">ID Type *</label>
              <select value={form.idType} onChange={e => setForm(f => ({ ...f, idType: e.target.value }))} required
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                <option>Ghana Card</option>
                <option>Voter's ID</option>
                <option>Driver's License</option>
                <option>Passport</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">ID Number *</label>
              <input type="text" value={form.idNumber} onChange={e => setForm(f => ({ ...f, idNumber: e.target.value }))} required
                placeholder="GHA-XXXXXXXX-X"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
          </div>
          <div className="bg-muted rounded-lg p-3 text-xs text-muted-foreground">
            By submitting this form, you agree to our agent terms and conditions. Your information will be reviewed within 24–48 hours.
          </div>
          <button type="submit" disabled={submitting}
            className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
}
