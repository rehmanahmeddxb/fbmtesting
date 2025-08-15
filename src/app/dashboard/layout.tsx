import type { PropsWithChildren } from "react";
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Wrench } from "lucide-react";
import DashboardNav from "@/components/dashboard-nav";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground rounded-lg p-2">
              <Wrench className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-headline font-semibold text-sidebar-foreground">FBM Tools</h1>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <DashboardNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 bg-card md:bg-transparent border-b md:border-none sticky top-0 z-10">
          <SidebarTrigger className="md:hidden" />
          <div className="flex items-center gap-4 ml-auto">
             <h2 className="text-lg font-semibold hidden sm:block">Welcome, Rehman Ahmed!</h2>
             <Avatar>
                <AvatarImage src="https://placehold.co/100x100.png" alt="Rehman Ahmed" data-ai-hint="male portrait" />
                <AvatarFallback>RA</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="p-4 lg:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
