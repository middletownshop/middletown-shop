import { useState, useEffect } from "react";
import { getAllUsers } from "@/lib/firestore";
import type { UserProfile } from "@/lib/types";
import { Search, User } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getAllUsers().then(setUsers).catch(() => setUsers([])).finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    !search ||
    u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">User Management</h1>

      <div className="relative mb-5 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." data-testid="input-user-search"
          className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
      </div>

      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">User</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Email</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Role</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Wallet</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-border">
                    <td colSpan={5} className="px-5 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">No users found</td></tr>
              ) : filtered.map(u => (
                <tr key={u.uid} data-testid={`user-row-${u.uid}`} className="border-t border-border hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium text-foreground">{u.displayName || "—"}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.role === "admin" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {u.role || "customer"}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-medium text-foreground">₵{Number(u.walletBalance || 0).toLocaleString("en-GH")}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
