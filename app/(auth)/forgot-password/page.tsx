"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner"; 

import { supabase } from "@/lib/supabase";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    try {
      setLoading(true);

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          email,
          {
            redirectTo:
              "http://localhost:3000/reset-password",
          }
        );

      if (error) throw error;

      toast.success(
        "Password reset email sent. Please check your inbox."
      );
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/20">
      <CardHeader>
        <CardTitle className="text-2xl">
          Reset access
        </CardTitle>

        <CardDescription>
          Enter your university email and we'll send
          you a password reset link.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">
            University email
          </Label>

          <Input
            id="email"
            type="email"
            placeholder="you@student.utem.edu.my"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="rounded-xl"
          />
        </div>

        <Button
          className="w-full rounded-xl"
          onClick={handleReset}
          disabled={loading}
        >
          {loading
            ? "Sending..."
            : "Send reset link"}
        </Button>

        <Button
          asChild
          variant="ghost"
          className="w-full rounded-xl"
        >
          <Link href="/login">
            Back to login
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}