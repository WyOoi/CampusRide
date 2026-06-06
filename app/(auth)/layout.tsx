import Link from "next/link";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { APP_NAME } from "@/lib/constants";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh bg-gradient-to-b from-background via-background to-muted/30">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12">
        <Link href="/" className="mb-8 flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-sm">
            CR
          </span>
          <span className="text-sm font-semibold">{APP_NAME}</span>
        </Link>
        {children}
      </div>
    </div>
  );
}
