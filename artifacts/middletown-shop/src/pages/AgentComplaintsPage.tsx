import { useState, useEffect } from "react";
import { getAllComplaints, replyToComplaint, resolveComplaint } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import type { Complaint } from "@/lib/types";
import { MessageSquare, Send, CheckCircle, Clock, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  open:        { label: "Open",        color: "bg-yellow-100 text-yellow-700" },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700" },
  resolved:    { label: "Resolved",    color: "bg-green-100 text-green-700" },
};

export default function AgentComplaintsPage() {
  const { isAgent } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replying, setReplying] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "open" | "in_progress" | "resolved">("open");

  useEffect(() => {
    if (!isAgent) { navigate("/dashboard"); return; }
    setLoading(true);
    getAllComplaints().then(setComplaints).finally(() => setLoading(false));
  }, [isAgent, navigate]);

  const handleReply = async (id: string) => {
    const msg = replyText[id]?.trim();
    if (!msg) { toast.error("Enter a reply message"); return; }
    setReplying(id);
    try {
      await replyToComplaint(id, { from: "Agent", message: msg });
      setReplyText(r => ({ ...r, [id]: "" }));
      toast.success("Reply sent");
      getAllComplaints().then(setComplaints);
    } catch {
      toast.error("Failed to send reply");
    } finally {
      setReplying(null);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await resolveComplaint(id);
      toast.success("Marked as resolved");
      getAllComplaints().then(setComplaints);
    } catch {
      toast.error("Failed to update");
    }
  };

  const filtered = complaints.filter(c => filter === "all" || c.status === filter);

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary" /> Customer Complaints
        </h1>
        <p className="text-muted-foreground text-sm mt-1">View and respond to complaints as agent</p>
      </div>

      <div className="flex gap-2 mb-6 bg-muted rounded-lg p-1">
        {(["all", "open", "in_progress", "resolved"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
              filter === f ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
            }`}>
            {f.replace("_", " ")} ({complaints.filter(c => f === "all" || c.status === f).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-border rounded-xl">
          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No {filter === "all" ? "" : filter.replace("_", " ")} complaints</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(c => {
            const s = STATUS_CONFIG[c.status] || STATUS_CONFIG.open;
            const isExpanded = expandedId === c.id;
            return (
              <div key={c.id} className="bg-white border border-border rounded-xl overflow-hidden">
                <button className="w-full text-left p-5" onClick={() => setExpandedId(isExpanded ? null : c.id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-medium text-foreground">{c.userName}</span>
                        <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{c.category}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">{c.message}</p>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-border space-y-4">
                    <div className="mt-4">
                      <p className="text-sm bg-muted/40 rounded-lg p-3">{c.message}</p>
                    </div>
                    {c.replies && c.replies.length > 0 && (
                      <div className="space-y-2">
                        {c.replies.map((r, i) => (
                          <div key={i} className={`rounded-lg p-3 ${r.from === "Admin" || r.from === "Agent" ? "bg-primary/5 border border-primary/15" : "bg-muted/40"}`}>
                            <p className={`text-xs font-bold mb-0.5 ${r.from === "Admin" || r.from === "Agent" ? "text-primary" : "text-foreground"}`}>{r.from}</p>
                            <p className="text-sm">{r.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {c.status !== "resolved" && (
                      <>
                        <div className="flex gap-2">
                          <textarea value={replyText[c.id] || ""} onChange={e => setReplyText(r => ({ ...r, [c.id]: e.target.value }))}
                            rows={2} placeholder="Type your reply..."
                            className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                          <button onClick={() => handleReply(c.id)} disabled={replying === c.id}
                            className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50">
                            {replying === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          </button>
                        </div>
                        <button onClick={() => handleResolve(c.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200">
                          <CheckCircle className="w-3.5 h-3.5" /> Mark Resolved
                        </button>
                      </>
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
