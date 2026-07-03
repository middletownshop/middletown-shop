import { useState } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdminNotices() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const handlePublish = async () => {
    if (!title || !message) {
      alert("Please fill in title and message");
      return;
    }

    try {
      const usersSnapshot = await getDocs(collection(db, "users"));

      for (const userDoc of usersSnapshot.docs) {
        await addDoc(collection(db, "notifications"), {
          title,
          message,
          userId: userDoc.id,
          read: false,
          createdAt: serverTimestamp(),
        });
      }

      alert("Notice published successfully");

      setTitle("");
      setMessage("");
    } catch (error) {
      console.error(error);
      alert("Failed to publish notice");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Notices</h1>

      <div className="space-y-4 bg-white p-5 rounded-lg border shadow-sm">
        {/* Title */}
        <div>
          <label className="text-sm font-medium">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="Enter notice title"
          />
        </div>

        {/* Message */}
        <div>
          <label className="text-sm font-medium">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full border rounded p-2 mt-1 h-32 focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="Enter notice message"
          />
        </div>

        {/* Button */}
        <button
          onClick={handlePublish}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Publish Notice
        </button>
      </div>
    </div>
  );
}