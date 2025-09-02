
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wrench, Users, ListOrdered, ArrowUpRight } from "lucide-react";
import Link from 'next/link';
import { Badge } from "@/components/ui/badge";
import { useContext } from "react";
import { AppContext } from "@/context/AppContext";
import { format, parseISO } from "date-fns";

export default function DashboardPage() {
    const { rentals, tools, customers } = useContext(AppContext);
    
    const activeRentals = rentals.filter(r => r.status === 'Rented');
    const recentRentals = [...rentals].sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime()).slice(0, 5);

    const getToolName = (id: number) => tools.find(t => t.id === id)?.name || 'Unknown Tool';
    const getCustomerName = (id: number) => customers.find(c => c.id === id)?.name || 'Unknown Customer';
    
    const newCustomersThisMonth = customers.filter(c => {
        // This is a naive check. In a real app, you'd store the customer creation date.
        // For now, we'll just show a static number.
        return true; 
    }).length;
    
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Rented':
                return <Badge variant="default" className="bg-accent text-accent-foreground">{status}</Badge>;
            case 'Returned':
                return <Badge variant="secondary">{status}</Badge>;
            case 'Returned Pending':
                return <Badge variant="destructive">{status}</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    }


    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Tools
                        </CardTitle>
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{tools.reduce((sum, tool) => sum + tool.total_quantity, 0)}</div>
                        <p className="text-xs text-muted-foreground">
                            across {tools.length} categories
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Active Rentals
                        </CardTitle>
                        <ListOrdered className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeRentals.length}</div>
                        <p className="text-xs text-muted-foreground">
                           {tools.reduce((sum, tool) => sum + (tool.total_quantity - tool.available_quantity), 0)} items currently out
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Active Customers
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{customers.length}</div>
                        <p className="text-xs text-muted-foreground">
                            +{newCustomersThisMonth} new this month
                        </p>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader className="flex flex-row items-center">
                    <div className="grid gap-2">
                    <CardTitle>Recent Rentals</CardTitle>
                    <CardDescription>
                        An overview of the most recent rental activities.
                    </CardDescription>
                    </div>
                    <Button asChild size="sm" className="ml-auto gap-1">
                    <Link href="/dashboard/rentals">
                        View All
                        <ArrowUpRight className="h-4 w-4" />
                    </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Tool</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="text-right">Issue Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentRentals.map(rental => (
                                <TableRow key={rental.id}>
                                    <TableCell>
                                        <div className="font-medium">{getCustomerName(rental.customer_id)}</div>
                                    </TableCell>
                                    <TableCell>{getToolName(rental.tool_id)}</TableCell>
                                    <TableCell className="text-center">
                                        {getStatusBadge(rental.status)}
                                    </TableCell>
                                    <TableCell className="text-right">{format(parseISO(rental.issue_date), "dd-M-yyyy")}</TableCell>
                                </TableRow>
                            ))}
                            {recentRentals.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">
                                        No recent rentals.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
