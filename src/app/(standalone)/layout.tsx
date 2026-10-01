import { BrandMark } from "@/components/brand-mark";
import { UserButton } from "@/features/auth/components/user-button";

interface StandAloneLayoutProps {
  children: React.ReactNode;
}

const StandAloneLayout = ({ children }: StandAloneLayoutProps) => {
  return (
    <main className="min-h-dvh bg-background">
      <div className="mx-auto max-w-3xl px-6 py-6">
        <nav className="flex h-14 items-center justify-between">
          <BrandMark />
          <UserButton />
        </nav>
        <div className="flex flex-col items-center py-8">{children}</div>
      </div>
    </main>
  );
};

export default StandAloneLayout;
