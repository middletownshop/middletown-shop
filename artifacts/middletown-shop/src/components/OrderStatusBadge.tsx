import type { OrderStatus } from "@/lib/types";

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  processing: { label: "Processing", color: "bg-blue-100 text-blue-700 border-blue-200" },
  paid: { label: "Paid", color: "bg-green-100 text-green-700 border-green-200" },
  packed: { label: "Packed", color: "bg-purple-100 text-purple-700 border-purple-200" },
  shipped: { label: "Shipped", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  in_transit: { label: "In Transit", color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  out_for_delivery: { label: "Out for Delivery", color: "bg-orange-100 text-orange-700 border-orange-200" },
  delivered: { label: "Delivered", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700 border-red-200" },
};

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status] || { label: status, color: "bg-gray-100 text-gray-600 border-gray-200" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
      {config.label}
    </span>
  );
}

export { STATUS_CONFIG };
