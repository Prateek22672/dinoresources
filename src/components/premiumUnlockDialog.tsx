import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { usePremiumAccess } from "./usePremiumAccess";


interface PremiumUnlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  featureName?: string;
  priceLabel?: string;
  onPaymentSuccess?: () => void | Promise<void>;
}

export function PremiumUnlockDialog({
  open,
  onOpenChange,
  title = "Unlock Premium Access",
  description = "Pay once to unlock the full website — AI tools, premium units, calculators, and more.",
  featureName = "this feature",
  priceLabel = "₹11",
  onPaymentSuccess,
}: PremiumUnlockDialogProps) {
  const {
    paymentState,
    errorMsg,
    paymentButtonLabel,
    isButtonDisabled,
    startPremiumUnlock,
    resetPaymentState,
  } = usePremiumAccess({
    amountInPaise: 1100,
    priceLabel,
    productName: "Team Dino Premium",
    description: "Unlock all premium features across the website",
    themeColor: "#6366f1",
    onPaymentSuccess: async () => {
      await onPaymentSuccess?.();
      onOpenChange(false);
    },
  });

  useEffect(() => {
    if (!open) {
      resetPaymentState();
    }
  }, [open, resetPaymentState]);

  const handleUnlock = async () => {
    await startPremiumUnlock();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#0e0e11] border border-white/10 text-zinc-100 rounded-3xl">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
            <Lock className="w-5 h-5 text-indigo-400" />
          </div>

          <DialogTitle className="text-xl font-bold text-white">
            {title}
          </DialogTitle>

          <DialogDescription className="text-zinc-400 leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
            <p className="text-sm text-zinc-300">
              <span className="font-semibold text-white">{featureName}</span> is part of premium access.
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              One-time payment · unlock everything on the website
            </p>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-2xl p-3">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <p className="text-xs text-red-300 leading-relaxed">{errorMsg}</p>
            </div>
          )}

          <Button
            onClick={handleUnlock}
            disabled={isButtonDisabled}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-6 rounded-full text-sm transition-all shadow-lg hover:shadow-indigo-500/30"
          >
            {paymentState === "verifying" || paymentState === "creating_order" ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {paymentButtonLabel[paymentState]}
          </Button>

          <p className="text-center text-xs text-zinc-600">
            Secure payment via Razorpay · No recurring subscription
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}