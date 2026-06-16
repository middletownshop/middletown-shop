import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createUserProfile, getUserProfile } from "@/lib/firestore";
import toast from "react-hot-toast";
import { Eye, EyeOff, Mail, Lock, User, ShoppingBag } from "lucide-react";

type Tab = "login" | "register" | "reset";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";
  const initialTab = new URLSearchParams(location.search).get("tab") === "register" ? "register" : "login";

  const [tab, setTab] = useState<Tab>(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Welcome back!");
      navigate(from, { replace: true });
    } catch (err: any) {
      toast.error(err.message?.includes("wrong-password") ? "Invalid password" : err.message?.includes("user-not-found") ? "Account not found" : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) return;
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await createUserProfile(cred.user.uid, { email, displayName: name, uid: cred.user.uid, photoURL: "" });
      toast.success("Account created! Welcome to Middletown Shop.");
      navigate(from, { replace: true });
    } catch (err: any) {
      toast.error(err.message?.includes("email-already-in-use") ? "Email already registered" : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent! Check your inbox.");
      setTab("login");
    } catch {
      toast.error("Failed to send reset email. Check the email address.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-700 to-blue-900 text-white flex-col justify-center px-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
            <ShoppingBag className="w-7 h-7 text-blue-700" />
          </div>
          <span className="text-2xl font-bold">Middletown Shop</span>
        </div>
        <h2 className="text-4xl font-bold mb-4 leading-tight">Ghana's Trusted Marketplace</h2>
        <p className="text-blue-200 text-lg mb-8">Physical products, digital services, data bundles, airtime, and more — all in one place.</p>
        <div className="space-y-4">
          {[
            { title: "Secure Payments", desc: "Powered by Paystack — Ghana's leading payment gateway" },
            { title: "Fast Delivery", desc: "Real-time order tracking from dispatch to doorstep" },
            { title: "Instant Digital Delivery", desc: "Digital products delivered immediately after payment" },
          ].map(f => (
            <div key={f.title} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">{f.title}</p>
                <p className="text-blue-200 text-sm">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-bold text-xl text-primary">Middletown Shop</span>
          </div>

          {/* Tabs */}
          {tab !== "reset" && (
            <div className="flex border border-border rounded-lg p-1 mb-6 bg-muted">
              <button
                onClick={() => setTab("login")}
                data-testid="tab-login"
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${tab === "login" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                Sign In
              </button>
              <button
                onClick={() => setTab("register")}
                data-testid="tab-register"
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${tab === "register" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                Create Account
              </button>
            </div>
          )}

          {tab === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-1">Welcome back</h1>
                <p className="text-muted-foreground text-sm">Sign in to your account to continue</p>
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" required data-testid="input-email"
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required data-testid="input-password"
                  className="w-full pl-10 pr-10 py-3 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={() => setTab("reset")} className="text-primary text-sm hover:underline">Forgot password?</button>
              </div>
              <button type="submit" disabled={loading} data-testid="button-login"
                className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50">
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          )}

          {tab === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-1">Create account</h1>
                <p className="text-muted-foreground text-sm">Join Middletown Shop today — it's free</p>
              </div>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full name" required data-testid="input-name"
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" required data-testid="input-email-register"
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (min 6 characters)" required data-testid="input-password-register"
                  className="w-full pl-10 pr-10 py-3 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button type="submit" disabled={loading} data-testid="button-register"
                className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50">
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>
          )}

          {tab === "reset" && (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-1">Reset password</h1>
                <p className="text-muted-foreground text-sm">Enter your email and we'll send a reset link</p>
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" required data-testid="input-email-reset"
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              </div>
              <button type="submit" disabled={loading} data-testid="button-reset"
                className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50">
                {loading ? "Sending..." : "Send Reset Email"}
              </button>
              <button type="button" onClick={() => setTab("login")} className="w-full text-muted-foreground text-sm hover:text-foreground text-center">
                Back to sign in
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
