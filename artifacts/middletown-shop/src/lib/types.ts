import { Timestamp } from "firebase/firestore";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: "admin" | "customer" | "agent";

  createdAt: Timestamp;

  walletBalance: number;

  rewardPoints: number;

  availableSpins: number;

  savedProducts: string[];

  lastSpin?: Timestamp;
  
  agentCode?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: "market" | "physical" | "digital" | "data" | "airtime" | "utility" | "service";
  price: number;
  stock: number;
  enabled: boolean;
  images: string[];
  deliveryOptions: string[];
  featured: boolean;
  createdAt: Timestamp;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export type OrderStatus =
  | "pending"
  | "processing"
  | "paid"
  | "packed"
  | "shipped"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export interface ShippingInfo {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;

  deliveryType: "delivery" | "pickup";

  deliveryPayment: "store" | "dispatch";

  deliveryArea: "Accra" | "Tema" | "Outside Accra";

  deliveryFee: number;

  notes?: string;
}

export interface Order {
  id: string;
  orderId: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  items: OrderItem[];
  shippingInfo: ShippingInfo;
  totalAmount: number;
  status: OrderStatus;
  paymentReference: string;
  paymentVerified: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Receipt {
  id?: string;
  receiptNumber: string;
  orderId: string;
  orderType?: "shop" | "bundle";

  customerId: string;
  customerName: string;
  customerEmail: string;
  
  items: {
    name: string;
    price: number;
    quantity: number;
  }[];

  totalAmount: number;
  paymentReference: string;
  paidAt?: string;
}

export interface TrackingUpdate {
  status: OrderStatus;
  message: string;
  timestamp: Timestamp;
}

export interface Tracking {
  id: string;
  orderId: string;
  updates: TrackingUpdate[];
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  type: string;
  createdAt: Timestamp;
}

// ─── Data Bundles ─────────────────────────────────────────────────────────────

export type NetworkProvider = "MTN" | "Telecel" | "AirtelTigo";

export interface DataBundle {
  id: string;
  network: NetworkProvider;
  name: string;
  data: string;
  validity: string;
  price: number;
  popular?: boolean;
  enabled?: boolean;
  createdAt?: Timestamp;
}

export type BundleOrderStatus = "pending" | "paid" | "processing" | "delivered" | "failed";

export interface BundleOrder {
  id: string;
  bundleOrderId: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  network: NetworkProvider;
  bundleName: string;
  bundleData: string;
  bundleValidity: string;
  phoneNumber: string;
  amount: number;
  status: BundleOrderStatus;
  paymentReference: string;
  paymentVerified: boolean;
  createdAt: Timestamp;
}

// ─── Wallet ───────────────────────────────────────────────────────────────────

export type WalletTxType = "deposit" | "withdrawal" | "purchase" | "commission" | "refund";

export interface WalletTransaction {
  id: string;
  userId: string;
  type: WalletTxType;
  amount: number;
  description: string;
  reference: string;
  status: "pending" | "completed" | "failed";
  createdAt: Timestamp;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Timestamp;
}

// ─── Agent ────────────────────────────────────────────────────────────────────

export type AgentApplicationStatus = "pending" | "approved" | "rejected";

export interface AgentApplication {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  phone: string;
  location: string;
  businessName: string;
  idType: string;
  idNumber: string;
  status: AgentApplicationStatus;
  createdAt: Timestamp;
}

export interface AgentCommission {
  id: string;
  agentId: string;
  orderId: string;
  orderAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: "pending" | "paid";
  createdAt: Timestamp;
}

// ─── Complaints ───────────────────────────────────────────────────────────────

export type ComplaintStatus = "open" | "in_progress" | "resolved";

export interface ComplaintReply {
  from: string;
  message: string;
  timestamp: any;
}

export interface Complaint {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  category: string;
  message: string;
  status: ComplaintStatus;
  replies: ComplaintReply[];
  createdAt: Timestamp;
}
