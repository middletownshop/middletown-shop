import { useState } from "react";
import {
  doc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  CheckCircle,
  Handshake,
  TrendingUp,
  Users,
  DollarSign,
} from "lucide-react";

const BENEFITS = [
  {
    icon: <DollarSign className="w-5 h-5 text-green-600" />,
    title: "Earn Commissions",
    desc: "Earn commissions from every successful bundle sale.",
  },
  {
    icon: <TrendingUp className="w-5 h-5 text-blue-600" />,
    title: "Increase Income",
    desc: "Grow your monthly income through customer referrals.",
  },
  {
    icon: <Users className="w-5 h-5 text-purple-600" />,
    title: "Build Your Network",
    desc: "Invite more customers and expand your business.",
  },
  {
    icon: <Handshake className="w-5 h-5 text-orange-600" />,
    title: "Agent Support",
    desc: "Receive dedicated support from Middletown Shop.",
  },
];

export default function BecomeAgentPage() {
  const { user, userProfile, refreshProfile } = useAuth();

  const isAgent =
    userProfile?.role === "agent" ||
    userProfile?.role === "admin";

  const [loading, setLoading] = useState(false);

  const AGENT_FEE = 100;

  const handleBecomeAgent = async () => {
    if (!user || !userProfile) return;

    if ((userProfile.walletBalance || 0) < AGENT_FEE) {
      toast.error("Insufficient wallet balance");
      return;
    }

    try {
      setLoading(true);

      const agentCode =
        "AGT-" +
        Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase();

      await updateDoc(doc(db, "users", user.uid), {
        role: "agent",
        agentCode,
        walletBalance:
          (userProfile.walletBalance || 0) - AGENT_FEE,
      });

      await addDoc(collection(db, "transactions"), {
        uid: user.uid,
        type: "agent_registration",
        amount: AGENT_FEE,
        status: "success",
        note: "Agent registration fee",
        createdAt: serverTimestamp(),
      });

      await refreshProfile();

      toast.success("Congratulations! You are now an agent.");

      window.location.href = "/agent/dashboard";

    } catch (error) {
      console.error("Agent registration error:", error);

      toast.error("Failed to become an agent");
    } finally {
      setLoading(false);
    }
  };
  
  // Already an agent
  if (isAgent) {
    return (
      <div className="p-4 md:p-6 max-w-xl mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">

          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />

          <h2 className="text-2xl font-bold mb-2">
            You're an Agent!
          </h2>

          <p className="text-muted-foreground mb-2">
            Your Agent Code
          </p>

          <div className="bg-white border border-green-300 rounded-xl px-6 py-3 inline-block mb-4">
            <span className="text-2xl font-black text-primary font-mono">
              {userProfile?.agentCode || "N/A"}
            </span>
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            Share your agent code to earn commissions.
          </p>

          <a
            href="/agent/dashboard"
            className="inline-block bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90"
          >
            Open Agent Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Become Agent Page
  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6">

      <div className="mb-6">
        <div className="flex items-center gap-2">

          <Handshake className="w-7 h-7 text-primary" />

          <h1 className="text-3xl font-bold">
            Become an Agent
          </h1>

        </div>

        <p className="text-muted-foreground mt-2">
          Pay a one-time fee and start earning commissions instantly.
        </p>
      </div>

      {/* Benefits */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">

        {BENEFITS.map((benefit) => (

          <div
            key={benefit.title}
            className="border rounded-xl p-4 bg-white"
          >

            <div className="mb-3">
              {benefit.icon}
            </div>

            <h3 className="font-bold mb-1">
              {benefit.title}
            </h3>

            <p className="text-sm text-muted-foreground">
              {benefit.desc}
            </p>

          </div>

        ))}

      </div>

      {/* Registration Fee */}

      <div className="border rounded-2xl p-6 bg-yellow-50 border-yellow-200 mb-6">

        <p className="text-sm text-muted-foreground">
          Registration Fee
        </p>

        <h2 className="text-4xl font-black text-yellow-700 mt-2">
          GHS 20
        </h2>

        <p className="text-sm mt-2 text-muted-foreground">
          One-time payment.
        </p>

      </div>

      {/* Wallet */}

      <div className="border rounded-2xl p-6 mb-6">

        <p className="text-sm text-muted-foreground">
          Wallet Balance
        </p>

        <h2 className="text-3xl font-black mt-2 text-green-600">
          GHS {Number(userProfile?.walletBalance || 0).toFixed(2)}
        </h2>

      </div>

      {/* Button */}

      <button
        onClick={handleBecomeAgent}
        disabled={loading}
        className="w-full h-12 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          "Become Agent Now"
        )}
      </button>

      </div>
      );
      }