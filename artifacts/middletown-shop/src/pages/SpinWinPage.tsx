import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Gift,
  Trophy,
  Clock,
  Coins,
  Sparkles,
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
  getLatestSpinWinners,useAvailableSpin
} from "@/lib/firestore";
import {
  playClick,
  playSpin,
  stopSpin,
  playWin,
  playLose,playBackground,
    stopBackground,
} from "@/lib/games/sounds";
import { doc, runTransaction, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";

export default function SpinWinPage() {
  const { userProfile, refreshProfile } = useAuth();

  const [timeLeft, setTimeLeft] = useState("Loading...");
  const [canSpin, setCanSpin] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [spinLocked, setSpinLocked] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [wonPrize, setWonPrize] = useState<WheelPrize | null>(null);
  const [winners, setWinners] = useState<any[]>([]);
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
  const [localSpins, setLocalSpins] = useState(0);

  useEffect(() => {
    setLocalSpins(userProfile?.availableSpins ?? 0);
  }, [userProfile?.availableSpins]);
  
  useEffect(() => {
    playBackground();

    return () => {
      stopBackground();
    };
  }, []);
  
  const handleSpin = () => {
    if (spinning || spinLocked) return;
    playClick();
    const spins = localSpins;

    if (spins <= 0) {
      toast.error("No spins available.");
      return;
    }

    // Deduct immediately on the UI
    setLocalSpins(spins - 1);

    const prize = pickPrize();

    setWonPrize(prize);

    const rotate = calculateRotation(prize.id);

    setRotation(rotate);

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

        if (!snap.exists()) {
          throw new Error("User not found");
        }

        const data = snap.data();

        const balance = Number(data.walletBalance || 0);

        if (balance < selectedPackage.price) {
          throw new Error("Insufficient wallet balance");
        }

        
        tx.update(userRef, {
          walletBalance: balance - selectedPackage.price,
          availableSpins:
            Number(data.availableSpins || 0) + selectedPackage.spins,
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
      // Allow the user to spin immediately
      setCanSpin(true);
      setTimeLeft("Ready to Spin");
      setShowPurchaseModal(false);
      setSelectedPackage(null);

      setTimeout(() => {
        document
          .getElementById("spin-wheel")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
      }, 300);
     
      
      toast.success(
        `${selectedPackage.spins} spins added successfully!`
      );

      setShowPurchaseModal(false);
      setSelectedPackage(null);
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
        setTimeLeft("Ready to Spin");
        return;
      }

      
      const last =
        userProfile.lastSpin.seconds
          ? userProfile.lastSpin.seconds * 1000
          : new Date(userProfile.lastSpin).getTime();

      const next = last + 24 * 60 * 60 * 1000;

      const diff = next - Date.now();

      const availableSpins = userProfile?.availableSpins ?? 0;

      if (availableSpins > 0) {
        setCanSpin(true);
        setTimeLeft("Ready to Spin");
        return;
      }

      if (diff <= 0) {
        setCanSpin(true);
        setTimeLeft("Ready to Spin");
        return;
      }

      setCanSpin(false);

      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      setTimeLeft(
        `${hours}h ${minutes}m ${seconds}s`
      );
    };

    updateCountdown();

    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [userProfile]);

  useEffect(() => {
    const loadWinners = async () => {
      try {
        const data = await getLatestSpinWinners();
        setWinners(data);
      } catch (error) {
        console.error("Failed to load winners:", error);
      }
    };

    loadWinners();
  }, []);
  
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#4c1d95] to-[#7c2d12]">

    {/* Animated Background */}
    <div className="absolute inset-0 overflow-hidden">

      <motion.div
        className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-yellow-400/20 blur-3xl"
        animate={{
          x: [0, 120, 0],
          y: [0, 80, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
        }}
      />

      <motion.div
        className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-pink-500/20 blur-3xl"
        animate={{
          x: [0, -120, 0],
          y: [0, -80, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
        }}
      />

    </div>
      
    <div className="relative z-10">
      {Array.from({ length: 25 }).map((_, i) => (

        <motion.div
          key={i}
          className="absolute text-yellow-300 text-xl"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -25, 0],
            opacity: [0.3, 1, 0.3],
            rotate: [0, 360],
          }}
          transition={{
            duration: 2 + Math.random() * 3,
            repeat: Infinity,
          }}
        >
          ✨
        </motion.div>

      ))}
      
      {/* Hero */}

      <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 text-white">

        <div className="max-w-7xl mx-auto px-4 py-12">

          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
          >

            <h1 className="text-4xl font-extrabold flex items-center gap-3">

              🎡 Spin & Win

            </h1>

            <motion.p
              className="mt-3 text-white/90 max-w-xl text-lg"
              animate={{
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            >
              Spin once every day to win exciting Coupons,
              Reward Points and other surprise rewards.
              </motion.p>

          </motion.div>

        </div>

      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* Reward Cards */}

        <div className="grid md:grid-cols-4 gap-5 mb-10">

          <RewardCard
            icon={<Sparkles />}
            title="Coupons"
            value="5% & 10%"
          />

          <RewardCard
            icon={<Trophy />}
            title="Reward Points"
            value="100 - 1000"
          />

          <RewardCard
            icon={<Gift />}
            title="Daily Spin"
            value="1 Free Spin"
          />

          <RewardCard
            icon={<Coins />}
            title="Lucky Chance"
            value="Try Again"
          />
        </div>
        </div>
        {/* Main Area */}

        <div className="grid lg:grid-cols-3 gap-8">

          {/* Wheel Placeholder */}

          <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl p-4 sm:p-6 lg:p-8">

            <div className="flex justify-center">
              <div className="w-full max-w-[320px] sm:max-w-[420px] lg:max-w-[500px] mx-auto">
                <SpinWheel
                  rotation={rotation}
                  spinning={spinning}
                  canSpin={
                    !spinning && (userProfile?.availableSpins ?? 0) > 0
                  }
                  spinLabel={
                    spinning
                      ? "Spinning..."
                      : (userProfile?.availableSpins ?? 0) > 0
                      ? "SPIN"
                      : "Buy Spins"
                  }
                  onSpin={handleSpin}
                  onComplete={async () => {
                    stopSpin();
                    setSpinning(false);

                    setPopupOpen(true);

                    if (wonPrize?.type === "lose") {
                      playLose();
                    } else {
                      playWin();
                    }

                    if (userProfile && wonPrize) {
                      saveSpinResult(userProfile.uid, wonPrize)
                        .then(() => useAvailableSpin(userProfile.uid))
                        .then(() => refreshProfile())
                        .then(async () => {
                          const latest = await getLatestSpinWinners();
                          setWinners(latest);
                        })
                        .catch(console.error);
                    }
                  }}
                />
              </div>
            </div>
           
          </div>

          {/* Sidebar */}

          <div className="space-y-6">

            <div className="bg-white rounded-2xl shadow-lg p-6">

              <div className="flex items-center gap-3">
                <Clock className="text-orange-500" />
                <h3 className="font-bold">Next Free Spin</h3>
              </div>
              <div className="bg-white rounded-2xl shadow-xl p-6 mt-6">

                <h3 className="text-xl font-bold mb-4">
                  🎰 Buy More Spins
                </h3>

                <p className="text-sm text-gray-500 mb-5">
                  Out of spins? Purchase more and keep playing.
                </p>

                <div className="space-y-3">

                  {SPIN_PACKAGES.map((pack) => (

                   <button
                     key={pack.spins}
                     onClick={() => {
                       playClick();
                       setSelectedPackage(pack);
                       setShowPurchaseModal(true);
                     }}
                      className="w-full flex justify-between items-center rounded-xl border p-4 hover:border-orange-500 hover:bg-orange-50 transition"
                    >

                      <div>

                        <p className="font-bold">
                          {pack.spins} Spin{pack.spins > 1 ? "s" : ""}
                        </p>

                        <p className="text-xs text-gray-500">
                          Instant activation
                        </p>

                      </div>

                      <div className="text-right">

                        <p className="font-bold text-orange-600">
                          ₵{pack.price}
                        </p>

                        <p className="text-xs">
                          Buy
                        </p>

                      </div>

                    </button>

                  ))}

                </div>

              </div>
              
              <p className="text-3xl font-bold mt-5">
                {timeLeft}
              </p>

              <div className="mt-6 border-t pt-4">

                <p className="text-sm text-gray-500">
                  Available Spins
                </p>

                <p className="text-2xl font-bold text-orange-600">
                  🎡 {localSpins}
                </p>

              </div>

            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">

              <h3 className="font-bold text-xl mb-4">

                Recent Winners

              </h3>

              <div className="space-y-3">
                {winners.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center">
                    No winners yet today.
                  </p>
                ) : (
                  winners.map((winner) => (
                    <Winner
                      key={winner.id}
                      name={winner.name}
                      prize={winner.prize}
                    />
                  ))
                )}
              </div>

            </div>

          </div>

        </div>

      </div>
      {showPurchaseModal && selectedPackage && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

          <div className="bg-white rounded-3xl p-8 w-[420px] max-w-[95%] shadow-2xl">

            <h2 className="text-2xl font-bold text-center mb-2">
              🎰 Buy More Spins
            </h2>

            <p className="text-center text-gray-500 mb-6">
              {selectedPackage.spins} Spin{selectedPackage.spins > 1 ? "s" : ""}
            </p>

            <div className="bg-orange-50 rounded-xl p-4 mb-6 text-center">

              <p className="text-sm text-gray-500">
                Price
              </p>

              <p className="text-3xl font-bold text-orange-600">
                ₵{selectedPackage.price}
              </p>

              <p className="mt-2 text-sm">
                Wallet Balance
              </p>

              <p className="font-bold">
                ₵{Number(userProfile?.walletBalance || 0).toLocaleString("en-GH")}
              </p>

            </div>

            <button
              onClick={buySpinsWithWallet}
              disabled={buyingSpins}
              className={`w-full py-3 rounded-xl font-bold transition ${
                buyingSpins
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-orange-500 hover:bg-orange-600 text-white"
              }`}
            >
              {buyingSpins ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing Payment...
                </div>
              ) : (
                "💳 Pay with Wallet"
              )}
            </button>

            <button
              onClick={() => {
                setShowPurchaseModal(false);
                setSelectedPackage(null);
              }}
              className="w-full mt-3 border border-gray-300 py-3 rounded-xl hover:bg-gray-100"
            >
              Cancel
            </button>

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

function RewardCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
      <div className="flex justify-center text-orange-500">
        {icon}
      </div>

      <h3 className="font-bold mt-4">
        {title}
      </h3>

      <p className="text-muted-foreground mt-2">
        {value}
      </p>
    </div>
  );
}

function Winner({
  name,
  prize,
}: {
  name: string;
  prize: string;
}) {
  return (
    <div className="flex justify-between border-b pb-2">
      <span>{name}</span>

      <span className="font-semibold text-orange-600">
        {prize}
      </span>
    </div>
  );
}