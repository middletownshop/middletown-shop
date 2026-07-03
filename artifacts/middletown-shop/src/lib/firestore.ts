import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, setDoc, serverTimestamp, Timestamp, increment,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  Product, Order, OrderItem, OrderStatus, Receipt, ShippingInfo, UserProfile,
  BundleOrder, WalletTransaction, WithdrawalRequest, AgentApplication, AgentCommission,
  DataBundle, NetworkProvider, Complaint, ComplaintReply,
} from "./types";

export async function getDeliverySettings() {
  const snap = await getDoc(doc(db, "settings", "delivery"));

  if (!snap.exists()) {
    throw new Error("Delivery settings not found");
  }

  return snap.data();
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function createUserProfile(uid: string, data: Partial<UserProfile>) {
  await setDoc(doc(db, "users", uid), {
    uid, email: data.email || "", displayName: data.displayName || "",
    photoURL: data.photoURL || "", role: "customer", walletBalance: 0,
    savedProducts: [], createdAt: serverTimestamp(), ...data,
  });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map(d => d.data() as UserProfile);
}

export async function getUserNotifications(userId: string) {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);

  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export async function markNotificationAsRead(id: string) {
  await updateDoc(doc(db, "notifications", id), {
    read: true,
  });
}

// ─── Products ─────────────────────────────────────────────────────────────────
function normalizeProduct(docId: string, data: any): Product {
  return {
    id: docId,
    ...data,
    images: Array.isArray(data.images)
      ? data.images
      : data.image
      ? [data.image]
      : data.imageUrl
      ? [data.imageUrl]
      : [],
  } as Product;
}
export async function getProducts(opts?: { category?: string; enabled?: boolean }): Promise<Product[]> {
  let q;
  if (opts?.enabled !== undefined) {
    q = query(collection(db, "products"), where("enabled", "==", opts.enabled));
  } else {
    q = query(collection(db, "products"), orderBy("createdAt", "desc"));
  }
  const snap = await getDocs(q);
  let items = snap.docs.map(d =>
    normalizeProduct(d.id, d.data())
  );

  if (opts?.category === "market") {
    items = items.filter(p => ["market", "physical", "digital"].includes(p.category));
  } else if (opts?.category) {
    items = items.filter(p => p.category === opts.category);
  }
  items.sort((a, b) => {
    const aTime = (a as any).createdAt?.toMillis?.() ?? 0;
    const bTime = (b as any).createdAt?.toMillis?.() ?? 0;
    return bTime - aTime;
  });
  return items;
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const q = query(
    collection(db, "products"),
    where("featured", "==", true),
    where("enabled", "==", true),
    limit(8)
  );

  const snap = await getDocs(q);

  return snap.docs.map(d =>
    normalizeProduct(d.id, d.data())
  );
}

export async function getProduct(id: string): Promise<Product | null> {
  const snap = await getDoc(doc(db, "products", id));

  return snap.exists()
    ? normalizeProduct(snap.id, snap.data())
    : null;
}

export async function createProduct(data: Omit<Product, "id" | "createdAt">): Promise<string> {
  const ref = await addDoc(collection(db, "products"), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<void> {
  await updateDoc(doc(db, "products", id), data);
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, "products", id));
}

// ─── Orders ───────────────────────────────────────────────────────────────────

function generateOrderId(): string {
  return `MS-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export async function createOrder(data: {
  customerId: string; customerEmail: string; customerName: string;
  items: OrderItem[]; shippingInfo: ShippingInfo; totalAmount: number; paymentReference: string;
}): Promise<string> {
  const orderId = generateOrderId();
  const ref = await addDoc(collection(db, "orders"), {
    ...data, orderId, status: "pending" as OrderStatus, paymentVerified: false,
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  await setDoc(doc(db, "tracking", ref.id), {
    orderId: ref.id,
    updates: [{ status: "pending", message: "Order placed", timestamp: Timestamp.now() }],
  });
  return ref.id;
}

export async function getOrder(id: string): Promise<Order | null> {
  const snap = await getDoc(doc(db, "orders", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Order) : null;
}

export async function getCustomerOrders(customerId: string): Promise<Order[]> {
  const q = query(collection(db, "orders"), where("customerId", "==", customerId));
  const snap = await getDocs(q);
  const orders = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
  return orders.sort((a, b) => ((b as any).createdAt?.toMillis?.() ?? 0) - ((a as any).createdAt?.toMillis?.() ?? 0));
}

export async function getAllOrders(): Promise<Order[]> {
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
}

export async function updateOrderStatus(orderId: string, status: OrderStatus, message: string): Promise<void> {
  console.time("updateOrderStatus");

  console.time("update-order-doc");
  await updateDoc(doc(db, "orders", orderId), {
    status,
    updatedAt: serverTimestamp(),
  });
  console.timeEnd("update-order-doc");

  console.time("tracking");
  const trackRef = doc(db, "tracking", orderId);
  const trackSnap = await getDoc(trackRef);

  const newUpdate = {
    status,
    message,
    timestamp: Timestamp.now(),
  };

  if (trackSnap.exists()) {
    await updateDoc(trackRef, {
      updates: [...(trackSnap.data().updates || []), newUpdate],
    });
  } else {
    await setDoc(trackRef, {
      orderId,
      updates: [newUpdate],
    });
  }
  console.timeEnd("tracking");

  console.time("notification");
  const orderSnap = await getDoc(doc(db, "orders", orderId));

  if (orderSnap.exists()) {
    const order = orderSnap.data();

    await addDoc(collection(db, "notifications"), {
      userId: order.customerId,
      title: `Order ${status.replace(/_/g, " ")}`,
      message: `Your order #${order.orderId} is now ${status.replace(/_/g, " ")}. ${message}`,
      read: false,
      type: "order_update",
      createdAt: serverTimestamp(),
    });
  }
  console.timeEnd("notification");

  console.timeEnd("updateOrderStatus");
}

export async function markOrderPaid(
  orderId: string,
  reference: string,
  amount: number,
  currency: string,
  paidAt: string
): Promise<void> {

  await updateDoc(doc(db, "orders", orderId), {
    status: "paid" as OrderStatus,
    paymentVerified: true,
    updatedAt: serverTimestamp(),
  });

  await addDoc(collection(db, "transactions"), {
    orderId,
    reference,
    amount,
    currency,
    status: "success",
    paidAt,
    createdAt: serverTimestamp(),
  });

  // Don't block the checkout waiting for tracking/notifications.
  updateOrderStatus(
    orderId,
    "paid",
    "Payment confirmed successfully"
  ).catch((error) => {
    console.error("Failed to update tracking/notification:", error);
  });
}

// ─── Receipts ─────────────────────────────────────────────────────────────────

export async function createReceipt(data: Omit<Receipt, "id" | "createdAt">): Promise<string> {
  const ref = await addDoc(collection(db, "receipts"), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function getReceipt(id: string): Promise<Receipt | null> {
  const snap = await getDoc(doc(db, "receipts", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Receipt) : null;
}

export async function getCustomerReceipts(customerId: string): Promise<Receipt[]> {
  const q = query(collection(db, "receipts"), where("customerId", "==", customerId));
  const snap = await getDocs(q);
  const receipts = snap.docs.map(d => ({ id: d.id, ...d.data() } as Receipt));
  return receipts.sort((a, b) => ((b as any).createdAt?.toMillis?.() ?? 0) - ((a as any).createdAt?.toMillis?.() ?? 0));
}

export async function markNotificationRead(id: string): Promise<void> {
  await updateDoc(doc(db, "notifications", id), { read: true });
}

// ─── Data Bundles (Firestore) ─────────────────────────────────────────────────

export async function getFirestoreBundles(network?: NetworkProvider): Promise<DataBundle[]> {
  let q;
  if (network) {
    q = query(collection(db, "bundles"), where("network", "==", network), where("enabled", "==", true));
  } else {
    q = query(collection(db, "bundles"), where("enabled", "==", true));
  }
  const snap = await getDocs(q);
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as DataBundle));
  return items.sort((a, b) => a.price - b.price);
}

export async function getAllFirestoreBundles(): Promise<DataBundle[]> {
  const snap = await getDocs(collection(db, "bundles"));
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as DataBundle));
  return items.sort((a, b) => {
    const networkOrder: Record<string, number> = { MTN: 0, Telecel: 1, AirtelTigo: 2 };
    const nDiff = (networkOrder[a.network] ?? 9) - (networkOrder[b.network] ?? 9);
    return nDiff !== 0 ? nDiff : a.price - b.price;
  });
}

export async function createFirestoreBundle(data: Omit<DataBundle, "id" | "createdAt">): Promise<string> {
  const ref = await addDoc(collection(db, "bundles"), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateFirestoreBundle(id: string, data: Partial<DataBundle>): Promise<void> {
  await updateDoc(doc(db, "bundles", id), data);
}

export async function deleteFirestoreBundle(id: string): Promise<void> {
  await deleteDoc(doc(db, "bundles", id));
}

// ─── Bundle Orders ────────────────────────────────────────────────────────────

function generateBundleOrderId(): string {
  return `BD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export async function createBundleOrder(data: Omit<BundleOrder, "id" | "bundleOrderId" | "createdAt" | "status" | "paymentVerified">): Promise<string> {
  const bundleOrderId = generateBundleOrderId();
  const ref = await addDoc(collection(db, "bundleOrders"), {
    ...data, bundleOrderId, status: "pending", paymentVerified: false, createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function markBundleOrderPaid(id: string, reference: string, amount: number): Promise<void> {
  await updateDoc(doc(db, "bundleOrders", id), { status: "paid", paymentVerified: true, paymentReference: reference });
  await addDoc(collection(db, "transactions"), {
    bundleOrderId: id, reference, amount, currency: "GHS", type: "bundle_purchase", status: "success", createdAt: serverTimestamp(),
  });
}

export async function getCustomerBundleOrders(customerId: string): Promise<BundleOrder[]> {
  const q = query(collection(db, "bundleOrders"), where("customerId", "==", customerId));
  const snap = await getDocs(q);
  const orders = snap.docs.map(d => ({ id: d.id, ...d.data() } as BundleOrder));
  return orders.sort((a, b) => ((b as any).createdAt?.toMillis?.() ?? 0) - ((a as any).createdAt?.toMillis?.() ?? 0));
}

export async function getAllBundleOrders(): Promise<BundleOrder[]> {
  const q = query(collection(db, "bundleOrders"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as BundleOrder));
}

// ─── Wallet ───────────────────────────────────────────────────────────────────

export async function addWalletDeposit(userId: string, amount: number, reference: string, description = "Wallet top-up"): Promise<void> {
  await updateDoc(doc(db, "users", userId), { walletBalance: increment(amount) });
  await addDoc(collection(db, "walletTransactions"), {
    userId, type: "deposit", amount, description, reference, status: "completed", createdAt: serverTimestamp(),
  });
}

export async function requestWalletWithdrawal(data: {
  userId: string; userName: string; userEmail: string; amount: number;
  bankName: string; accountNumber: string; accountName: string;
}): Promise<string> {
  const ref = await addDoc(collection(db, "withdrawalRequests"), { ...data, status: "pending", createdAt: serverTimestamp() });
  await updateDoc(doc(db, "users", data.userId), { walletBalance: increment(-data.amount) });
  await addDoc(collection(db, "walletTransactions"), {
    userId: data.userId, type: "withdrawal", amount: data.amount,
    description: `Withdrawal to ${data.bankName} - ${data.accountNumber}`,
    reference: ref.id, status: "pending", createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getWalletTransactions(userId: string): Promise<WalletTransaction[]> {
  const q = query(collection(db, "walletTransactions"), where("userId", "==", userId));
  const snap = await getDocs(q);
  const txs = snap.docs.map(d => ({ id: d.id, ...d.data() } as WalletTransaction));
  return txs.sort((a, b) => ((b as any).createdAt?.toMillis?.() ?? 0) - ((a as any).createdAt?.toMillis?.() ?? 0));
}

export async function getAllWithdrawalRequests(): Promise<WithdrawalRequest[]> {
  const snap = await getDocs(collection(db, "withdrawalRequests"));
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as WithdrawalRequest));
  return items.sort((a, b) => ((b as any).createdAt?.toMillis?.() ?? 0) - ((a as any).createdAt?.toMillis?.() ?? 0));
}

export async function updateWithdrawalStatus(id: string, status: "approved" | "rejected"): Promise<void> {
  await updateDoc(doc(db, "withdrawalRequests", id), { status });
}

// ─── Agent ────────────────────────────────────────────────────────────────────

export async function submitAgentApplication(data: {
  userId: string; userName: string; userEmail: string; phone: string;
  location: string; businessName: string; idType: string; idNumber: string;
}): Promise<string> {
  const ref = await addDoc(collection(db, "agentApplications"), { ...data, status: "pending", createdAt: serverTimestamp() });
  return ref.id;
}

export async function getAgentApplication(userId: string): Promise<AgentApplication | null> {
  const q = query(collection(db, "agentApplications"), where("userId", "==", userId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as AgentApplication;
}

export async function getAgentCommissions(agentId: string): Promise<AgentCommission[]> {
  const q = query(collection(db, "agentCommissions"), where("agentId", "==", agentId));
  const snap = await getDocs(q);
  const commissions = snap.docs.map(d => ({ id: d.id, ...d.data() } as AgentCommission));
  return commissions.sort((a, b) => ((b as any).createdAt?.toMillis?.() ?? 0) - ((a as any).createdAt?.toMillis?.() ?? 0));
}

export async function getAllAgentApplications(): Promise<AgentApplication[]> {
  const snap = await getDocs(collection(db, "agentApplications"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AgentApplication));
}

export async function approveAgentApplication(applicationId: string, userId: string): Promise<void> {
  const agentCode = userId.slice(0, 8).toUpperCase();
  await updateDoc(doc(db, "agentApplications", applicationId), { status: "approved" });
  await updateDoc(doc(db, "users", userId), { role: "agent", agentCode });
}

export async function rejectAgentApplication(applicationId: string): Promise<void> {
  await updateDoc(doc(db, "agentApplications", applicationId), { status: "rejected" });
}

// ─── Complaints ───────────────────────────────────────────────────────────────

export async function createComplaint(data: {
  userId: string; userName: string; userEmail: string; category: string; message: string;
}): Promise<string> {
  const ref = await addDoc(collection(db, "complaints"), {
    ...data, status: "open", replies: [], createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getMyComplaints(userId: string): Promise<Complaint[]> {
  const q = query(collection(db, "complaints"), where("userId", "==", userId));
  const snap = await getDocs(q);
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Complaint));
  return items.sort((a, b) => ((b as any).createdAt?.toMillis?.() ?? 0) - ((a as any).createdAt?.toMillis?.() ?? 0));
}

export async function getAllComplaints(): Promise<Complaint[]> {
  const snap = await getDocs(collection(db, "complaints"));
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Complaint));
  return items.sort((a, b) => ((b as any).createdAt?.toMillis?.() ?? 0) - ((a as any).createdAt?.toMillis?.() ?? 0));
}

export async function replyToComplaint(id: string, reply: { from: string; message: string }): Promise<void> {
  const snap = await getDoc(doc(db, "complaints", id));
  if (!snap.exists()) return;
  const existing = snap.data().replies || [];
  await updateDoc(doc(db, "complaints", id), {
    replies: [...existing, { ...reply, timestamp: Timestamp.now() }],
    status: "in_progress",
  });
}

export async function resolveComplaint(id: string): Promise<void> {
  await updateDoc(doc(db, "complaints", id), { status: "resolved" });
}

export async function deleteComplaint(id: string): Promise<void> {
  await deleteDoc(doc(db, "complaints", id));
}
