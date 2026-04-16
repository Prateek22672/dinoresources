import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Lock,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from "lucide-react";
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
  description = "Access all study tools and AI-powered features.",
  featureName,
  priceLabel = "₹11",
  onPaymentSuccess,
}: PremiumUnlockDialogProps) {
  const [showFeatures, setShowFeatures] = useState(false);

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
    productName: "Premium Access",
    description: "Unlock all study tools and AI features",
    themeColor: "#ffffff",
    onPaymentSuccess: async () => {
      await onPaymentSuccess?.();
      onOpenChange(false);
    },
  });

  useEffect(() => {
    if (!open) {
      resetPaymentState();
      setShowFeatures(false);
    }
  }, [open, resetPaymentState]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[94%] sm:max-w-[400px] bg-[#0b0b0d] border border-zinc-800 text-zinc-100 rounded-xl p-0 shadow-lg max-h-[90vh] overflow-hidden">

        <div className="overflow-y-auto p-5">

          <DialogHeader className="text-left">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <Lock className="w-4 h-4 text-zinc-300" />
              </div>

              <span className="text-[11px] text-zinc-400">
                Premium
              </span>
            </div>

            <DialogTitle className="text-lg font-semibold text-white">
              {title}
            </DialogTitle>

            <DialogDescription className="text-zinc-500 text-xs mt-1 leading-relaxed">
              {description}
            </DialogDescription>
          </DialogHeader>

          {/* Feature Context */}
          {featureName && (
            <div className="mt-3 border border-zinc-800 bg-zinc-900/30 rounded-md px-3 py-2">
              <p className="text-[10px] text-zinc-500">
                Locked feature
              </p>
              <p className="text-[12px] text-white font-medium">
                {featureName}
              </p>
            </div>
          )}

          {/* Dropdown */}
          <button
            onClick={() => setShowFeatures(!showFeatures)}
            className="mt-5 w-full flex items-center justify-between px-3 py-2.5 bg-zinc-900/30 border border-zinc-800 rounded-md hover:bg-zinc-900/50 transition"
          >
            <span className="text-[10px] text-zinc-400 uppercase tracking-wide">
              What’s included
            </span>
            {showFeatures ? (
              <ChevronUp className="w-4 h-4 text-zinc-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-500" />
            )}
          </button>

          {/* Dropdown Content */}
          {showFeatures && (
            <div className="mt-3 max-h-[220px] overflow-y-auto pr-1 space-y-2">

              <FeatureCard title="Your Subjects" desc="Access all materials." />
              <FeatureCard title="Study with AI" desc="AI help and summaries." />
              <FeatureCard title="SGPA Calculator" desc="Estimate grades." />
              <FeatureCard title="Attendance Tracking" desc="Track classes." />
              <FeatureCard title="All Study Resources" desc="Unlock everything." />

            </div>
          )}

          {/* Error */}
          {errorMsg && (
            <div className="mt-4 flex items-start gap-2 border border-red-500/20 bg-red-500/5 rounded-md p-2.5">
              <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5" />
              <p className="text-[11px] text-red-400">{errorMsg}</p>
            </div>
          )}

          {/* CTA */}
          <div className="mt-5">
            <Button
              onClick={startPremiumUnlock}
              disabled={isButtonDisabled}
              className="w-full h-10 flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 text-sm rounded-md"
            >
              {paymentState === "verifying" || paymentState === "creating_order" ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}

              Unlock all for {priceLabel}
            </Button>
          </div>

          {/* Footer */}
          <p className="text-center text-[10px] text-zinc-600 mt-3">
            Secure payment via Razorpay
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* Feature Card */
function FeatureCard({
  title,
  desc,
}: {
  title: string;
  desc: string;
}) {
  return (
    <div className="border border-zinc-800 bg-zinc-900/20 rounded-md p-2.5">
      <h4 className="text-[12px] text-zinc-200">{title}</h4>
      <p className="text-[10px] text-zinc-500 mt-0.5">{desc}</p>
    </div>
  );
}