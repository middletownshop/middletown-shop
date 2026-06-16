import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { getReceipt } from "@/lib/firestore";
import type { Receipt } from "@/lib/types";
import { Printer, Download, ArrowLeft } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import toast from "react-hot-toast";

export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    getReceipt(id)
      .then(setReceipt)
      .catch(() => setReceipt(null))
      .finally(() => setLoading(false));
  }, [id]);

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
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <h2 className="text-xl font-bold text-foreground mb-2">Receipt not found</h2>
      <Link to="/orders" className="text-primary hover:underline">Back to orders</Link>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Action buttons */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link to="/orders" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to orders
        </Link>
        <div className="flex gap-2">
          <button onClick={handlePrint} data-testid="button-print"
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-accent transition-colors">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button onClick={handleDownload} disabled={downloading} data-testid="button-download-pdf"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
            <Download className="w-4 h-4" />
            {downloading ? "Downloading..." : "Download PDF"}
          </button>
        </div>
      </div>

      {/* Receipt document */}
      <div ref={receiptRef} className="bg-white border border-border rounded-xl p-8 shadow-sm">
        {/* Header */}
        <div className="flex justify-between items-start mb-6 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="font-bold text-xl text-primary">Middletown Shop</span>
            </div>
            <p className="text-xs text-muted-foreground">Ghana's Trusted Marketplace</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Receipt</p>
            <p className="font-bold text-foreground text-lg">{receipt.receiptNumber}</p>
            <p className="text-xs text-muted-foreground">
              {receipt.createdAt?.toDate ? receipt.createdAt.toDate().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" }) : receipt.paidAt ? new Date(receipt.paidAt).toLocaleDateString() : "—"}
            </p>
          </div>
        </div>

        {/* Customer & Order info */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Bill To</h4>
            <p className="font-semibold text-foreground text-sm">{receipt.customerName}</p>
            <p className="text-sm text-muted-foreground">{receipt.customerEmail}</p>
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
          <p className="mt-1">Powered by Paystack — Ghana's trusted payment gateway.</p>
        </div>
      </div>
    </div>
  );
}
