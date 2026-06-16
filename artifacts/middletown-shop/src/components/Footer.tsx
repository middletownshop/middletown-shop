import { Link } from "react-router-dom";
import { Package } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-primary rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="text-white font-bold text-lg">Middletown Shop</span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">Ghana's trusted marketplace for physical products, digital services, data bundles, and more.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3 text-sm">Shop</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/products" className="hover:text-white transition-colors">All Products</Link></li>
            <li><Link to="/products?category=physical" className="hover:text-white transition-colors">Physical Products</Link></li>
            <li><Link to="/products?category=digital" className="hover:text-white transition-colors">Digital Products</Link></li>
            <li><Link to="/products?category=data" className="hover:text-white transition-colors">Data Bundles</Link></li>
            <li><Link to="/products?category=airtime" className="hover:text-white transition-colors">Airtime</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3 text-sm">Account</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/login" className="hover:text-white transition-colors">Sign In / Register</Link></li>
            <li><Link to="/dashboard" className="hover:text-white transition-colors">My Dashboard</Link></li>
            <li><Link to="/orders" className="hover:text-white transition-colors">My Orders</Link></li>
            <li><Link to="/cart" className="hover:text-white transition-colors">Shopping Cart</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3 text-sm">Support</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><Package className="w-3 h-3" /><span>Secure Checkout</span></li>
            <li><span>Paystack Payments</span></li>
            <li><span>Firebase Security</span></li>
            <li><span>Real-time Tracking</span></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800 py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Middletown Shop. All rights reserved. Powered by Paystack.
      </div>
    </footer>
  );
}
