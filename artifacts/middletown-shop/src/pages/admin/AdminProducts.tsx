import { useState, useEffect, useRef } from "react";
import { getProducts, createProduct, updateProduct, deleteProduct } from "@/lib/firestore";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { Product } from "@/lib/types";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, ImagePlus, X, Eye, EyeOff } from "lucide-react";

const CATEGORIES = ["physical", "digital", "data", "airtime", "utility", "service"] as const;
const EMPTY_FORM = {
  name: "", description: "", category: "physical" as Product["category"],
  price: 0, stock: 0, enabled: true, featured: false,
  images: [] as string[], deliveryOptions: [] as string[],
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deliveryInput, setDeliveryInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    getProducts().then(setProducts).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setForm({ ...EMPTY_FORM });
    setEditId(null);
    setDeliveryInput("");
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setForm({
      name: p.name, description: p.description, category: p.category,
      price: p.price, stock: p.stock, enabled: p.enabled, featured: p.featured,
      images: [...p.images], deliveryOptions: [...(p.deliveryOptions || [])],
    });
    setEditId(p.id);
    setDeliveryInput("");
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const storageRef = ref(storage, `products/${Date.now()}-${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        urls.push(url);
      }
      setForm(f => ({ ...f, images: [...f.images, ...urls] }));
      toast.success(`${urls.length} image(s) uploaded`);
    } catch {
      toast.error("Image upload failed. Check Firebase Storage rules.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeImage = (url: string) => setForm(f => ({ ...f, images: f.images.filter(i => i !== url) }));
  const addDelivery = () => {
    if (!deliveryInput.trim()) return;
    setForm(f => ({ ...f, deliveryOptions: [...f.deliveryOptions, deliveryInput.trim()] }));
    setDeliveryInput("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || form.price <= 0) { toast.error("Name and valid price are required"); return; }
    setSaving(true);
    try {
      if (editId) {
        await updateProduct(editId, form);
        toast.success("Product updated");
      } else {
        await createProduct(form);
        toast.success("Product created");
      }
      setShowForm(false);
      load();
    } catch {
      toast.error("Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteProduct(id);
      toast.success("Product deleted");
      load();
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleToggle = async (p: Product) => {
    try {
      await updateProduct(p.id, { enabled: !p.enabled });
      toast.success(p.enabled ? "Product disabled" : "Product enabled");
      load();
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Product Management</h1>
        <button onClick={openAdd} data-testid="button-add-product"
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Product</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Category</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Price</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Stock</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Status</th>
                <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-border">
                    <td colSpan={6} className="px-5 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">No products yet. Add your first product.</td></tr>
              ) : products.map(p => (
                <tr key={p.id} data-testid={`product-row-${p.id}`} className="border-t border-border hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img src={(p.images || [])[0] || "https://placehold.co/40x40/e2e8f0/64748b?text=No+Img"} alt={p.name}
                        className="w-10 h-10 object-cover rounded-lg border border-border flex-shrink-0" />
                      <div>
                        <p className="font-medium text-foreground line-clamp-1">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{(p.images || []).length} image(s)</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="capitalize text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{p.category}</span>
                  </td>
                  <td className="px-5 py-3 font-semibold text-foreground">₵{Number(p.price || 0).toLocaleString("en-GH")}</td>
                  <td className="px-5 py-3 text-foreground">{p.stock}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${p.enabled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {p.enabled ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleToggle(p)} title={p.enabled ? "Disable" : "Enable"}
                        className="p-1.5 text-muted-foreground hover:text-foreground rounded transition-colors">
                        {p.enabled ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button onClick={() => openEdit(p)} data-testid={`button-edit-${p.id}`}
                        className="p-1.5 text-muted-foreground hover:text-primary rounded transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(p.id, p.name)} data-testid={`button-delete-${p.id}`}
                        className="p-1.5 text-muted-foreground hover:text-destructive rounded transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">{editId ? "Edit Product" : "Add New Product"}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1">Product Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required data-testid="input-product-name"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Category *</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as Product["category"] }))} data-testid="select-product-category"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white">
                    {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Price (₵) *</label>
                  <input type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} required data-testid="input-product-price"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Stock Quantity</label>
                  <input type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))} data-testid="input-product-stock"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.enabled} onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))} className="w-4 h-4 rounded" />
                    <span className="text-sm font-medium text-foreground">Enabled</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} className="w-4 h-4 rounded" />
                    <span className="text-sm font-medium text-foreground">Featured</span>
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} data-testid="input-product-description"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" />
                </div>
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Product Images</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.images.map((img, i) => (
                    <div key={i} className="relative w-16 h-16">
                      <img src={img} alt="" className="w-full h-full object-cover rounded-lg border border-border" />
                      <button type="button" onClick={() => removeImage(img)} className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-white rounded-full flex items-center justify-center">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                    className="w-16 h-16 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center hover:border-primary transition-colors text-muted-foreground hover:text-primary disabled:opacity-50">
                    {uploading ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <ImagePlus className="w-5 h-5" />}
                  </button>
                </div>
                <input ref={fileRef} type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                <p className="text-xs text-muted-foreground">Images uploaded to Firebase Storage</p>
              </div>

              {/* Delivery options */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Delivery Options</label>
                <div className="flex gap-2 mb-2">
                  <input value={deliveryInput} onChange={e => setDeliveryInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addDelivery(); } }}
                    placeholder="e.g. Standard delivery, Express, Pickup"
                    className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                  <button type="button" onClick={addDelivery} className="px-3 py-2 bg-primary text-white rounded-lg text-sm">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.deliveryOptions.map((opt, i) => (
                    <span key={i} className="flex items-center gap-1 bg-muted text-foreground text-xs px-2 py-1 rounded-lg">
                      {opt}
                      <button type="button" onClick={() => setForm(f => ({ ...f, deliveryOptions: f.deliveryOptions.filter((_, j) => j !== i) }))}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} data-testid="button-save-product"
                  className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {saving ? "Saving..." : editId ? "Update Product" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
