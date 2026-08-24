import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { useSubjectUnlock } from "@/hooks/useSubjectUnlock";

interface SubjectUnlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  subjectName: string;
  /** Price in rupees (e.g. 29). Used for immediate display only — actual charge
   *  is always confirmed server-side. */
  price: number;
  onPaymentSuccess?: () => void | Promise<void>;
}

export function SubjectUnlockDialog({
  open,
  onOpenChange,
  subjectId,
  subjectName,
  price,
  onPaymentSuccess,
}: SubjectUnlockDialogProps) {
  const {
    paymentState,
    errorMsg,
    isButtonDisabled,
    startUnlock,
    resetPaymentState,
    priceLabel,
  } = useSubjectUnlock({
    subjectId,
    subjectName,
    displayAmountInPaise: price * 100, // display-only; server decides actual charge
    onPaymentSuccess: async () => {
      await onPaymentSuccess?.();
      onOpenChange(false);
    },
  });

  useEffect(() => {
    if (!open) resetPaymentState();
  }, [open, resetPaymentState]);

  const buttonLabel: Record<typeof paymentState, string> = {
    idle:          `Unlock for ${priceLabel}`,
    creating_order: "Preparing…",
    checkout_open:  "Complete payment in popup…",
    verifying:      "Verifying…",
    success:        "Unlocked ✓",
    failed:         `Retry — ${priceLabel}`,
    sdk_missing:    "Retry (reload page)",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="td-force-dark sm:max-w-md bg-[#0e0e11] border border-white/10 text-zinc-100 rounded-3xl">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
            <Lock className="w-5 h-5 text-indigo-400" />
          </div>
          <DialogTitle className="text-xl font-bold text-white">
            Unlock {subjectName}
          </DialogTitle>
          <DialogDescription className="text-zinc-400 leading-relaxed">
            Pay once to permanently unlock all resources and AI tools for this subject.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
            <p className="text-sm text-zinc-300">One-time payment · access never expires</p>
            <p className="text-xs text-zinc-500 mt-1">
              Only for <span className="text-white font-medium">{subjectName}</span>
            </p>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-2xl p-3">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <p className="text-xs text-red-300 leading-relaxed">{errorMsg}</p>
            </div>
          )}

          <Button
            onClick={startUnlock}
            disabled={isButtonDisabled}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-60 text-white font-bold py-6 rounded-full text-sm shadow-lg"
          >
            {(paymentState === "verifying" || paymentState === "creating_order") ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {buttonLabel[paymentState]}
          </Button>

          <p className="text-center text-xs text-zinc-600">
            Secure payment via Razorpay · No subscription
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}