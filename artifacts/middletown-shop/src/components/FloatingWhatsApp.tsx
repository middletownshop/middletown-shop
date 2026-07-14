import { MessageCircle } from "lucide-react";

export default function FloatingWhatsApp() {
  const phone = "233257869403";

  return (
    <a
      href={`https://wa.me/${phone}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-white shadow-xl transition hover:scale-110 hover:bg-green-600"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="h-8 w-8" />
    </a>
  );
}