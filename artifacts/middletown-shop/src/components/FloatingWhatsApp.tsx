import { FaWhatsapp } from "react-icons/fa";

export default function FloatingWhatsApp() {
  const phone = "233257869403";

  return (
    <>
      {/* Neon glow animation */}
      <style>
        {`
          @keyframes neonPulse {
            0% {
              box-shadow:
                0 0 10px #25D366,
                0 0 20px #25D366,
                0 0 40px #25D366;
            }
            50% {
              box-shadow:
                0 0 20px #25D366,
                0 0 40px #25D366,
                0 0 70px #25D366;
            }
            100% {
              box-shadow:
                0 0 10px #25D366,
                0 0 20px #25D366,
                0 0 40px #25D366;
            }
          }
        `}
      </style>

      <a
        href={`https://wa.me/${phone}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="
          fixed
          bottom-6
          right-6
          z-50
          flex
          h-16
          w-16
          items-center
          justify-center
          rounded-full
          bg-[#25D366]
          text-white
          transition-all
          duration-300
          hover:scale-110
          hover:rotate-6
        "
        style={{
          animation: "neonPulse 1.8s infinite",
        }}
      >
        <FaWhatsapp className="text-4xl" />
      </a>
    </>
  );
}