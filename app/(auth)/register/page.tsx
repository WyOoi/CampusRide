"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; 
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UNIVERSITY } from "@/lib/constants";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();

  const [role, setRole] = useState<"passenger" | "driver">("passenger");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    try {
      setLoading(true);

if (
  !email.endsWith("@student.utem.edu.my") &&
  !email.endsWith("@utem.edu.my")
) {
  toast.error("Please use a valid UTeM email");
  return;
}

if (password !== confirmPassword) {
  toast.error("Passwords do not match");
  return;
}

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      await supabase.from("profiles").insert({
        id: data.user?.id,
        full_name: fullName,
        email,
        role,
      });

      toast.success("Registration successful");
      router.push("/verify-email");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/20">
      <CardHeader>
        <CardTitle className="text-2xl">Join {UNIVERSITY.short}</CardTitle>
        <CardDescription>Pick how you’ll mostly use CampusRide — you can change this later (mock).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Tabs value={role} onValueChange={(v) => setRole(v as "passenger" | "driver")}>
          <TabsList className="grid w-full grid-cols-2 rounded-xl">
            <TabsTrigger value="passenger" className="rounded-lg">
              Passenger
            </TabsTrigger>
            <TabsTrigger value="driver" className="rounded-lg">
              Driver
            </TabsTrigger>
          </TabsList>
          <TabsContent value="passenger" className="mt-3 text-sm text-muted-foreground">
            Best for students who mostly book seats and share costs on recurring routes.
          </TabsContent>
          <TabsContent value="driver" className="mt-3 text-sm text-muted-foreground">
            Best if you drive to campus often and want to list empty seats with plate verification later.
          </TabsContent>
        </Tabs>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="full">Full name</Label>
            <Input id="full"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Aina Rahman" 
            className="rounded-xl"/>

          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="email">University email</Label>
            <Input  id="email"  
            type="email"value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@student.utem.edu.my"
            className="rounded-xl"/> 


          </div>
          <div className="space-y-2">
            <Label htmlFor="pw">Password</Label>
            <Input
  id="pw"
  type="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  placeholder="••••••••"
  className="rounded-xl"
/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pw2">Confirm</Label>
           <Input
  id="pw2"
  type="password"
  value={confirmPassword}
  onChange={(e) => setConfirmPassword(e.target.value)}
  placeholder="••••••••"
  className="rounded-xl"
/>
          </div>
        </div>

<Button
  className="w-full rounded-xl"
  onClick={handleRegister}
  disabled={loading}
>
  {loading ? "Creating account..." : "Continue to email verification"}
</Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
