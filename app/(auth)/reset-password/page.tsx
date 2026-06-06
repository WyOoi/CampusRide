"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async () => {
    try {
      setLoading(true);

      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }

      const { error } =
        await supabase.auth.updateUser({
          password,
        });

      if (error) throw error;

      toast.success(
        "Password updated successfully"
      );

      router.push("/login");
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
          Create new password
        </CardTitle>

        <CardDescription>
          Enter a new password for your account.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">
            New password
          </Label>

          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">
            Confirm password
          </Label>

          <Input
            id="confirm"
            type="password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(
                e.target.value
              )
            }
            className="rounded-xl"
          />
        </div>

        <Button
          className="w-full rounded-xl"
          onClick={handleUpdatePassword}
          disabled={loading}
        >
          {loading
            ? "Updating..."
            : "Update Password"}
        </Button>
      </CardContent>
    </Card>
  );
}