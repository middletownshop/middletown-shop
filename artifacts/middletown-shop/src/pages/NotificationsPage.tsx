import { useEffect, useState } from "react";
import { collection, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  userId: string;
  createdAt?: any;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;

    const unsub = onSnapshot(collection(db, "notifications"), (snapshot) => {
      const data: Notification[] = snapshot.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }))
        .filter((n: any) =>
          n.target === "all" || n.userId === user.uid
        )
        .sort((a, b) => {
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        });

      setNotifications(data);
    });

    return () => unsub();
  }, [user]);

  const markAsRead = async (id: string) => {
    await updateDoc(doc(db, "notifications", id), {
      read: true,
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>

      {notifications.length === 0 ? (
        <p className="text-gray-500">No notifications yet</p>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markAsRead(n.id)}
              className={`p-4 rounded-lg border cursor-pointer transition ${
                n.read ? "bg-white" : "bg-blue-50 border-blue-200"
              }`}
            >
              <h3 className="font-semibold">{n.title}</h3>
              <p className="text-sm text-gray-600">{n.message}</p>

              <p className="mt-2 text-xs text-gray-400">
                {n.createdAt?.toDate
                  ? n.createdAt.toDate().toLocaleString()
                  : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}