import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { RequireAuth, RequireAdmin } from "@/components/RequireAuth";
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
import TrackOrderPage from "@/pages/TrackOrderPage";
import ProfilePage from "@/pages/ProfilePage";
import NotFoundPage from "@/pages/NotFoundPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminUsers from "@/pages/admin/AdminUsers";

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

            {/* Customer authenticated routes */}
            <Route path="/checkout" element={<RequireAuth><ShopLayout><CheckoutPage /></ShopLayout></RequireAuth>} />
            <Route path="/orders" element={<RequireAuth><ShopLayout><OrdersPage /></ShopLayout></RequireAuth>} />
            <Route path="/orders/:id" element={<RequireAuth><ShopLayout><OrderDetailPage /></ShopLayout></RequireAuth>} />
            <Route path="/receipt/:id" element={<RequireAuth><ShopLayout><ReceiptPage /></ShopLayout></RequireAuth>} />
            <Route path="/dashboard" element={<RequireAuth><ShopLayout><DashboardPage /></ShopLayout></RequireAuth>} />
            <Route path="/profile" element={<RequireAuth><ShopLayout><ProfilePage /></ShopLayout></RequireAuth>} />

            {/* Public routes */}
            <Route path="/" element={<ShopLayout><HomePage /></ShopLayout>} />
            <Route path="/products" element={<ShopLayout><ProductsPage /></ShopLayout>} />
            <Route path="/products/:id" element={<ShopLayout><ProductDetailPage /></ShopLayout>} />
            <Route path="/cart" element={<ShopLayout><CartPage /></ShopLayout>} />
            <Route path="/track/:orderId" element={<ShopLayout><TrackOrderPage /></ShopLayout>} />

            {/* 404 */}
            <Route path="*" element={<ShopLayout><NotFoundPage /></ShopLayout>} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
