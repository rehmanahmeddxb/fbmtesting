
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
  Settings,
  ListChecks,
  DatabaseBackup,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/inventory', label: 'Inventory', icon: Wrench },
  { href: '/dashboard/customers', label: 'Customers', icon: Users },
  { href: '/dashboard/sites', label: 'Sites', icon: MapPin },
  { href: '/dashboard/rentals', label: 'Rentals', icon: ListOrdered },
  { href: '/dashboard/tool-tracking', label: 'Tool Tracking', icon: ListChecks },
  { href: '/dashboard/summary', label: 'Summary', icon: AreaChart },
  { href: '/dashboard/reports', label: 'Reports', icon: FileText },
  { href: '/dashboard/financials', label: 'Financials', icon: CircleDollarSign },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  { href: '/dashboard/backup', label: 'Backup & Restore', icon: DatabaseBackup },
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
            >
                <item.icon />
                <span>{item.label}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
