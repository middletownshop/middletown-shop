import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getReceipt } from "@/lib/firestore";
import type { Receipt } from "@/lib/types";
import { Printer, Download, ArrowLeft } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import toast from "react-hot-toast";

export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);
  
  useEffect(() => {
    if (!id) return;
    getReceipt(id)
      .then(setReceipt)
      .catch(() => setReceipt(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (receipt) {
      console.log("FULL RECEIPT", receipt);
      console.log("orderType =", receipt.orderType);
      console.log("orderId =", receipt.orderId);
    }
  }, [receipt]);
  
  const handleDownload = async () => {
    if (!receiptRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(receiptRef.current, { scale: 2, useCORS: true });
      const img = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      pdf.addImage(img, "PNG", 0, 0, pdfW, pdfH);
      pdf.save(`receipt-${receipt?.receiptNumber || id}.pdf`);
      toast.success("Receipt downloaded");
    } catch {
      toast.error("Download failed. Try printing instead.");
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => window.print();

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-96 bg-gray-200 rounded-xl" />
    </div>
  );

  if (!receipt) return (
    <div className="text-center py-20">
      <h2 className="text-xl font-bold mb-4">
        Receipt not found
      </h2>

      <button
        onClick={() => navigate("/orders")}
        className="px-4 py-2 border rounded-lg"
      >
        Back to orders
      </button>
    </div>
  );
  
  return (
    <div className="max-w-4xl mx-auto p-4">

      {/* Action buttons */}
      <div className="flex gap-3 mb-6">

        <button
          onClick={() => {
            if (
              receipt.orderType === "bundle" ||
              receipt.orderId.startsWith("BD-")
            ) {
              navigate("/bundle-orders");
            } else {
              navigate("/orders");
            }
          }}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg"
        >
          <ArrowLeft size={18} />
          Back to orders
        </button>


        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg"
        >
          <Printer size={18} />
          Print
        </button>


        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg"
        >
          <Download size={18} />
          {downloading ? "Downloading..." : "Download PDF"}
        </button>

      </div>


      {/* Receipt document */}
      <div
        ref={receiptRef}
        className="bg-white border border-border rounded-xl shadow-sm p-4 sm:p-6 lg:p-8 overflow-hidden"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="font-bold text-lg sm:text-2xl text-primary">Middletown Shop</span>
            </div>
            <p className="text-xs text-muted-foreground">Ghana's Trusted Marketplace</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Receipt</p>
            <p className="font-bold text-foreground text-lg">{receipt.receiptNumber}</p>
            <p className="text-xs text-muted-foreground">
              {(receipt as any).createdAt?.toDate ? (receipt as any).createdAt.toDate().toLocaleDateString("en-GH", { year: "numeric", month: "long", day: "numeric" }) : receipt.paidAt ? new Date(receipt.paidAt).toLocaleDateString("en-GH") : "—"}
            </p>
          </div>
        </div>

        {/* Customer & Order info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Bill To</h4>
            <p className="font-semibold text-foreground text-sm">{receipt.customerName}</p>
            <p className="text-sm text-muted-foreground break-all">{receipt.customerEmail}</p>
          </div>
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Order Info</h4>
            <p className="text-sm text-muted-foreground">Order ID: <span className="font-medium text-foreground">{receipt.orderId.slice(0, 16)}...</span></p>
            <p className="text-sm text-muted-foreground">Payment Ref: <span className="font-medium text-foreground text-xs">{receipt.paymentReference}</span></p>
            {receipt.paidAt && <p className="text-sm text-muted-foreground">Paid: <span className="font-medium text-foreground">{new Date(receipt.paidAt).toLocaleString()}</span></p>}
          </div>
        </div>

        {/* Items table */}
        <table className="w-full mb-6">
          <thead>
            <tr className="bg-muted">
              <th className="text-left text-xs font-bold text-muted-foreground uppercase px-3 py-2 rounded-l">Item</th>
              <th className="text-center text-xs font-bold text-muted-foreground uppercase px-3 py-2">Qty</th>
              <th className="text-right text-xs font-bold text-muted-foreground uppercase px-3 py-2">Unit Price</th>
              <th className="text-right text-xs font-bold text-muted-foreground uppercase px-3 py-2 rounded-r">Total</th>
            </tr>
          </thead>
          <tbody>
            {receipt.items.map((item, i) => (
              <tr key={i} className="border-b border-border">
                <td className="px-3 py-3 text-sm text-foreground">{item.name}</td>
                <td className="px-3 py-3 text-sm text-center text-muted-foreground">{item.quantity}</td>
                <td className="px-3 py-3 text-sm text-right text-muted-foreground">₵{Number(item.price || 0).toLocaleString("en-GH")}</td>
                <td className="px-3 py-3 text-sm text-right font-medium text-foreground">₵{Number((item.price || 0) * item.quantity).toLocaleString("en-GH")}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total */}
        <div className="flex justify-end mb-8">
          <div className="w-56">
            <div className="flex justify-between py-1 text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₵{Number(receipt.totalAmount || 0).toLocaleString("en-GH")}</span>
            </div>
            <div className="flex justify-between py-2 border-t-2 border-foreground font-bold text-foreground">
              <span>Total Paid</span>
              <span>₵{Number(receipt.totalAmount || 0).toLocaleString("en-GH")}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground border-t border-border pt-4">
          <p className="font-medium text-foreground mb-1">Thank you for shopping with Middletown Shop!</p>
          <p>This is an electronically generated receipt and requires no signature.</p>
          <p className="mt-1">Paid securely through Middletown Wallet.</p>
        </div>
      </div>
    </div>
  );
}
