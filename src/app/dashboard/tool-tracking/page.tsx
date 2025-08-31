'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useContext, useMemo, useState } from "react";
import { AppContext } from "@/context/AppContext";
import { DateRange } from "react-day-picker";
import { isWithinInterval, parseISO } from "date-fns";
import FilterBar from "@/components/filter-bar";

type AggregatedRental = {
    customerId: number;
    toolId: number;
    status: 'Rented' | 'Returned';
    totalQuantity: number;
};

export default function ToolTrackingPage() {
    const { rentals, tools, customers, sites } = useContext(AppContext);
    
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
    const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    const getToolName = (id: number) => tools.find(t => t.id === id)?.name || 'Unknown Tool';
    const getCustomerName = (id: number) => customers.find(c => c.id === id)?.name || 'Unknown Customer';

    const aggregatedData = useMemo(() => {
        const filtered = rentals.filter(rental => {
            const issueDate = parseISO(rental.issue_date);
            const isDateInRange = !dateRange?.from || isWithinInterval(issueDate, { start: dateRange.from, end: dateRange.to || dateRange.from });
            const isCustomerMatch = !selectedCustomerId || rental.customer_id === parseInt(selectedCustomerId);
            const isSiteMatch = !selectedSiteId || rental.site_id === parseInt(selectedSiteId);
            const isToolMatch = !selectedToolId || rental.tool_id === parseInt(selectedToolId);
            const isStatusMatch = !selectedStatus || rental.status === selectedStatus;

            return isDateInRange && isCustomerMatch && isSiteMatch && isToolMatch && isStatusMatch;
        });

        const aggregation = filtered.reduce<Record<string, AggregatedRental>>((acc, rental) => {
            const key = `${rental.customer_id}-${rental.tool_id}-${rental.status}`;
            if (!acc[key]) {
                acc[key] = {
                    customerId: rental.customer_id,
                    toolId: rental.tool_id,
                    status: rental.status,
                    totalQuantity: 0,
                };
            }
            acc[key].totalQuantity += rental.quantity;
            return acc;
        }, {});

        return Object.values(aggregation);

    }, [rentals, dateRange, selectedCustomerId, selectedSiteId, selectedToolId, selectedStatus]);

    const handleResetFilters = () => {
        setSelectedCustomerId(null);
        setSelectedSiteId(null);
        setSelectedToolId(null);
        setSelectedStatus(null);
        setDateRange(undefined);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Tool Tracking Summary</CardTitle>
                <CardDescription>Aggregated view of tools rented by each customer.</CardDescription>
                <FilterBar
                    customers={customers}
                    sites={sites}
                    tools={tools}
                    selectedCustomerId={selectedCustomerId}
                    setSelectedCustomerId={setSelectedCustomerId}
                    selectedSiteId={selectedSiteId}
                    setSelectedSiteId={setSelectedSiteId}
                    selectedToolId={selectedToolId}
                    setSelectedToolId={setSelectedToolId}
                    dateRange={dateRange}
                    setDateRange={setDateRange}
                    selectedStatus={selectedStatus}
                    setSelectedStatus={setSelectedStatus}
                    onReset={handleResetFilters}
                />
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Tool</TableHead>
                            <TableHead className="text-center">Total Quantity</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {aggregatedData.map((item, index) => (
                            <TableRow key={`${item.customerId}-${item.toolId}-${item.status}-${index}`}>
                                <TableCell className="font-medium">{getCustomerName(item.customerId)}</TableCell>
                                <TableCell>{getToolName(item.toolId)}</TableCell>
                                <TableCell className="text-center">{item.totalQuantity}</TableCell>
                                <TableCell>
                                    <Badge variant={item.status === 'Rented' ? 'default' : 'secondary'} className={item.status === 'Rented' ? 'bg-accent text-accent-foreground' : ''}>
                                        {item.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                        {rentals.length > 0 && aggregatedData.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">
                                    No results found for the selected filters.
                                </TableCell>
                            </TableRow>
                        )}
                        {rentals.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">
                                    No rental data to aggregate.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
