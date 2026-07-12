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
const RADIUS = 168; // Maximum visual boundaries
const CENTER = SIZE / 2;
const SEGMENT_ANGLE = 360 / WHEEL_PRIZES.length;

function polarToXY(angleDeg: number, radius: number) {
  const rad = (Math.PI / 180) * angleDeg;
  return {
    x: CENTER + radius * Math.cos(rad),
    y: CENTER + radius * Math.sin(rad),
  };
}

// Helper to match premium emojis for extra visual appeal
function getPrizeIcon(type: string, value: number): string {
  if (value === 100) return "👑"; // Teaser 100
  if (value === 50 && type === "wallet") return "🔥"; // Teaser 50
  switch (type) {
    case "wallet": return "₵";
    case "points": return "💎";
    case "spin": return "🎫";
    case "coupon": return "🏷️";
    default: return "✨";
  }
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
          ease: [0.15, 0.66, 0.08, 1], // Luxury slot braking curve
        },
      })
      .then(() => {
        onComplete?.();
      });
  }, [spinning, rotation, controls, onComplete]);

  return (
    <div className="relative mx-auto select-none" style={{ width: SIZE, height: SIZE }}>

      {/* LUXURY OUTER GLOW BACKGROUND */}
      <div
        className={`absolute inset-0 rounded-full transition-all duration-700 ${
          spinning
            ? "shadow-[0_0_60px_rgba(234,179,8,0.6),inset_0_0_30px_rgba(234,179,8,0.4)] ring-4 ring-yellow-400/50"
            : "shadow-[0_0_30px_rgba(139,92,246,0.3),inset_0_0_15px_rgba(0,0,0,0.6)] ring-2 ring-purple-900/30"
        }`}
      />

      {/* CASINO BROADWAY LIGHT RIM */}
      <div className="absolute inset-0 rounded-full border-[6px] border-[#1e1136] bg-transparent z-10 pointer-events-none shadow-2xl">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 rounded-full transform -translate-x-1/2 -translate-y-1/2 ${
              spinning ? "animate-pulse bg-yellow-300 shadow-[0_0_8px_#facc15]" : "bg-yellow-100/70"
            }`}
            style={{
              left: `${CENTER + (RADIUS + 4) * Math.cos((i * 30 * Math.PI) / 180)}px`,
              top: `${CENTER + (RADIUS + 4) * Math.sin((i * 30 * Math.PI) / 180)}px`,
              animationDelay: `${i * 100}ms`
            }}
          />
        ))}
      </div>

      {/* TOP RETAINING INDICATOR NEEDLE */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 -top-4 z-30 filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)]"
        animate={spinning ? { rotate: [0, -12, 4, -8, 2, 0] } : {}}
        transition={{ repeat: spinning ? Infinity : 0, duration: 0.25 }}
      >
        <div className="w-0 h-0 border-l-[18px] border-r-[18px] border-t-[38px] border-l-transparent border-r-transparent border-t-amber-400 rounded-t-sm" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full opacity-60 blur-[1px]" />
      </motion.div>

      {/* MAIN SVG ENGINE */}
      <motion.svg
        width={SIZE}
        height={SIZE}
        animate={controls}
        initial={{ rotate: 0 }}
        className="relative z-0 overflow-visible rounded-full bg-[#0d061a]"
      >
        <defs>
          <filter id="premium-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="1" floodColor="#000000" floodOpacity="0.95" />
          </filter>

          {/* GENERATE CURVED INVISIBLE TRACKS FOR ARCHED TEXT ACCENTS */}
          {WHEEL_PRIZES.map((prize, index) => {
            const angle = index * SEGMENT_ANGLE + SEGMENT_ANGLE / 2 - 90;
            const textArcRadius = RADIUS * 0.82; // Perfectly hugs outer perimeter

            const radStart = (Math.PI / 180) * (angle - SEGMENT_ANGLE / 2 + 3);
            const radEnd = (Math.PI / 180) * (angle + SEGMENT_ANGLE / 2 - 3);

            const x1 = CENTER + textArcRadius * Math.cos(radStart);
            const y1 = CENTER + textArcRadius * Math.sin(radStart);
            const x2 = CENTER + textArcRadius * Math.cos(radEnd);
            const y2 = CENTER + textArcRadius * Math.sin(radEnd);

            return (
              <path
                key={`path-${prize.id}`}
                id={`textPath-${prize.id}`}
                d={`M ${x1} ${y1} A ${textArcRadius} ${textArcRadius} 0 0 1 ${x2} ${y2}`}
                fill="none"
              />
            );
          })}
        </defs>

        {/* RENDERING SECTIONS LOOP */}
        {WHEEL_PRIZES.map((prize, index) => {
          const startAngle = index * SEGMENT_ANGLE - 90;
          const endAngle = startAngle + SEGMENT_ANGLE;
          const { x: startX, y: startY } = polarToXY(startAngle, RADIUS);
          const { x: endX, y: endY } = polarToXY(endAngle, RADIUS);

          const textAngle = startAngle + SEGMENT_ANGLE / 2;
          const { x: iconX, y: iconY } = polarToXY(textAngle, RADIUS * 0.52); // Drops safely closer to center hub

          const path = `
            M ${CENTER} ${CENTER}
            L ${startX} ${startY}
            A ${RADIUS} ${RADIUS} 0 0 1 ${endX} ${endY}
            Z
          `;

          const isTeaser = prize.probability === 0;
          const cleanTitle = prize.title.replace("\n", " ");

          return (
            <g key={prize.id} className="cursor-pointer">
              {/* Colored Wedge Shape */}
              <path
                d={path}
                fill={prize.color}
                stroke="#1a0b36"
                strokeWidth={2.5}
                className="transition-all duration-300 hover:brightness-110"
              />

              {/* 1. TEXT STYLED ON TOP (Curved beautifully along the rim) */}
              {/* 1. HIGH-CONTRAST PURE WHITE TEXT LAYER */}
              <text
                filter="url(#premium-shadow)"
                fill="#ffffff" // 🔥 Forces all text elements to be stark, clean white
                fontSize={isTeaser ? "12" : "10.5"}
                fontWeight="950" // Extra bold silhouette lines
                fontFamily="system-ui, -apple-system, sans-serif"
                letterSpacing="0.05em"
                style={{ textTransform: "uppercase" }}
              >
                <textPath
                  href={`#textPath-${prize.id}`}
                  startOffset="50%"
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {cleanTitle}
                </textPath>
              </text>

              {/* 2. MATCHING ICON BADGE CENTERED DIRECTLY UNDER THE TEXT */}
              <g 
                transform={`rotate(${textAngle + 90} ${iconX} ${iconY})`}
                filter="url(#premium-shadow)"
              >
                <text
                  x={iconX}
                  y={iconY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={isTeaser ? "22" : "16"}
                >
                  {getPrizeIcon(prize.type, prize.value)}
                </text>
              </g>
            </g>
          );
        })}

        {/* OUTSIDE GOLDEN LIP CHROME RING */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="#facc15"
          strokeWidth={3}
          opacity={0.85}
        />

        {/* INNER DEEP CENTER CORE RING */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={48}
          fill="#090412"
          stroke="#facc15"
          strokeWidth={3}
          filter="drop-shadow(0px 4px 12px rgba(0,0,0,0.7))"
        />
      </motion.svg>

      {/* INDEPENDENT DECK TRIGGER BUTTON BUTTON */}
      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
        <motion.button
          onClick={onSpin}
          disabled={!canSpin || spinning}
          whileHover={canSpin && !spinning ? { scale: 1.06, boxShadow: "0 0 30px #fbbf24" } : {}}
          whileTap={canSpin && !spinning ? { scale: 0.94 } : {}}
          className={`
            pointer-events-auto
            w-[80px] h-[80px] rounded-full
            font-black text-xs tracking-widest
            flex flex-col items-center justify-center
            transition-all duration-300 border-4
            ${canSpin && !spinning
              ? "bg-gradient-to-b from-yellow-300 via-amber-500 to-amber-700 border-yellow-200 text-slate-950 shadow-[0_6px_25px_rgba(245,158,11,0.7)] cursor-pointer"
              : "bg-gradient-to-b from-gray-700 to-gray-900 border-gray-600 text-gray-500 cursor-not-allowed shadow-none"
            }
          `}
        >
          <span className="text-xl font-bold leading-none mb-0.5">
            {spinning ? "🎰" : "🎯"}
          </span>
          <span className="font-extrabold uppercase text-[10px]">
            {spinning ? "WAIT" : spinLabel}
          </span>
        </motion.button>
      </div>
    </div>
  );
}