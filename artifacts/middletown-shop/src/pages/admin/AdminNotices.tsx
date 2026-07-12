import { useState } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function AdminNotices() {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"general" | "delivery">("general");
  const [publishing, setPublishing] = useState(false);

  const handlePublish = async () => {
    if (!title || !message) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill in both the title and message fields.",
      });
      return;
    }

    setPublishing(true);

    try {
      const usersSnapshot = await getDocs(collection(db, "users"));

      // Process all insertions concurrently for faster performance
      const promises = usersSnapshot.docs.map((userDoc) =>
        addDoc(collection(db, "notifications"), {
          title,
          message,
          type,
          userId: userDoc.id,
          read: false,
          createdAt: serverTimestamp(),
        })
      );

      await Promise.all(promises);

      toast({
        title: "Notice Published 🎉",
        description: `Successfully broadcasted to ${usersSnapshot.size} users.`,
      });

      setTitle("");
      setMessage("");
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Publish Failed",
        description: "Something went wrong writing to database.",
      });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-black">Admin Notices</h1>

      <div className="space-y-4 bg-white p-5 rounded-3xl border shadow-sm">
        {/* Notice Type */}
        <div>
          <label className="text-sm font-medium text-black">Notice Type</label>
          <select
            value={type}
            disabled={publishing}
            onChange={(e) =>
              setType(e.target.value as "general" | "delivery")
            }
            className="w-full border rounded-2xl p-3 mt-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
          >
            <option value="general">General Notice</option>
            <option value="delivery">Delivery Notice</option>
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="text-sm font-medium text-black">Title</label>
          <input
            value={title}
            disabled={publishing}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded-2xl p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
            placeholder="Enter notice title"
          />
        </div>

        {/* Message */}
        <div>
          <label className="text-sm font-medium text-black">Message</label>
          <textarea
            value={message}
            disabled={publishing}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full border rounded-2xl p-3 mt-1 h-32 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
            placeholder="Enter notice message"
          />
        </div>

        {/* Action Button */}
        <button
          onClick={handlePublish}
          disabled={publishing}
          className="w-full bg-blue-600 text-white h-12 px-4 rounded-2xl hover:bg-blue-700 transition flex items-center justify-center font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {publishing ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Publishing Notice...
            </span>
          ) : (
            "Publish Notice"
          )}
        </button>
      </div>
    </div>
  );
}