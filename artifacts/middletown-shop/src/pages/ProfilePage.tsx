import { useState } from "react";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { User, Lock, Save } from "lucide-react";

export default function ProfilePage() {
  const { user, userProfile } = useAuth();
  const [name, setName] = useState(userProfile?.displayName || "");
  const [saving, setSaving] = useState(false);
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [changingPass, setChangingPass] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { displayName: name });
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;
    if (newPass.length < 6) { toast.error("New password must be at least 6 characters"); return; }
    setChangingPass(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, currentPass);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPass);
      toast.success("Password updated successfully");
      setCurrentPass("");
      setNewPass("");
    } catch (err: any) {
      toast.error(err.message?.includes("wrong-password") ? "Current password is incorrect" : "Failed to change password");
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">Profile Settings</h1>
      <div className="space-y-5">
        {/* Profile card */}
        <div className="bg-white border border-border rounded-xl p-6">
          <div className="flex items-center gap-4 mb-6 pb-5 border-b border-border">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="font-bold text-foreground">{userProfile?.displayName || "—"}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${userProfile?.role === "admin" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                {userProfile?.role || "customer"}
              </span>
            </div>
          </div>
          <form onSubmit={handleSaveProfile}>
            <h3 className="font-semibold text-foreground mb-3 text-sm">Personal Information</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} data-testid="input-profile-name"
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                <input value={user?.email || ""} disabled
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-muted text-muted-foreground cursor-not-allowed" />
              </div>
            </div>
            <button type="submit" disabled={saving} data-testid="button-save-profile"
              className="mt-4 flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Password card */}
        <div className="bg-white border border-border rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4" /> Change Password
          </h3>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Current Password</label>
              <input type="password" value={currentPass} onChange={e => setCurrentPass(e.target.value)} required data-testid="input-current-password"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">New Password</label>
              <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} required minLength={6} data-testid="input-new-password"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
            <button type="submit" disabled={changingPass} data-testid="button-change-password"
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
              {changingPass ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>

        {/* Account stats */}
        <div className="bg-white border border-border rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-4">Account Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Wallet Balance</p>
              <p className="text-lg font-bold text-foreground">₦{(userProfile?.walletBalance || 0).toLocaleString()}</p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Account Type</p>
              <p className="text-lg font-bold text-foreground capitalize">{userProfile?.role || "customer"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
