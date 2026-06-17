import { useState, useEffect } from "react";
import {
  getAllFirestoreBundles, createFirestoreBundle, updateFirestoreBundle, deleteFirestoreBundle,
} from "@/lib/firestore";
import type { DataBundle, NetworkProvider } from "@/lib/types";
import { Plus, Pencil, Trash2, Eye, EyeOff, Signal, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const NETWORKS: NetworkProvider[] = ["MTN", "Telecel", "AirtelTigo"];

const NETWORK_BADGE: Record<NetworkProvider, string> = {
  MTN: "bg-yellow-100 text-yellow-800",
  Telecel: "bg-red-100 text-red-700",
  AirtelTigo: "bg-blue-100 text-blue-700",
};

const EMPTY_FORM = {
  network: "MTN" as NetworkProvider,
  name: "", data: "", validity: "", price: 0, enabled: true, popular: false,
};

export default function AdminBundles() {
  const [bundles, setBundles] = useState<DataBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [filterNet, setFilterNet] = useState<NetworkProvider | "">("");

  const load = () => {
    setLoading(true);
    getAllFirestoreBundles().then(setBundles).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm({ ...EMPTY_FORM }); setEditId(null); setShowForm(true); };

  const openEdit = (b: DataBundle) => {
    setForm({ network: b.network, name: b.name, data: b.data, validity: b.validity, price: b.price, enabled: b.enabled ?? true, popular: b.popular ?? false });
    setEditId(b.id);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.data || !form.validity || !form.price) { toast.error("Fill in all required fields"); return; }
    setSaving(true);
    try {
      if (editId) {
        await updateFirestoreBundle(editId, form);
        toast.success("Bundle updated");
      } else {
        await createFirestoreBundle(form);
        toast.success("Bundle created");
      }
      setShowForm(false);
      load();
    } catch {
      toast.error("Failed to save bundle");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteFirestoreBundle(id);
      toast.success("Bundle deleted");
      load();
    } catch {
      toast.error("Failed to delete bundle");
    }
  };

  const handleToggle = async (b: DataBundle) => {
    try {
      await updateFirestoreBundle(b.id, { enabled: !b.enabled });
      toast.success(b.enabled ? "Bundle disabled" : "Bundle enabled");
      load();
    } catch {
      toast.error("Failed to update bundle");
    }
  };

  const filtered = filterNet ? bundles.filter(b => b.network === filterNet) : bundles;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Signal className="w-6 h-6 text-primary" /> Manage Bundles
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Add and manage data bundle plans</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Bundle
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-border rounded-xl p-6 mb-6 shadow-sm">
          <h3 className="font-bold text-foreground mb-4">{editId ? "Edit Bundle" : "New Bundle"}</h3>
          <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Network *</label>
              <select value={form.network} onChange={e => setForm(f => ({ ...f, network: e.target.value as NetworkProvider }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                {NETWORKS.map(n => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Bundle Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                placeholder="e.g. Weekly Pack"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Data Size *</label>
              <input value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} required
                placeholder="e.g. 5GB"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Validity *</label>
              <input value={form.validity} onChange={e => setForm(f => ({ ...f, validity: e.target.value }))} required
                placeholder="e.g. 7 days"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Price (₵) *</label>
              <input type="number" min="0" step="0.01" value={form.price || ""}
                onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} required
                placeholder="0.00"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="flex flex-col gap-2 pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.enabled} onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-primary" />
                <span className="text-sm text-foreground">Active (visible to customers)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.popular} onChange={e => setForm(f => ({ ...f, popular: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-primary" />
                <span className="text-sm text-foreground">Mark as Popular</span>
              </label>
            </div>
            <div className="col-span-2 flex gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted">Cancel</button>
              <button type="submit" disabled={saving}
                className="flex-1 bg-primary text-white py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Save Bundle"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-5">
        <button onClick={() => setFilterNet("")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!filterNet ? "bg-primary text-white" : "border border-border hover:bg-muted"}`}>
          All ({bundles.length})
        </button>
        {NETWORKS.map(n => (
          <button key={n} onClick={() => setFilterNet(n)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterNet === n ? "bg-primary text-white" : "border border-border hover:bg-muted"}`}>
            {n} ({bundles.filter(b => b.network === n).length})
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-border rounded-xl">
          <Signal className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-foreground mb-1">No bundles yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Add your first data bundle to get started</p>
          <button onClick={openAdd} className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
            Add First Bundle
          </button>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                {["Network", "Name", "Data", "Validity", "Price", "Status", ""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${NETWORK_BADGE[b.network]}`}>{b.network}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {b.name}
                    {b.popular && <span className="ml-1 text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-full">Popular</span>}
                  </td>
                  <td className="px-4 py-3 text-foreground font-bold">{b.data}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.validity}</td>
                  <td className="px-4 py-3 font-bold text-primary">₵{Number(b.price || 0).toLocaleString("en-GH")}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.enabled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {b.enabled ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleToggle(b)} title={b.enabled ? "Disable" : "Enable"}
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                        {b.enabled ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button onClick={() => openEdit(b)}
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(b.id, b.name)}
                        className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
