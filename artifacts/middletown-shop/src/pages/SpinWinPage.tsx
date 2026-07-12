import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Gift,
  Trophy,
  Clock,
  Coins,
  Sparkles,
  Volume2,
  VolumeX,
  Wallet
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import SpinWheel from "@/components/games/SpinWheel";
import {
  pickPrize,
  calculateRotation,
} from "@/lib/games/spinLogic";
import RewardPopup from "@/components/games/RewardPopup";
import { WheelPrize } from "@/types/game";
import {
  saveSpinResult,
  getLatestSpinWinners, useAvailableSpin,
} from "@/lib/firestore";
import {
  playClick,
  playSpin,
  stopSpin,
  playWin,
  playLose,
  playBackground,
  stopBackground,
} from "@/lib/games/sounds";
import { doc, runTransaction, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";

export default function SpinWinPage() {
  const { userProfile, refreshProfile } = useAuth();

  const [timeLeft, setTimeLeft] = useState("00:00:00");
  const [canSpin, setCanSpin] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [spinLocked, setSpinLocked] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [wonPrize, setWonPrize] = useState<WheelPrize | null>(null);
  const [winners, setWinners] = useState<any[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const prizeRef = useRef<WheelPrize | null>(null);

  const SPIN_PACKAGES = [
    { spins: 1, price: 1 },
    { spins: 3, price: 2.5 },
    { spins: 10, price: 7 },
    { spins: 20, price: 12 },
  ];

  const [selectedPackage, setSelectedPackage] = useState<{
    spins: number;
    price: number;
  } | null>(null);

  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [buyingSpins, setBuyingSpins] = useState(false);
  const [localSpins, setLocalSpins] = useState(
    userProfile?.availableSpins ?? 0
  );

  useEffect(() => {
    setLocalSpins(userProfile?.availableSpins ?? 0);
  }, [userProfile?.availableSpins]);

  useEffect(() => {
    if (!isMuted) {
      playBackground();
    } else {
      stopBackground();
    }
    return () => {
      stopBackground();
    };
  }, [isMuted]);

  const handleSpin = async () => {
    if (spinning || spinLocked) return;
    playClick();
    const spins = userProfile?.availableSpins ?? 0;
    if (spins <= 0) {
        toast.error("No spins available.");
        return;
    }

    const prize = pickPrize();
    prizeRef.current = prize;
    setWonPrize(prize);
    setLocalSpins(prev => prev - 1);

    if (userProfile) {
      await useAvailableSpin(userProfile.uid);
    }

    const newRotation = calculateRotation(prize, rotation);
    setRotation(newRotation);
    setSpinLocked(true);
    setSpinning(true);
    playSpin();
  };

  async function buySpinsWithWallet() {
    if (!userProfile || !selectedPackage) return;
    setBuyingSpins(true);

    try {
      const userRef = doc(db, "users", userProfile.uid);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(userRef);
        if (!snap.exists()) throw new Error("User not found");
        const data = snap.data();
        const balance = Number(data.walletBalance || 0);

        if (balance < selectedPackage.price) {
          throw new Error("Insufficient wallet balance");
        }

        tx.update(userRef, {
          walletBalance: balance - selectedPackage.price,
          availableSpins: Number(data.availableSpins || 0) + selectedPackage.spins,
        });
      });

      await addDoc(collection(db, "spinPurchases"), {
        userId: userProfile.uid,
        userName: userProfile.displayName || userProfile.email || "Unknown User",
        userEmail: userProfile.email || "",
        spins: selectedPackage.spins,
        amount: selectedPackage.price,
        paymentMethod: "wallet",
        createdAt: serverTimestamp(),
      });

      await refreshProfile();
      setCanSpin(true);
      setShowPurchaseModal(false);
      setSelectedPackage(null);
      toast.success(`${selectedPackage.spins} spins added!`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBuyingSpins(false);
    }
  }

  useEffect(() => {
    const updateCountdown = () => {
      if (!userProfile?.lastSpin) {
        setCanSpin(true);
        setTimeLeft("Ready!");
        return;
      }

      const last = userProfile.lastSpin.seconds
        ? userProfile.lastSpin.seconds * 1000
        : new Date(userProfile.lastSpin).getTime();

      const next = last + 24 * 60 * 60 * 1000;
      const diff = next - Date.now();
      const availableSpins = userProfile?.availableSpins ?? 0;

      if (availableSpins > 0 || diff <= 0) {
        setCanSpin(true);
        setTimeLeft("Ready!");
        return;
      }

      setCanSpin(false);
      const hours = String(Math.floor(diff / 3600000)).padStart(2, "0");
      const minutes = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
      const seconds = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
      setTimeLeft(`${hours}:${minutes}:${seconds}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [userProfile]);

  return (
    <div className="relative min-h-screen w-full bg-[#090514] flex justify-center items-center font-sans selection:bg-amber-500/30">

      {/* Immersive background decoration for desktop views */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(76,29,149,0.2)_0%,rgba(15,23,42,1)_100%)] z-0" />

      {/* CASINO MOBILE FRAME CONTAINER */}
      <div className="relative z-10 w-full h-screen sm:h-[840px] sm:w-[410px] bg-gradient-to-b from-[#1a0b2e] via-[#120720] to-[#0a0314] sm:rounded-[40px] sm:shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_0_12px_#26193c] overflow-y-auto overflow-x-hidden flex flex-col justify-between scrollbar-none">

        {/* TOP BAR / HEADER */}
        <div className="sticky top-0 z-30 bg-[#1a0b2e]/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-purple-900/30">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎰</span>
            <h1 className="text-sm font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500">
              SPIN & WIN
            </h1>
          </div>

          {/* User balances */}
          <div className="flex items-center gap-2">
            <div className="bg-purple-950/60 border border-purple-500/20 rounded-full py-1 px-2.5 flex items-center gap-1.5 shadow-inner">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400">
                ₵{Number(userProfile?.walletBalance || 0).toFixed(1)}
              </span>
            </div>

            <button 
              onClick={() => setIsMuted(!isMuted)} 
              className="p-1.5 rounded-full bg-purple-900/40 border border-purple-500/20 text-purple-300 hover:text-white"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* COMPACT HERO DECK */}
        <div className="px-4 pt-4 text-center">
          <div className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-3 shadow-lg">
            <div className="flex items-center justify-center gap-1 text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">
              <Sparkles className="w-3 h-3 animate-spin" /> Daily Lucky Draw <Sparkles className="w-3 h-3 animate-spin" />
            </div>
            <p className="text-[11px] text-purple-200/80 leading-tight">
              Spin the gold wheel to win vouchers, premium reward milestones, or instant multipliers!
            </p>
          </div>
        </div>

        {/* MAIN GAME HUBLIST / THE WHEEL */}
        <div className="flex-1 flex flex-col justify-center items-center py-4 relative">
          <div className="scale-90 sm:scale-95 transition-transform origin-center">
            <SpinWheel
              rotation={rotation}
              spinning={spinning}
              canSpin={!spinning && localSpins > 0}
              spinLabel={spinning ? "..." : "SPIN"}
              onSpin={handleSpin}
              onComplete={async () => {
                stopSpin();

                // 1. Instantly release the local animations
                setSpinning(false);
                setSpinLocked(false);

                const prize = prizeRef.current;
                if (!prize) return;

                console.log("FINAL PRIZE", prize.id, prize.title);

                setWonPrize(prize);
                setPopupOpen(true);

                if (prize.type === "lose") {
                  playLose();
                } else {
                  playWin();
                }

                // 🔥 CRITICAL FIX: If they won a Free Spin, instantly increment 
                // the local state so the button unlocks right away!
                if (prize.type === "spin") {
                  setLocalSpins(prev => prev + 1);
                  setCanSpin(true);
                  setTimeLeft("Ready!");
                }

                if (userProfile) {
                  try {
                    // 2. Sync to the backend database in the background
                    await saveSpinResult(userProfile.uid, prize);

                    // 3. Pull down fresh profile properties
                    await refreshProfile();

                    const latest = await getLatestSpinWinners();
                    setWinners(latest);
                  } catch (error) {
                    console.error("Failed to sync win to database:", error);
                  }
                }
              }}
            />
          </div>

          {/* QUICK HUD: REMAINING SPINS */}
          <div className="mt-2 text-center z-10">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black px-4 py-1.5 rounded-full text-xs tracking-wider shadow-[0_4px_20px_rgba(245,158,11,0.4)]">
              <span>🎡 {localSpins} SPINS LEFT</span>
            </div>
            {localSpins === 0 && (
              <p className="text-[11px] text-amber-400/80 mt-1.5 font-medium animate-pulse">
                Next Free Spin: {timeLeft}
              </p>
            )}
          </div>
        </div>

        {/* LOWER SECTION: ACTIONS & STORE */}
        <div className="px-4 pb-6 space-y-4">

          {/* BUY TICKETS TABS */}
          <div className="bg-purple-950/40 border border-purple-900/40 rounded-2xl p-3">
            <h3 className="text-xs font-black text-purple-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>🛒</span> Buy Extra Spins
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {SPIN_PACKAGES.slice(0, 4).map((pack) => (
                <button
                  key={pack.spins}
                  onClick={() => {
                    playClick();
                    setSelectedPackage(pack);
                    setShowPurchaseModal(true);
                  }}
                  className="bg-[#23133d] border border-purple-500/20 hover:border-amber-400/50 p-2 rounded-xl flex items-center justify-between transition-all active:scale-95 text-left"
                >
                  <div>
                    <p className="text-xs font-black text-white">{pack.spins} Spin{pack.spins > 1 ? "s" : ""}</p>
                    <p className="text-[9px] text-gray-400">Instant credit</p>
                  </div>
                  <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                    ₵{pack.price}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* RECENT LIVE WINNERS TICKER */}
          <div className="bg-[#0e071a] rounded-xl p-2.5 border border-purple-950/60">
            <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Live Winners
            </div>
            <div className="h-12 overflow-y-auto space-y-1 pr-1 text-[11px] text-gray-300">
              {winners.length === 0 ? (
                <p className="text-gray-500 text-center py-2">Waiting for next spin entry...</p>
              ) : (
                winners.map((winner) => (
                  <div key={winner.id} className="flex justify-between items-center bg-purple-950/20 px-2 py-0.5 rounded">
                    <span className="truncate max-w-[120px] text-gray-400">{winner.name}</span>
                    <span className="font-bold text-amber-400">{winner.prize}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* MODAL WINDOWS CONTROLS */}
      {showPurchaseModal && selectedPackage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1c0d35] border border-purple-500/30 rounded-3xl p-6 w-full max-w-[340px] text-white shadow-2xl">
            <h2 className="text-lg font-black text-center mb-1">Confirm Purchase</h2>
            <p className="text-center text-xs text-gray-400 mb-4">
              Adding {selectedPackage.spins} Spin{selectedPackage.spins > 1 ? "s" : ""} to account
            </p>

            <div className="bg-[#110624] border border-purple-950 rounded-xl p-3 mb-4 text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Total Price</p>
              <p className="text-2xl font-black text-amber-400">₵{selectedPackage.price}</p>
            </div>

            <div className="space-y-2">
              <button
                onClick={buySpinsWithWallet}
                disabled={buyingSpins}
                className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-black py-2.5 rounded-xl text-xs transition-all active:scale-95 disabled:opacity-50"
              >
                {buyingSpins ? "Processing..." : "💳 Pay From Wallet balance"}
              </button>

              <button
                onClick={() => {
                  setShowPurchaseModal(false);
                  setSelectedPackage(null);
                }}
                className="w-full bg-purple-950 border border-purple-500/20 text-gray-300 py-2 rounded-xl text-xs hover:bg-purple-900 transition-all"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      <RewardPopup
        open={popupOpen}
        prize={wonPrize}
        onClose={() => setPopupOpen(false)}
      />
    </div>
  );
}