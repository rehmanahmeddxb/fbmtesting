import type { PropsWithChildren } from "react";
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { LogOut } from "lucide-react";
import DashboardNav from "@/components/dashboard-nav";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AppProvider } from "@/context/AppContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <AppProvider>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader className="p-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="bg-primary text-primary-foreground rounded-lg p-2 flex items-center justify-center h-10 w-10">
                <Image src="/logo.png" alt="App Logo" width={24} height={24} />
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                        <Avatar>
                            <AvatarImage src="/profile.png" alt="User" />
                            <AvatarFallback>RA</AvatarFallback>
                        </Avatar>
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">User</p>
                            <p className="text-xs leading-none text-muted-foreground">user@example.com</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                     <DropdownMenuItem asChild>
                        <Link href="/">
                           <LogOut className="mr-2 h-4 w-4" />
                           <span>Log out</span>
                        </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            </div>
          </header>
          <main className="p-4 lg:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </AppProvider>
  );
}
