import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import type { Complaint } from "@/lib/types";
import { createComplaint, getMyComplaints } from "@/lib/firestore";
import { MessageSquare, Plus, Clock, CheckCircle, Loader2, Send, ChevronDown, ChevronUp } from "lucide-react";
import toast from "react-hot-toast";

const CATEGORIES = ["Order Issue", "Payment Problem", "Delivery Delay", "Product Quality", "Refund Request", "Account Problem", "Other"];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  open:        { label: "Open",        color: "bg-yellow-100 text-yellow-700", icon: <Clock className="w-3.5 h-3.5" /> },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700",    icon: <Loader2 className="w-3.5 h-3.5" /> },
  resolved:    { label: "Resolved",    color: "bg-green-100 text-green-700",   icon: <CheckCircle className="w-3.5 h-3.5" /> },
};

export default function ComplaintsPage() {
  const { user, userProfile } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [form, setForm] = useState({ category: CATEGORIES[0], message: "" });

  const load = () => {
    if (!user) return;
    setLoading(true);
    getMyComplaints(user.uid)
      .then(setComplaints)
      .catch(() => setComplaints([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.message.trim()) { toast.error("Please describe your complaint"); return; }
    if (!user || !userProfile) return;
    setSubmitting(true);
    try {
      await createComplaint({
        userId: user.uid,
        userName: userProfile.displayName || user.email?.split("@")[0] || "User",
        userEmail: userProfile.email || user.email || "",
        category: form.category,
        message: form.message.trim(),
      });
      toast.success("Complaint submitted! We'll respond within 24 hours.");
      setForm({ category: CATEGORIES[0], message: "" });
      setShowForm(false);
      load();
    } catch {
      toast.error("Failed to submit complaint. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Complaints</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Submit and track your complaints</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> New Complaint
        </button>
      </div>

      {/* Submit Form */}
      {showForm && (
        <div className="bg-white border border-border rounded-xl p-5 mb-6 shadow-sm">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" /> Submit a Complaint
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Message</label>
              <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required
                rows={4} placeholder="Describe your issue in detail..."
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted">Cancel</button>
              <button type="submit" disabled={submitting}
                className="flex-1 bg-primary text-white py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Send className="w-4 h-4" /> Submit</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Complaints List */}
      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />)}</div>
      ) : complaints.length === 0 ? (
        <div className="text-center py-16 bg-white border border-border rounded-xl">
          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-foreground mb-1">No complaints yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Submit a complaint if you're experiencing any issues</p>
          <button onClick={() => setShowForm(true)} className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
            Submit First Complaint
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map(c => {
            const s = STATUS_CONFIG[c.status] || STATUS_CONFIG.open;
            const isExpanded = expandedId === c.id;
            return (
              <div key={c.id} className="bg-white border border-border rounded-xl overflow-hidden">
                <button className="w-full text-left p-5" onClick={() => setExpandedId(isExpanded ? null : c.id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{c.category}</span>
                        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${s.color}`}>
                          {s.icon} {s.label}
                        </div>
                      </div>
                      <p className="text-sm text-foreground line-clamp-2">{c.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString("en-GH", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                        {c.replies?.length > 0 && ` · ${c.replies.length} reply(ies)`}
                      </p>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-border">
                    <div className="mt-4 mb-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Your Message</p>
                      <p className="text-sm text-foreground bg-muted/40 rounded-lg p-3">{c.message}</p>
                    </div>
                    {c.replies && c.replies.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Replies</p>
                        <div className="space-y-2">
                          {c.replies.map((r, i) => (
                            <div key={i} className="bg-primary/5 border border-primary/15 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-primary">{r.from}</span>
                                <span className="text-[10px] text-muted-foreground">
                                  {r.timestamp?.toDate ? r.timestamp.toDate().toLocaleDateString("en-GH") : ""}
                                </span>
                              </div>
                              <p className="text-sm text-foreground">{r.message}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {c.status === "resolved" && (
                      <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> This complaint has been resolved.
                      </div>
                    )}
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
