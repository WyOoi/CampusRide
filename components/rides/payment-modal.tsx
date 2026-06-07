"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Wallet, Banknote, CheckCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  amount: number;
  paymentMethod: "cash" | "tng" | string;
  tripInfo: {
    pickup: string;
    destination: string;
  };
  role?: "driver" | "passenger" | string;
}

export function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  amount,
  paymentMethod = "cash",
  tripInfo,
  role = "passenger",
}: PaymentModalProps) {
  const [step, setStep] = useState<"form" | "processing" | "success">("form");
  const [customQrBase64, setCustomQrBase64] = useState<string | null>(null);

  // Parse custom DuitNow QR code if present in the destination metadata or load from local storage if driver
  useEffect(() => {
    if (role === "driver" && typeof window !== "undefined") {
      const savedQr = localStorage.getItem("campusride_driver_duitnow_qr");
      if (savedQr) {
        setCustomQrBase64(savedQr);
        return;
      }
    }

    if (tripInfo?.destination) {
      const qrMatch = tripInfo.destination.match(/\[duitnow_qr:([^\]]+)\]/);
      if (qrMatch) {
        setCustomQrBase64(qrMatch[1]);
      } else {
        setCustomQrBase64(null);
      }
    } else {
      setCustomQrBase64(null);
    }
  }, [tripInfo, role]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep("processing");

    // Simulate payment processing latency
    setTimeout(async () => {
      try {
        await onSuccess();
        setStep("success");
        toast.success("Payment completed successfully!");
      } catch (err: any) {
        setStep("form");
        toast.error(err.message || "Payment processing failed");
      }
    }, 2500);
  };

  // Reset steps on open
  useEffect(() => {
    if (isOpen) {
      setStep("form");
    }
  }, [isOpen]);

  const methodLabel = paymentMethod === "tng" ? "Touch 'n Go eWallet" : "Cash";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md overflow-hidden rounded-2xl border border-border bg-card">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            {step === "form" && (
              <>
                {paymentMethod === "cash" && <Banknote className="h-5 w-5 text-blue-500" />}
                {paymentMethod === "tng" && <Wallet className="h-5 w-5 text-blue-500" />}
                Payment Checkout
              </>
            )}
            {step === "processing" && "Processing Payment"}
            {step === "success" && "Payment Successful"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {tripInfo.pickup} → {tripInfo.destination.replace(/\[[^\]]+\]/g, "").trim()} · Amount: <span className="font-semibold text-foreground">RM {amount.toFixed(2)}</span>
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <AnimatePresence mode="wait">
          {step === "form" && (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handlePayment}
              className="space-y-4 pt-2"
            >
              {/* Cash payment UI */}
              {paymentMethod === "cash" && (
                role === "driver" ? (
                  <div className="space-y-4 py-2 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <Banknote className="h-8 w-8" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-base">Collect Cash Payment</h4>
                      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                        Please collect <span className="font-bold text-foreground">RM {amount.toFixed(2)}</span> in cash from the passenger.
                      </p>
                    </div>
                    <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground border border-border">
                      Make sure to confirm you have received the exact amount before clicking confirm.
                    </div>
                    <Button type="submit" className="w-full rounded-xl py-5 font-semibold">
                      Confirm Cash Received
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 py-2 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <Banknote className="h-8 w-8" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-base">Pay Driver in Cash</h4>
                      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                        Please hand <span className="font-bold text-foreground">RM {amount.toFixed(2)}</span> in cash directly to the driver.
                      </p>
                    </div>
                    <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground border border-border">
                      Click below to confirm that you have paid the driver.
                    </div>
                    <Button type="submit" className="w-full rounded-xl py-5 font-semibold">
                      Confirm Paid in Cash
                    </Button>
                  </div>
                )
              )}

              {/* Touch 'n Go QR Code UI */}
              {paymentMethod === "tng" && (
                <div className="space-y-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    {role === "driver"
                      ? "Show the DuitNow QR code below to the passenger to scan and collect RM " + amount.toFixed(2) + "."
                      : "Scan the DuitNow QR code below using your Touch 'n Go eWallet to complete payment."}
                  </p>
                  
                  {/* Styled Mock TNG / DuitNow QR Frame */}
                  <div className="mx-auto w-52 h-52 bg-white rounded-2xl p-4 shadow-md border border-border relative flex flex-col items-center justify-between">
                    <div className="w-full flex items-center justify-between text-[10px] font-bold text-[#0052b4] border-b border-[#0052b4]/10 pb-1">
                      <span>Touch 'n Go eWallet</span>
                      <span className="text-pink-500 font-extrabold">DuitNow</span>
                    </div>

                    {customQrBase64 ? (
                      <div className="w-36 h-36 relative flex items-center justify-center border border-dashed border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                        {/* Driver's custom uploaded QR Code */}
                        <img 
                          src={customQrBase64} 
                          alt="Driver DuitNow QR" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      /* Simulated SVG QR Code fallback */
                      <svg className="w-36 h-36 text-slate-800" viewBox="0 0 100 100">
                        <rect width="100" height="100" fill="none" />
                        <path d="M 5 5 L 30 5 L 30 30 L 5 30 Z M 12 12 L 23 12 L 23 23 L 12 23 Z" fill="currentColor" />
                        <path d="M 70 5 L 95 5 L 95 30 L 70 30 Z M 77 12 L 88 12 L 88 23 L 77 23 Z" fill="currentColor" />
                        <path d="M 5 70 L 30 70 L 30 95 L 5 95 Z M 12 77 L 23 77 L 23 88 L 12 88 Z" fill="currentColor" />
                        <rect x="40" y="5" width="8" height="8" fill="currentColor" />
                        <rect x="50" y="15" width="12" height="6" fill="currentColor" />
                        <rect x="40" y="25" width="10" height="10" fill="currentColor" />
                        <rect x="70" y="40" width="8" height="12" fill="currentColor" />
                        <rect x="85" y="45" width="10" height="8" fill="currentColor" />
                        <rect x="45" y="50" width="15" height="15" fill="currentColor" />
                        <rect x="75" y="70" width="15" height="8" fill="currentColor" />
                        <rect x="70" y="85" width="25" height="8" fill="currentColor" />
                        <rect x="15" y="45" width="12" height="12" fill="currentColor" />
                        <rect x="5" y="45" width="8" height="8" fill="currentColor" />
                        <rect x="40" y="40" width="20" height="20" rx="3" fill="#0052b4" />
                        <circle cx="50" cy="50" r="6" fill="white" />
                      </svg>
                    )}

                    <div className="text-[10px] font-semibold text-muted-foreground mt-1">
                      {customQrBase64 ? "Driver's Custom QR Code" : `CampusRide Pay ID: CR-${Math.floor(1000 + Math.random() * 9000)}`}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-semibold">RM {amount.toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {role === "driver"
                        ? "Waiting for passenger to complete scan..."
                        : "Scan, enter pin, and press verify below."}
                    </p>
                  </div>
                  
                  <Button type="submit" className="w-full rounded-xl py-5 font-semibold bg-[#0052b4] hover:bg-[#003c85] text-white">
                    {role === "driver" ? "Confirm QR Code Paid & Complete Ride" : "Confirm QR Code Scanned"}
                  </Button>
                </div>
              )}
            </motion.form>
          )}

          {step === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 space-y-4"
            >
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <div className="text-center space-y-1">
                <p className="font-semibold text-sm">Contacting payment provider...</p>
                <p className="text-xs text-muted-foreground">Securing transaction and transferring funds.</p>
              </div>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-8 text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                <CheckCircle className="h-10 w-10 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-lg">Transaction Approved</h4>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Receipt sent to passenger account. Payment of <span className="font-semibold text-foreground">RM {amount.toFixed(2)}</span> has been cleared via {methodLabel}.
                </p>
              </div>
              <div className="w-full border border-border rounded-xl bg-muted/20 p-4 text-xs font-mono space-y-1.5 text-left">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Method:</span>
                  <span className="font-semibold text-foreground uppercase">{paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="text-blue-500 font-semibold">PAID</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference ID:</span>
                  <span className="text-foreground">tx_qr_{Math.random().toString(36).substr(2, 9)}</span>
                </div>
              </div>
              <Button onClick={onClose} className="w-full rounded-xl">
                Done & Return
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
