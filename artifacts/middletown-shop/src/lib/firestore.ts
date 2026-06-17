import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  setDoc,
  serverTimestamp,
  Timestamp,
  increment,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  Product, Order, OrderItem, OrderStatus, Receipt, ShippingInfo, UserProfile,
  BundleOrder, WalletTransaction, WithdrawalRequest, AgentApplication, AgentCommission,
} from "./types";

// ─── Users ────────────────────────────────────────────────────────────────────

export async function createUserProfile(uid: string, data: Partial<UserProfile>) {
  await setDoc(doc(db, "users", uid), {
    uid,
    email: data.email || "",
    displayName: data.displayName || "",
    photoURL: data.photoURL || "",
    role: "customer",
    walletBalance: 0,
    savedProducts: [],
    createdAt: serverTimestamp(),
    ...data,
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

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getProducts(opts?: { category?: string; enabled?: boolean }): Promise<Product[]> {
  let q = query(collection(db, "products"), orderBy("createdAt", "desc"));
  if (opts?.enabled !== undefined) {
    // Simple where-only query to avoid composite index requirement; sort client-side
    q = query(collection(db, "products"), where("enabled", "==", opts.enabled));
  }
  const snap = await getDocs(q);
  let items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));

  // "market" filter includes legacy physical/digital products
  if (opts?.category === "market") {
    items = items.filter(p => ["market", "physical", "digital"].includes(p.category));
  } else if (opts?.category) {
    items = items.filter(p => p.category === opts.category);
  }

  // Sort newest first client-side
  items.sort((a, b) => {
    const aTime = (a as any).createdAt?.toMillis?.() ?? 0;
    const bTime = (b as any).createdAt?.toMillis?.() ?? 0;
    return bTime - aTime;
  });
  return items;
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const q = query(collection(db, "products"), where("featured", "==", true), where("enabled", "==", true), limit(8));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
}

export async function getProduct(id: string): Promise<Product | null> {
  const snap = await getDoc(doc(db, "products", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Product) : null;
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
  customerId: string;
  customerEmail: string;
  customerName: string;
  items: OrderItem[];
  shippingInfo: ShippingInfo;
  totalAmount: number;
  paymentReference: string;
}): Promise<string> {
  const orderId = generateOrderId();
  const ref = await addDoc(collection(db, "orders"), {
    ...data,
    orderId,
    status: "pending" as OrderStatus,
    paymentVerified: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  // create initial tracking
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
  // where-only to avoid composite index; sort client-side
  const q = query(collection(db, "orders"), where("customerId", "==", customerId));
  const snap = await getDocs(q);
  const orders = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
  return orders.sort((a, b) => {
    const aTime = (a as any).createdAt?.toMillis?.() ?? 0;
    const bTime = (b as any).createdAt?.toMillis?.() ?? 0;
    return bTime - aTime;
  });
}

export async function getAllOrders(): Promise<Order[]> {
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  message: string
): Promise<void> {
  await updateDoc(doc(db, "orders", orderId), { status, updatedAt: serverTimestamp() });
  const trackRef = doc(db, "tracking", orderId);
  const trackSnap = await getDoc(trackRef);
  const newUpdate = { status, message, timestamp: Timestamp.now() };
  if (trackSnap.exists()) {
    const existing = trackSnap.data().updates || [];
    await updateDoc(trackRef, { updates: [...existing, newUpdate] });
  } else {
    await setDoc(trackRef, { orderId, updates: [newUpdate] });
  }
  // notify customer
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
  // record transaction
  await addDoc(collection(db, "transactions"), {
    orderId,
    reference,
    amount,
    currency,
    status: "success",
    paidAt,
    createdAt: serverTimestamp(),
  });
  // update tracking
  await updateOrderStatus(orderId, "paid", "Payment confirmed successfully");
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
  // where-only to avoid composite index; sort client-side
  const q = query(collection(db, "receipts"), where("customerId", "==", customerId));
  const snap = await getDocs(q);
  const receipts = snap.docs.map(d => ({ id: d.id, ...d.data() } as Receipt));
  return receipts.sort((a, b) => {
    const aTime = (a as any).createdAt?.toMillis?.() ?? 0;
    const bTime = (b as any).createdAt?.toMillis?.() ?? 0;
    return bTime - aTime;
  });
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function markNotificationRead(id: string): Promise<void> {
  await updateDoc(doc(db, "notifications", id), { read: true });
}

// ─── Data Bundles ─────────────────────────────────────────────────────────────

function generateBundleOrderId(): string {
  return `BD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export async function createBundleOrder(data: Omit<BundleOrder, "id" | "bundleOrderId" | "createdAt" | "status" | "paymentVerified">): Promise<string> {
  const bundleOrderId = generateBundleOrderId();
  const ref = await addDoc(collection(db, "bundleOrders"), {
    ...data,
    bundleOrderId,
    status: "pending",
    paymentVerified: false,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function markBundleOrderPaid(id: string, reference: string, amount: number): Promise<void> {
  await updateDoc(doc(db, "bundleOrders", id), {
    status: "paid",
    paymentVerified: true,
    paymentReference: reference,
  });
  await addDoc(collection(db, "transactions"), {
    bundleOrderId: id,
    reference,
    amount,
    currency: "GHS",
    type: "bundle_purchase",
    status: "success",
    createdAt: serverTimestamp(),
  });
}

export async function getCustomerBundleOrders(customerId: string): Promise<BundleOrder[]> {
  const q = query(collection(db, "bundleOrders"), where("customerId", "==", customerId));
  const snap = await getDocs(q);
  const orders = snap.docs.map(d => ({ id: d.id, ...d.data() } as BundleOrder));
  return orders.sort((a, b) => {
    const aTime = (a as any).createdAt?.toMillis?.() ?? 0;
    const bTime = (b as any).createdAt?.toMillis?.() ?? 0;
    return bTime - aTime;
  });
}

export async function getAllBundleOrders(): Promise<BundleOrder[]> {
  const q = query(collection(db, "bundleOrders"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as BundleOrder));
}

// ─── Wallet ───────────────────────────────────────────────────────────────────

export async function addWalletDeposit(userId: string, amount: number, reference: string, description = "Wallet top-up"): Promise<void> {
  // Update user's wallet balance
  await updateDoc(doc(db, "users", userId), {
    walletBalance: increment(amount),
  });
  // Record wallet transaction
  await addDoc(collection(db, "walletTransactions"), {
    userId,
    type: "deposit",
    amount,
    description,
    reference,
    status: "completed",
    createdAt: serverTimestamp(),
  });
}

export async function requestWalletWithdrawal(data: {
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
}): Promise<string> {
  const ref = await addDoc(collection(db, "withdrawalRequests"), {
    ...data,
    status: "pending",
    createdAt: serverTimestamp(),
  });
  // Deduct amount from wallet balance (pending withdrawal)
  await updateDoc(doc(db, "users", data.userId), {
    walletBalance: increment(-data.amount),
  });
  // Record wallet transaction
  await addDoc(collection(db, "walletTransactions"), {
    userId: data.userId,
    type: "withdrawal",
    amount: data.amount,
    description: `Withdrawal to ${data.bankName} - ${data.accountNumber}`,
    reference: ref.id,
    status: "pending",
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getWalletTransactions(userId: string): Promise<WalletTransaction[]> {
  const q = query(collection(db, "walletTransactions"), where("userId", "==", userId));
  const snap = await getDocs(q);
  const txs = snap.docs.map(d => ({ id: d.id, ...d.data() } as WalletTransaction));
  return txs.sort((a, b) => {
    const aTime = (a as any).createdAt?.toMillis?.() ?? 0;
    const bTime = (b as any).createdAt?.toMillis?.() ?? 0;
    return bTime - aTime;
  });
}

// ─── Agent ────────────────────────────────────────────────────────────────────

export async function submitAgentApplication(data: {
  userId: string;
  userName: string;
  userEmail: string;
  phone: string;
  location: string;
  businessName: string;
  idType: string;
  idNumber: string;
}): Promise<string> {
  const ref = await addDoc(collection(db, "agentApplications"), {
    ...data,
    status: "pending",
    createdAt: serverTimestamp(),
  });
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
  return commissions.sort((a, b) => {
    const aTime = (a as any).createdAt?.toMillis?.() ?? 0;
    const bTime = (b as any).createdAt?.toMillis?.() ?? 0;
    return bTime - aTime;
  });
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
