import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";

interface OrderLine {
  id: string;
  name_snapshot: string;
  price_snapshot: number;
  quantity: number;
  line_total: number;
}
interface OrderData {
  id: string;
  order_number: number;
  status: string;
  customer_name: string | null;
  table_number: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  created_at: string;
  completed_at: string | null;
}
interface RestaurantData {
  name: string;
  tagline?: string | null;
  currency_symbol?: string | null;
  tax_percent?: number | null;
  logo_url?: string | null;
  gst_number?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
}

interface ReceiptProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  order: OrderData | null;
  items: OrderLine[];
  restaurant: RestaurantData;
}

export default function Receipt({ open, onOpenChange, order, items, restaurant }: ReceiptProps) {
  if (!order) return null;
  const symbol = restaurant.currency_symbol || "$";
  const taxPct = Number(restaurant.tax_percent || 0);
  const halfTax = Number(order.tax) / 2;
  const invoiceNo = `INV-${format(new Date(order.created_at), "yyyyMMdd")}-${String(order.order_number).padStart(4, "0")}`;

  const handlePrint = () => window.print();
  const [downloading, setDownloading] = useState(false);
  const handleDownloadPDF = async () => {
    const node = document.getElementById("receipt-print-area");
    if (!node) return;
    setDownloading(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      // 80mm thermal-style PDF width, height auto from aspect ratio
      const pdfWidth = 80;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pdf = new jsPDF({ unit: "mm", format: [pdfWidth, pdfHeight], orientation: "portrait" });
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${invoiceNo}.pdf`);
    } catch (e: any) {
      toast.error("Could not generate PDF: " + (e?.message || "unknown"));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 print:shadow-none print:max-w-full print:border-0">
        <DialogHeader className="px-4 pt-4 print:hidden">
          <DialogTitle>Receipt #{order.order_number}</DialogTitle>
        </DialogHeader>

        <div id="receipt-print-area" className="px-5 pb-4 pt-2 font-mono text-sm">
          <div className="text-center border-b border-dashed pb-2 mb-2">
            {restaurant.logo_url && (
              <img src={restaurant.logo_url} alt={restaurant.name} className="w-12 h-12 mx-auto mb-1 object-contain" />
            )}
            <p className="font-display font-semibold text-base">{restaurant.name}</p>
            {restaurant.tagline && <p className="text-xs text-muted-foreground">{restaurant.tagline}</p>}
            {restaurant.address && <p className="text-[10px] text-muted-foreground mt-0.5">{restaurant.address}</p>}
            {(restaurant.phone || restaurant.email) && (
              <p className="text-[10px] text-muted-foreground">
                {restaurant.phone}{restaurant.phone && restaurant.email ? " · " : ""}{restaurant.email}
              </p>
            )}
            {restaurant.gst_number && (
              <p className="text-[10px] font-semibold mt-0.5">GSTIN: {restaurant.gst_number}</p>
            )}
            <p className="text-[10px] uppercase tracking-wider mt-1 font-semibold">Tax Invoice</p>
          </div>

          <div className="text-xs space-y-0.5 mb-2">
            <div className="flex justify-between"><span>Invoice #</span><span className="font-semibold">{invoiceNo}</span></div>
            <div className="flex justify-between"><span>Order #</span><span className="font-semibold">{order.order_number}</span></div>
            <div className="flex justify-between"><span>Date</span><span>{format(new Date(order.created_at), "PP p")}</span></div>
            {order.customer_name && <div className="flex justify-between"><span>Customer</span><span>{order.customer_name}</span></div>}
            {order.table_number && <div className="flex justify-between"><span>Table</span><span>{order.table_number}</span></div>}
            <div className="flex justify-between"><span>Status</span><span className="capitalize">{order.status}</span></div>
          </div>

          <div className="border-t border-b border-dashed py-2 my-2">
            <div className="flex text-xs font-semibold mb-1">
              <span className="flex-1">Item</span>
              <span className="w-8 text-center">Qty</span>
              <span className="w-16 text-right">Total</span>
            </div>
            {items.map((it) => (
              <div key={it.id} className="flex text-xs py-0.5">
                <span className="flex-1 truncate pr-1">{it.name_snapshot}</span>
                <span className="w-8 text-center">{it.quantity}</span>
                <span className="w-16 text-right">{symbol}{Number(it.line_total).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="text-xs space-y-0.5">
            <div className="flex justify-between"><span>Subtotal</span><span>{symbol}{Number(order.subtotal).toFixed(2)}</span></div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between"><span>Discount</span><span>−{symbol}{Number(order.discount).toFixed(2)}</span></div>
            )}
            {restaurant.gst_number ? (
              <>
                <div className="flex justify-between"><span>CGST ({(taxPct / 2).toFixed(2)}%)</span><span>{symbol}{halfTax.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>SGST ({(taxPct / 2).toFixed(2)}%)</span><span>{symbol}{halfTax.toFixed(2)}</span></div>
              </>
            ) : (
              <div className="flex justify-between"><span>Tax ({taxPct}%)</span><span>{symbol}{Number(order.tax).toFixed(2)}</span></div>
            )}
            <div className="flex justify-between font-bold text-sm border-t border-dashed pt-1 mt-1">
              <span>TOTAL</span><span>{symbol}{Number(order.total).toFixed(2)}</span>
            </div>
          </div>

          <div className="text-center text-xs text-muted-foreground mt-3 border-t border-dashed pt-2">
            <p>Thank you for visiting!</p>
            {restaurant.gst_number && <p className="text-[10px] mt-1">This is a computer-generated GST invoice.</p>}
            <p className="mt-1">Powered by Quick Menu Hub</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 p-3 border-t print:hidden">
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleDownloadPDF} disabled={downloading}>
              <Download className="w-4 h-4 mr-2" />{downloading ? "Generating…" : "Download PDF"}
            </Button>
            <Button className="flex-1" onClick={handlePrint}><Printer className="w-4 h-4 mr-2" />Print</Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
