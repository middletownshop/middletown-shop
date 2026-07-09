import { useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { WHEEL_PRIZES } from "@/lib/games/prizes";

interface SpinWheelProps {
  rotation: number;
  spinning: boolean;
  canSpin: boolean;
  spinLabel: string;
  onSpin: () => void;
  onComplete?: () => void;
}

const SIZE = 360;
const RADIUS = 165;
const CENTER = SIZE / 2;
const SEGMENT_ANGLE = 360 / WHEEL_PRIZES.length;

function polarToXY(angleDeg: number, radius: number) {
  const rad = (Math.PI / 180) * angleDeg;
  return {
    x: CENTER + radius * Math.cos(rad),
    y: CENTER + radius * Math.sin(rad),
  };
}

export default function SpinWheel({
  rotation,
  spinning,
  canSpin,
  spinLabel,
  onSpin,
  onComplete,
}: SpinWheelProps) {
  const controls = useAnimation();

  useEffect(() => {
    if (!spinning) return;

    controls
      .start({
        rotate: rotation,
        transition: {
          duration: 5,
          ease: [0.17, 0.67, 0.12, 0.99],
        },
      })
      .then(() => onComplete?.());
  }, [rotation, spinning, controls, onComplete]);

  return (
    <div className="relative mx-auto" style={{ width: SIZE, height: SIZE }}>

      {/* Outer glow ring */}
      <div
        className={`absolute inset-0 rounded-full transition-all duration-500 ${
          spinning
            ? "shadow-[0_0_40px_rgba(251,191,36,0.7),0_0_80px_rgba(251,191,36,0.3)]"
            : "shadow-[0_0_20px_rgba(251,191,36,0.3)]"
        }`}
      />

      {/* Gold outer ring */}
      <motion.div
        className="absolute inset-1 rounded-full border-4 border-yellow-300 pointer-events-none z-10"
        animate={{
          opacity: [0.5, 1, 0.5],
          scale: [1, 1.01, 1],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
        }}
      />

      {/* Pointer */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 -top-3 z-30"
        animate={{
          y: [0, -4, 0],
        }}
        transition={{
          duration: .4,
          repeat: Infinity,
        }}
      >
        <div
          className="w-0 h-0
            border-l-[16px] border-r-[16px] border-t-[32px]
            border-l-transparent border-r-transparent border-t-amber-400
            drop-shadow-[0_2px_8px_rgba(251,191,36,0.8)]"
        />
        </motion.div>

      {/* Wheel */}
      <motion.svg
        width={SIZE}
        height={SIZE}
        animate={
          spinning
            ? controls
            : {
                rotate: 360,
                transition: {
                  duration: 35,
                  ease: "linear",
                  repeat: Infinity,
                },
              }
        }
        initial={{ rotate: 0 }}
        className={`relative z-0 ${spinning ? "animate-pulse" : ""}`}
        style={{ filter: spinning ? "brightness(1.1)" : "brightness(1)" }}
      >
        {/* Segment slices */}
        {WHEEL_PRIZES.map((prize, index) => {
          const startAngle = index * SEGMENT_ANGLE - 90;
          const endAngle = startAngle + SEGMENT_ANGLE;
          const { x: startX, y: startY } = polarToXY(startAngle, RADIUS);
          const { x: endX, y: endY } = polarToXY(endAngle, RADIUS);
          const textAngle = startAngle + SEGMENT_ANGLE / 2;
          const { x: textX, y: textY } = polarToXY(textAngle, RADIUS * 0.62);

          const path = `
            M ${CENTER} ${CENTER}
            L ${startX} ${startY}
            A ${RADIUS} ${RADIUS} 0 0 1 ${endX} ${endY}
            Z
          `;

          const lines = prize.title.split("\n");

          return (
            <g key={prize.id}>
              <path
                d={path}
                fill={prize.color}
                stroke="rgba(251,191,36,0.3)"
                strokeWidth={1.5}
              />
              <text
                x={textX}
                y={textY}
                fill="#fef3c7"
                fontSize={lines.length > 1 ? 9 : 10}
                fontWeight="700"
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${textAngle + 90} ${textX} ${textY})`}
              >
                {lines.map((line, i) => (
                  <tspan key={i} x={textX} dy={i === 0 ? 0 : 12}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}

        {/* Inner dark ring */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={52}
          fill="#0f0f1a"
          stroke="rgba(251,191,36,0.5)"
          strokeWidth={3}
        />
      </motion.svg>

      {/* Center SPIN button — sits above SVG hub */}
      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
        <motion.button
          onClick={onSpin}
        disabled={!canSpin || spinning}
          whileHover={canSpin && !spinning ? { scale: 1.05 } : {}}
          whileTap={canSpin && !spinning ? { scale: 0.95 } : {}}
          className={`
            pointer-events-auto
            w-[88px] h-[88px] rounded-full
            font-extrabold text-sm tracking-wider
            flex flex-col items-center justify-center
            transition-all duration-200
            ${canSpin && !spinning
              ? "bg-gradient-to-br from-amber-400 to-amber-600 text-gray-900 shadow-[0_0_20px_rgba(251,191,36,0.6)] cursor-pointer"
              : "bg-gray-700 text-gray-400 cursor-not-allowed"
            }
          `}
        >
          <motion.span
            className="text-2xl"
            animate={{
              rotate: [-10, 10, -10],
            }}
            transition={{
              duration: .5,
              repeat: Infinity,
            }}
          >
            🎰
          </motion.span>
          <span className="mt-0.5">{spinning ? "..." : "SPIN"}</span>
        </motion.button>
      </div>
    </div>
  );
}