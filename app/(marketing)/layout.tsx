import { LandingFooter } from "@/components/layout/landing-footer";
import { LandingNavbar } from "@/components/layout/landing-navbar";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <LandingNavbar />
      <div className="flex-1">{children}</div>
      <LandingFooter />
    </div>
  );
}
