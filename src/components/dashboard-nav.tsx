'use client';

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Wrench,
  Users,
  MapPin,
  ListOrdered,
  AreaChart,
  FileText,
  CircleDollarSign,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/inventory', label: 'Inventory', icon: Wrench },
  { href: '/dashboard/customers', label: 'Customers', icon: Users },
  { href: '/dashboard/sites', label: 'Sites', icon: MapPin },
  { href: '/dashboard/rentals', label: 'Rentals', icon: ListOrdered },
  { href: '/dashboard/summary', label: 'Summary', icon: AreaChart },
  { href: '/dashboard/reports', label: 'Reports', icon: FileText },
  { href: '/dashboard/financials', label: 'Financials', icon: CircleDollarSign },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href}>
            <SidebarMenuButton
              isActive={pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard')}
              tooltip={item.label}
              asChild
            >
              <div>
                <item.icon />
                <span>{item.label}</span>
              </div>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
