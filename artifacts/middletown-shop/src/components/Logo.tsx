interface LogoIconProps {
  className?: string;
}

interface LogoFullProps {
  className?: string;
  dark?: boolean;
}

export function LogoIcon({ className = "w-10 h-10" }: LogoIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Middletown Shop"
    >
      <rect width="48" height="48" rx="10" fill="#1D4ED8" />
      <path
        d="M14 23 C14 11 34 11 34 23"
        stroke="white"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <rect x="8" y="21" width="32" height="22" rx="4" fill="white" />
      <path
        d="M14 38 L14 27 L24 33.5 L34 27 L34 38"
        stroke="#F97316"
        strokeWidth="2.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="36" cy="10" r="5" fill="#F97316" />
      <path
        d="M36 7.5 L36.7 9.8 L39.1 9.8 L37.2 11.3 L37.9 13.6 L36 12.1 L34.1 13.6 L34.8 11.3 L32.9 9.8 L35.3 9.8 Z"
        fill="white"
      />
    </svg>
  );
}

export function LogoFull({ className = "h-9", dark = false }: LogoFullProps) {
  const textColor = dark ? "#FFFFFF" : "#1D4ED8";
  return (
    <svg
      className={className}
      viewBox="0 0 210 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Middletown Shop"
    >
      <rect width="48" height="48" rx="10" fill="#1D4ED8" />
      <path
        d="M14 23 C14 11 34 11 34 23"
        stroke="white"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <rect x="8" y="21" width="32" height="22" rx="4" fill="white" />
      <path
        d="M14 38 L14 27 L24 33.5 L34 27 L34 38"
        stroke="#F97316"
        strokeWidth="2.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="36" cy="10" r="5" fill="#F97316" />
      <path
        d="M36 7.5 L36.7 9.8 L39.1 9.8 L37.2 11.3 L37.9 13.6 L36 12.1 L34.1 13.6 L34.8 11.3 L32.9 9.8 L35.3 9.8 Z"
        fill="white"
      />

      <text
        x="60"
        y="25"
        fontFamily="'Arial Black', 'Arial Bold', Arial, Helvetica, sans-serif"
        fontWeight="900"
        fontSize="18"
        fill={textColor}
        letterSpacing="-0.3"
      >
        Middletown
      </text>
      <text
        x="61"
        y="42"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fontSize="12"
        fill="#F97316"
        letterSpacing="3.5"
      >
        SHOP
      </text>
    </svg>
  );
}

export default LogoFull;
