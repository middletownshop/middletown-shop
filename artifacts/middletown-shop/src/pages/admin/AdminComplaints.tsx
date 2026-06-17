import { useState, useEffect } from "react";
import { getAllComplaints, replyToComplaint, resolveComplaint, deleteComplaint } from "@/lib/firestore";
import type { Complaint } from "@/lib/types";
import { MessageSquare, Send, CheckCircle, Trash2, Clock, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import toast from "react-hot-toast";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  open:        { label: "Open",        color: "bg-yellow-100 text-yellow-700" },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700" },
  resolved:    { label: "Resolved",    color: "bg-green-100 text-green-700" },
};

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replying, setReplying] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "open" | "in_progress" | "resolved">("all");

  const load = () => {
    setLoading(true);
    getAllComplaints().then(setComplaints).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleReply = async (id: string) => {
    const msg = replyText[id]?.trim();
    if (!msg) { toast.error("Enter a reply message"); return; }
    setReplying(id);
    try {
      await replyToComplaint(id, { from: "Admin", message: msg });
      setReplyText(r => ({ ...r, [id]: "" }));
      toast.success("Reply sent");
      load();
    } catch {
      toast.error("Failed to send reply");
    } finally {
      setReplying(null);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await resolveComplaint(id);
      toast.success("Complaint marked as resolved");
      load();
    } catch {
      toast.error("Failed to resolve complaint");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this complaint permanently?")) return;
    try {
      await deleteComplaint(id);
      toast.success("Complaint deleted");
      load();
    } catch {
      toast.error("Failed to delete complaint");
    }
  };

  const filtered = complaints.filter(c => filter === "all" || c.status === filter);

  const counts = {
    all: complaints.length,
    open: complaints.filter(c => c.status === "open").length,
    in_progress: complaints.filter(c => c.status === "in_progress").length,
    resolved: complaints.filter(c => c.status === "resolved").length,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary" /> Complaints Management
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Review and respond to customer complaints</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 bg-muted rounded-lg p-1">
        {(["all", "open", "in_progress", "resolved"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
              filter === f ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
            }`}>
            {f.replace("_", " ")} ({counts[f]})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />)}</div>
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
                        <span className="text-xs font-semibold text-foreground">{c.userName}</span>
                        <span className="text-xs text-muted-foreground">{c.userEmail}</span>
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{c.category}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                      </div>
                      <p className="text-sm text-foreground line-clamp-2">{c.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString("en-GH") : "—"}
                        {c.replies?.length > 0 && ` · ${c.replies.length} reply(ies)`}
                      </p>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-border space-y-4">
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Message</p>
                      <p className="text-sm text-foreground bg-muted/40 rounded-lg p-3">{c.message}</p>
                    </div>

                    {c.replies && c.replies.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Conversation</p>
                        <div className="space-y-2">
                          {c.replies.map((r, i) => (
                            <div key={i} className={`rounded-lg p-3 ${r.from === "Admin" ? "bg-primary/5 border border-primary/15" : "bg-muted/40"}`}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-bold ${r.from === "Admin" ? "text-primary" : "text-foreground"}`}>{r.from}</span>
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

                    {c.status !== "resolved" && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Reply</p>
                        <div className="flex gap-2">
                          <textarea
                            value={replyText[c.id] || ""}
                            onChange={e => setReplyText(r => ({ ...r, [c.id]: e.target.value }))}
                            rows={2} placeholder="Type your reply..."
                            className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                          />
                          <button onClick={() => handleReply(c.id)} disabled={replying === c.id}
                            className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50">
                            {replying === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {c.status !== "resolved" && (
                        <button onClick={() => handleResolve(c.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200">
                          <CheckCircle className="w-3.5 h-3.5" /> Mark Resolved
                        </button>
                      )}
                      <button onClick={() => handleDelete(c.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
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
