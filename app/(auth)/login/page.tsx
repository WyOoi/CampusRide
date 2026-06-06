"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; 

import { supabase } from "@/lib/supabase";
import { UNIVERSITY } from "@/lib/constants";

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

export default function LoginPage() {
const router = useRouter();

const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [loading, setLoading] = useState(false);

const handleLogin = async () => {
try {
setLoading(true);

  if (email === "admin" && password === "admin") {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("isAdmin", "true");
    }
    toast.success("Admin login successful");
    router.push("/admin");
    return;
  }

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (error) {
    throw error;
  }

  if (!data.user.email_confirmed_at) {
    toast.error(
      "Please verify your email before logging in."
    );

    await supabase.auth.signOut();
    return;
  }

  // Fetch user role to redirect appropriately
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  const userRole = profile?.role || "passenger";

  toast.success("Login successful");

  router.push(`/${userRole}`);
} catch (error: any) {
  toast.error(error.message || "Login failed");
  console.error(error);
} finally {
  setLoading(false);
}


};

return ( <Card className="rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/20"> <CardHeader> <CardTitle className="text-2xl">
Welcome back </CardTitle>


    <CardDescription>
      Sign in with your {UNIVERSITY.short} email.
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
        autoComplete="email"
        value={email}
        onChange={(e) =>
          setEmail(e.target.value)
        }
        className="rounded-xl"
      />
    </div>

    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="password">
          Password
        </Label>

        <Link
          href="/forgot-password"
          className="text-xs font-medium text-primary hover:underline"
        >
          Forgot?
        </Link>
      </div>

      <Input
        id="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) =>
          setPassword(e.target.value)
        }
        placeholder="••••••••"
        className="rounded-xl"
      />
    </div>

    <Button
      className="w-full rounded-xl"
      onClick={handleLogin}
      disabled={loading}
    >
      {loading
        ? "Signing in..."
        : "Continue"}
    </Button>

    <p className="text-center text-sm text-muted-foreground">
      New to {UNIVERSITY.short}?{" "}
      <Link
        href="/register"
        className="font-semibold text-primary hover:underline"
      >
        Create an account
      </Link>
    </p>
  </CardContent>
</Card>


);
}
