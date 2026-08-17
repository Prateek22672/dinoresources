import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ReceiptView from "./ReceiptView";
import type { ReceiptData } from "@/lib/receipt";
import { downloadReceiptPdf } from "@/lib/receiptExport";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

/** Shows a receipt with a download-as-PDF action. Pass `data={null}` to keep the dialog closed. */
export default function ReceiptDialog({
  data,
  open,
  onOpenChange,
}: {
  data: ReceiptData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const download = async () => {
    if (!nodeRef.current || !data) return;
    setDownloading(true);
    try {
      await downloadReceiptPdf(nodeRef.current, `${data.receiptNo}.pdf`);
    } catch {
      toast.error("Couldn't generate the PDF. Try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-transparent border-none shadow-none p-0 max-h-[92vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>Receipt {data?.receiptNo}</DialogTitle>
        </DialogHeader>
        {data && (
          <div className="flex flex-col items-center gap-4 py-2">
            <ReceiptView ref={nodeRef} data={data} />
            <button
              onClick={download}
              disabled={downloading}
              className="td-btn-primary px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {downloading ? "Preparing…" : "Download PDF"}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
