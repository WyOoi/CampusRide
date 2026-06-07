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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Wallet, Banknote, CheckCircle, Lock, ShieldCheck, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  amount: number;
  paymentMethod: "cash" | "tng" | "card" | string;
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
  
  // Card form state
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardName, setCardName] = useState("");

  // Format inputs
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 16) value = value.slice(0, 16);
    const formatted = value.match(/.{1,4}/g)?.join(" ") || value;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    setExpiry(value);
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 3);
    setCvc(value);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMethod === "card") {
      if (cardNumber.replace(/\s/g, "").length !== 16) {
        toast.error("Please enter a valid 16-digit card number");
        return;
      }
      if (expiry.length !== 5) {
        toast.error("Please enter a valid expiry date (MM/YY)");
        return;
      }
      if (cvc.length !== 3) {
        toast.error("Please enter a valid 3-digit CVC");
        return;
      }
      if (!cardName.trim()) {
        toast.error("Please enter the cardholder's name");
        return;
      }
    }

    setStep("processing");

    // Simulate Stripe/payment provider API latency
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
      setCardNumber("");
      setExpiry("");
      setCvc("");
      setCardName("");
    }
  }, [isOpen]);

  const methodLabel =
    paymentMethod === "tng"
      ? "Touch 'n Go eWallet"
      : paymentMethod === "card"
      ? "Debit / Credit Card (Stripe)"
      : "Cash";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md overflow-hidden rounded-2xl border border-border bg-card">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            {step === "form" && (
              <>
                {paymentMethod === "cash" && <Banknote className="h-5 w-5 text-emerald-500" />}
                {paymentMethod === "tng" && <Wallet className="h-5 w-5 text-blue-500" />}
                {paymentMethod === "card" && <CreditCard className="h-5 w-5 text-primary" />}
                Payment Checkout
              </>
            )}
            {step === "processing" && "Processing Payment"}
            {step === "success" && "Payment Successful"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {tripInfo.pickup} → {tripInfo.destination} · Amount: <span className="font-semibold text-foreground">RM {amount.toFixed(2)}</span>
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
                    <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
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
                    <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
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
                      ? "Show the QR code below to the passenger to scan and collect RM " + amount.toFixed(2) + "."
                      : "Scan the QR code below using your Touch 'n Go eWallet to complete payment."}
                  </p>
                  
                  {/* Styled Mock TNG QR Frame */}
                  <div className="mx-auto w-52 h-52 bg-white rounded-2xl p-4 shadow-md border border-border relative flex flex-col items-center justify-between">
                    <div className="w-full flex items-center justify-between text-[10px] font-bold text-[#0052b4] border-b border-[#0052b4]/10 pb-1">
                      <span>Touch 'n Go eWallet</span>
                      <span className="text-pink-500 font-extrabold">DuitNow</span>
                    </div>
                    {/* Simulated SVG QR Code */}
                    <svg className="w-36 h-36 text-slate-800" viewBox="0 0 100 100">
                      <rect width="100" height="100" fill="none" />
                      {/* Outer corner finders */}
                      <path d="M 5 5 L 30 5 L 30 30 L 5 30 Z M 12 12 L 23 12 L 23 23 L 12 23 Z" fill="currentColor" />
                      <path d="M 70 5 L 95 5 L 95 30 L 70 30 Z M 77 12 L 88 12 L 88 23 L 77 23 Z" fill="currentColor" />
                      <path d="M 5 70 L 30 70 L 30 95 L 5 95 Z M 12 77 L 23 77 L 23 88 L 12 88 Z" fill="currentColor" />
                      {/* Random QR patterns */}
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
                      {/* Center mock logo */}
                      <rect x="40" y="40" width="20" height="20" rx="3" fill="#0052b4" />
                      <circle cx="50" cy="50" r="6" fill="white" />
                    </svg>
                    <div className="text-[10px] font-semibold text-muted-foreground mt-1">
                      CampusRide Pay ID: CR-{Math.floor(1000 + Math.random() * 9000)}
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

              {/* Stripe Credit Card Form UI */}
              {paymentMethod === "card" && (
                <div className="space-y-4">
                  {/* Premium Credit Card Live Mockup */}
                  <div className="relative w-full h-44 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 flex flex-col justify-between shadow-xl border border-white/5 overflow-hidden">
                    <div className="absolute top-0 right-0 w-36 h-36 bg-primary/10 rounded-full blur-2xl" />
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase tracking-widest text-muted-foreground">CampusRide Card</span>
                        <div className="h-6 w-8 bg-amber-500/80 rounded-md mt-1.5 flex items-center justify-center text-[10px] font-bold text-amber-900">CHIP</div>
                      </div>
                      <CreditCard className="h-6 w-6 opacity-75 text-primary" />
                    </div>
                    
                    <div className="space-y-1 mt-2">
                      <p className="font-mono text-base tracking-widest leading-none">
                        {cardNumber || "•••• •••• •••• ••••"}
                      </p>
                    </div>

                    <div className="flex justify-between items-end">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[8px] uppercase tracking-wider text-muted-foreground">Card Holder</span>
                        <p className="text-xs font-semibold uppercase truncate tracking-wide max-w-[160px]">
                          {cardName || "Your Name"}
                        </p>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[8px] uppercase tracking-wider text-muted-foreground">Expires</span>
                        <p className="text-xs font-mono font-semibold">
                          {expiry || "MM/YY"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Form inputs structured like Stripe Checkout */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="card-name" className="text-xs font-medium text-muted-foreground">Cardholder Name</Label>
                      <Input
                        id="card-name"
                        placeholder="e.g. John Doe"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="rounded-xl border-border bg-card/50 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="card-number" className="text-xs font-medium text-muted-foreground">Card Number</Label>
                      <div className="relative">
                        <Input
                          id="card-number"
                          placeholder="0000 0000 0000 0000"
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          className="rounded-xl border-border bg-card/50 pl-10 text-sm font-mono"
                        />
                        <CreditCard className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="card-expiry" className="text-xs font-medium text-muted-foreground">Expiry Date</Label>
                        <Input
                          id="card-expiry"
                          placeholder="MM/YY"
                          value={expiry}
                          onChange={handleExpiryChange}
                          className="rounded-xl border-border bg-card/50 text-sm font-mono text-center"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="card-cvc" className="text-xs font-medium text-muted-foreground">CVC / CVV</Label>
                        <Input
                          id="card-cvc"
                          placeholder="123"
                          value={cvc}
                          onChange={handleCvcChange}
                          className="rounded-xl border-border bg-card/50 text-sm font-mono text-center"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 justify-center text-[10px] text-muted-foreground">
                    <Lock className="h-3 w-3 text-emerald-500" />
                    <span>Secure payment processed via Stripe SSL encryption</span>
                  </div>

                  <Button
                    type="submit"
                    className={`w-full rounded-xl py-5 font-semibold text-sm ${
                      role === "driver" ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""
                    }`}
                  >
                    {role === "driver" ? "Confirm Completion & Charge Card" : `Pay RM ${amount.toFixed(2)}`}
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
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
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
                  <span className="text-emerald-500 font-semibold">PAID</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference ID:</span>
                  <span className="text-foreground">tx_stripe_{Math.random().toString(36).substr(2, 9)}</span>
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
