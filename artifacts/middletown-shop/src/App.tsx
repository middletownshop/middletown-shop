import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { RequireAuth, RequireAdmin } from "@/components/RequireAuth";
import { DashboardLayout } from "@/components/DashboardSidebar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import ProductsPage from "@/pages/ProductsPage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import CartPage from "@/pages/CartPage";
import CheckoutPage from "@/pages/CheckoutPage";
import OrdersPage from "@/pages/OrdersPage";
import OrderDetailPage from "@/pages/OrderDetailPage";
import ReceiptPage from "@/pages/ReceiptPage";
import DashboardPage from "@/pages/DashboardPage";
import WalletPage from "@/pages/WalletPage";
import DataBundlesPage from "@/pages/DataBundlesPage";
import BundleOrdersPage from "@/pages/BundleOrdersPage";
import BecomeAgentPage from "@/pages/BecomeAgentPage";
import AgentDashboardPage from "@/pages/AgentDashboardPage";
import AgentComplaintsPage from "@/pages/AgentComplaintsPage";
import ComplaintsPage from "@/pages/ComplaintsPage";
import TrackOrderPage from "@/pages/TrackOrderPage";
import ProfilePage from "@/pages/ProfilePage";
import NotFoundPage from "@/pages/NotFoundPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminBundles from "@/pages/admin/AdminBundles";
import AdminComplaints from "@/pages/admin/AdminComplaints";
import AdminWithdrawals from "@/pages/admin/AdminWithdrawals";

function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex flex-1 min-h-0">
        <DashboardLayout>{children}</DashboardLayout>
      </div>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <CartProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: "#fff",
                color: "#1a1a2e",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                padding: "12px 16px",
                fontSize: "14px",
              },
              success: { iconTheme: { primary: "#1d4ed8", secondary: "#fff" } },
              error: { iconTheme: { primary: "#dc2626", secondary: "#fff" } },
            }}
          />
          <Routes>
            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />

            {/* Admin routes */}
            <Route path="/admin" element={<RequireAdmin><AdminLayout><AdminDashboard /></AdminLayout></RequireAdmin>} />
            <Route path="/admin/products" element={<RequireAdmin><AdminLayout><AdminProducts /></AdminLayout></RequireAdmin>} />
            <Route path="/admin/orders" element={<RequireAdmin><AdminLayout><AdminOrders /></AdminLayout></RequireAdmin>} />
            <Route path="/admin/users" element={<RequireAdmin><AdminLayout><AdminUsers /></AdminLayout></RequireAdmin>} />
            <Route path="/admin/bundles" element={<RequireAdmin><AdminLayout><AdminBundles /></AdminLayout></RequireAdmin>} />
            <Route path="/admin/complaints" element={<RequireAdmin><AdminLayout><AdminComplaints /></AdminLayout></RequireAdmin>} />
            <Route path="/admin/withdrawals" element={<RequireAdmin><AdminLayout><AdminWithdrawals /></AdminLayout></RequireAdmin>} />

            {/* Dashboard shell routes (sidebar) */}
            <Route path="/dashboard" element={<RequireAuth><DashboardShell><DashboardPage /></DashboardShell></RequireAuth>} />
            <Route path="/wallet" element={<RequireAuth><DashboardShell><WalletPage /></DashboardShell></RequireAuth>} />
            <Route path="/bundle-orders" element={<RequireAuth><DashboardShell><BundleOrdersPage /></DashboardShell></RequireAuth>} />
            <Route path="/complaints" element={<RequireAuth><DashboardShell><ComplaintsPage /></DashboardShell></RequireAuth>} />
            <Route path="/agent/apply" element={<RequireAuth><DashboardShell><BecomeAgentPage /></DashboardShell></RequireAuth>} />
            <Route path="/agent/dashboard" element={<RequireAuth><DashboardShell><AgentDashboardPage /></DashboardShell></RequireAuth>} />
            <Route path="/agent/complaints" element={<RequireAuth><DashboardShell><AgentComplaintsPage /></DashboardShell></RequireAuth>} />
            <Route path="/profile" element={<RequireAuth><DashboardShell><ProfilePage /></DashboardShell></RequireAuth>} />
            <Route path="/orders" element={<RequireAuth><DashboardShell><OrdersPage /></DashboardShell></RequireAuth>} />

            {/* Customer authenticated routes */}
            <Route path="/checkout" element={<RequireAuth><ShopLayout><CheckoutPage /></ShopLayout></RequireAuth>} />
            <Route path="/orders/:id" element={<RequireAuth><ShopLayout><OrderDetailPage /></ShopLayout></RequireAuth>} />
            <Route path="/receipt/:id" element={<RequireAuth><ShopLayout><ReceiptPage /></ShopLayout></RequireAuth>} />

            {/* Public routes */}
            <Route path="/" element={<ShopLayout><HomePage /></ShopLayout>} />
            <Route path="/products" element={<ShopLayout><ProductsPage /></ShopLayout>} />
            <Route path="/products/:id" element={<ShopLayout><ProductDetailPage /></ShopLayout>} />
            <Route path="/cart" element={<ShopLayout><CartPage /></ShopLayout>} />
            <Route path="/bundles" element={<ShopLayout><DataBundlesPage /></ShopLayout>} />
            <Route path="/track/:orderId" element={<ShopLayout><TrackOrderPage /></ShopLayout>} />

            {/* 404 */}
            <Route path="*" element={<ShopLayout><NotFoundPage /></ShopLayout>} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
