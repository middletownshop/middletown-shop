import { Timestamp } from "firebase/firestore";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: "admin" | "customer";
  createdAt: Timestamp;
  walletBalance: number;
  savedProducts: string[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: "physical" | "digital" | "data" | "airtime" | "utility" | "service";
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
  address: string;
  phone: string;
  city: string;
  state: string;
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
  id: string;
  receiptNumber: string;
  orderId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  totalAmount: number;
  paymentReference: string;
  paidAt: string;
  createdAt: Timestamp;
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
