"use client";

import Link from "next/link";
import { MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
Card,
CardContent,
CardDescription,
CardHeader,
CardTitle,
} from "@/components/ui/card";

export default function VerifyEmailPage() {
return ( <Card className="rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/20"> <CardHeader> <CardTitle className="text-2xl">
Check your email </CardTitle>


    <CardDescription>
      We've sent a verification link to your university
      email address.
    </CardDescription>
  </CardHeader>

  <CardContent className="space-y-6">
    <div className="flex flex-col items-center rounded-2xl border border-border bg-muted/30 p-6 text-center">
      <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
        <MailCheck className="h-8 w-8" />
      </div>

      <h3 className="text-lg font-semibold">
        Verification email sent
      </h3>

      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Please check your UTeM email inbox and click the
        verification link to activate your CampusRide
        account.
      </p>

      <p className="mt-4 text-sm text-muted-foreground">
        If you don't see the email, check your Spam or
        Junk folder.
      </p>
    </div>

    <div className="flex flex-col gap-2 sm:flex-row">
      <Button
        asChild
        className="flex-1 rounded-xl"
      >
        <Link href="/login">
          Go to Login
        </Link>
      </Button>

      <Button
        asChild
        variant="secondary"
        className="flex-1 rounded-xl"
      >
        <Link href="/register">
          Register Another Account
        </Link>
      </Button>
    </div>
  </CardContent>
</Card>


);
}
