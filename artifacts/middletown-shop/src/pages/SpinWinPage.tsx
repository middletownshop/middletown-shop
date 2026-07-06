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

export default function SpinWinPage() {
  const { userProfile, refreshProfile } = useAuth();

  const [timeLeft, setTimeLeft] = useState("Loading...");
  const [canSpin, setCanSpin] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [wonPrize, setWonPrize] = useState<WheelPrize | null>(null);
  const [winners, setWinners] = useState<any[]>([]);
  
  const handleSpin = () => {
    if (spinning) return;

    const spins = userProfile?.availableSpins ?? 0;

    if (!canSpin && spins <= 0) {
      return;
    }

    const prize = pickPrize();

    setWonPrize(prize);

    const rotate = calculateRotation(prize.id);

    setRotation(rotate);

    setSpinning(true);
  };
  
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
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50">

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

            <p className="mt-3 text-white/90 max-w-xl">
              Spin once every day and win amazing rewards like
              Data Bundles, Wallet Bonuses, Coupons and Reward
              Points.
            </p>

          </motion.div>

        </div>

      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* Reward Cards */}

        <div className="grid md:grid-cols-4 gap-5 mb-10">

          <RewardCard
            icon={<Gift className="w-8 h-8" />}
            title="Data Bundle"
            value="Up to 2GB"
          />

          <RewardCard
            icon={<Coins className="w-8 h-8" />}
            title="Wallet Bonus"
            value="GH₵1 - GH₵20"
          />

          <RewardCard
            icon={<Sparkles className="w-8 h-8" />}
            title="Coupons"
            value="5% - 30%"
          />

          <RewardCard
            icon={<Trophy className="w-8 h-8" />}
            title="Reward Points"
            value="10 - 500"
          />

        </div>

        {/* Main Area */}

        <div className="grid lg:grid-cols-3 gap-8">

          {/* Wheel Placeholder */}

          <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl p-8">

            <div className="flex justify-center">
              <SpinWheel
                rotation={rotation}
                spinning={spinning}
                onComplete={async () => {
                  setSpinning(false);

                  // Show reward immediately
                  setPopupOpen(true);

                  if (userProfile && wonPrize) {
                    try {
                      await saveSpinResult(userProfile.uid, wonPrize);
                      await useAvailableSpin(userProfile.uid);
                      await refreshProfile();

                      const latest = await getLatestSpinWinners();
                      setWinners(latest);

                    } catch (err) {
                      console.error(err);
                    }
                  }
                }}
              />
            </div>
            
            <div className="mt-10 flex justify-center">
              <button
                onClick={handleSpin}
                disabled={!canSpin || spinning}
                className={`px-10 py-4 rounded-full text-lg font-bold transition-all ${
                  canSpin
                    ? "bg-orange-500 hover:bg-orange-600 text-white"
                    : "bg-gray-300 text-gray-600 cursor-not-allowed"
                }`}
              >
                {spinning
                  ? "Spinning..."
                  : canSpin
                  ? "🎡 SPIN NOW"
                  : "Come Back Tomorrow"}
              </button>
            </div>

          </div>

          {/* Sidebar */}

          <div className="space-y-6">

            <div className="bg-white rounded-2xl shadow-lg p-6">

              <div className="flex items-center gap-3">
                <Clock className="text-orange-500" />
                <h3 className="font-bold">Next Free Spin</h3>
              </div>

              <p className="text-3xl font-bold mt-5">
                {timeLeft}
              </p>

              <div className="mt-6 border-t pt-4">

                <p className="text-sm text-gray-500">
                  Available Spins
                </p>

                <p className="text-2xl font-bold text-orange-600">
                  🎡 {userProfile?.availableSpins ?? 1}
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