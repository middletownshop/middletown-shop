import { motion, AnimatePresence } from "framer-motion";
import { WheelPrize } from "@/types/game";

interface RewardPopupProps {
  open: boolean;
  prize: WheelPrize | null;
  onClose: () => void;
}

export default function RewardPopup({
  open,
  prize,
  onClose,
}: RewardPopupProps) {
  if (!prize) return null;

  const isLose = prize.type === "lose";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Background */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Popup */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 px-4"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
            }}
            exit={{
              scale: 0.7,
              opacity: 0,
            }}
          >
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">

              <div className="text-6xl mb-4">
                {isLose ? "😢" : "🎉"}
              </div>

              <h2 className="text-3xl font-bold mb-3">
                {isLose
                  ? "Better Luck Next Time!"
                  : "Congratulations!"}
              </h2>

              <p className="text-lg text-gray-600 mb-6">
                {isLose
                  ? "Come back tomorrow for another free spin."
                  : `You won ${prize.title}`}
              </p>

              <button
                onClick={onClose}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full font-bold"
              >
                Awesome!
              </button>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}