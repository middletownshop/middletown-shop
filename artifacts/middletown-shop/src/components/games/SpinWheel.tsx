import { useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { WHEEL_PRIZES } from "@/lib/games/prizes";

interface SpinWheelProps {
  rotation: number;
  spinning: boolean;
  onComplete?: () => void;
}

const SIZE = 340;
const RADIUS = 160;
const CENTER = SIZE / 2;

export default function SpinWheel({
  rotation,
  spinning,
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
          ease: [0.22, 1, 0.36, 1],
        },
      })
      .then(() => {
        onComplete?.();
      });
    }, [rotation, spinning, controls, onComplete]);

  return (
    <div className="relative w-[340px] h-[340px] mx-auto">

      {/* Pointer */}
      <div
        className="
          absolute
          left-1/2
          -translate-x-1/2
          -top-2
          z-50
          w-0
          h-0
          border-l-[14px]
          border-r-[14px]
          border-t-[28px]
          border-l-transparent
          border-r-transparent
          border-t-red-600
        "
      />

      <motion.svg
        width={SIZE}
        height={SIZE}
        animate={controls}
        initial={{ rotate: 0 }}
        style={{
          borderRadius: "50%",
          boxShadow: "0 10px 35px rgba(0,0,0,.25)",
        }}
      >
        {WHEEL_PRIZES.map((prize, index) => {
          const startAngle = index * 45 - 90;
          const endAngle = startAngle + 45;

          const startX =
            CENTER +
            RADIUS *
              Math.cos((Math.PI / 180) * startAngle);

          const startY =
            CENTER +
            RADIUS *
              Math.sin((Math.PI / 180) * startAngle);

          const endX =
            CENTER +
            RADIUS *
              Math.cos((Math.PI / 180) * endAngle);

          const endY =
            CENTER +
            RADIUS *
              Math.sin((Math.PI / 180) * endAngle);

          const largeArc = 0;

          const path = `
            M ${CENTER} ${CENTER}
            L ${startX} ${startY}
            A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${endX} ${endY}
            Z
          `;

          const textAngle = startAngle + 22.5;

          const textX =
            CENTER +
            (RADIUS * 0.65) *
              Math.cos((Math.PI / 180) * textAngle);

          const textY =
            CENTER +
            (RADIUS * 0.65) *
              Math.sin((Math.PI / 180) * textAngle);

          return (
            <g key={prize.id}>
              <path
                d={path}
                fill={prize.color}
                stroke="#fff"
                strokeWidth={2}
              />

              <text
                x={textX}
                y={textY}
                fill="white"
                fontSize="12"
                fontWeight="700"
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${textAngle + 90} ${textX} ${textY})`}
              >
                {prize.title}
              </text>
            </g>
          );
        })}

        {/* Center Circle */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={28}
          fill="white"
          stroke="#ddd"
          strokeWidth={4}
        />
      </motion.svg>
    </div>
  );
}