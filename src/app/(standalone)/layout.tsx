import Image from "next/image";
import Link from "next/link";

import { UserButton } from "@/features/auth/components/user-button";

interface StandAloneLayoutProps {
    children: React.ReactNode;
}

const StandAloneLayout = ({ children }: StandAloneLayoutProps) => {
    return (
        <main className=" bg-neutral-100 min-h-screen">
            <div className=" mx-auto max-w-screen-2xl p-4">
                <nav className=" flex justify-between items-center h-[73px]">
                    <Link href="/">
                        <Image
                            src="/ProManage.png"
                            alt="Logo"
                            height={70}
                            width={220}
                        />
                    </Link>
                    <UserButton />
                </nav>
                <div className=" flex flex-col items-center justify-center py-4">
                    {children}
                </div>
            </div>
        </main>
    );
};

export default StandAloneLayout;
