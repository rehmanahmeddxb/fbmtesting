'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle, FileDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useContext, useMemo, useState } from "react";
import { AppContext } from "@/context/AppContext";
import { DateRange } from "react-day-picker";
import { isWithinInterval, parseISO } from "date-fns";
import FilterBar from "@/components/filter-bar";

export default function RentalsPage() {
  const { rentals, tools, customers, sites, returnTool } = useContext(AppContext);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const getToolName = (id: number) => tools.find(t => t.id === id)?.name || 'Unknown Tool';
  const getCustomerName = (id: number) => customers.find(c => c.id === id)?.name || 'Unknown Customer';
  const getSiteName = (id: number) => sites.find(s => s.id === id)?.name || 'Unknown Site';

  const filteredRentals = useMemo(() => {
    return rentals.filter(rental => {
      const issueDate = parseISO(rental.issue_date);
      const isDateInRange = !dateRange?.from || isWithinInterval(issueDate, { start: dateRange.from, end: dateRange.to || dateRange.from });
      const isCustomerMatch = !selectedCustomerId || rental.customer_id === parseInt(selectedCustomerId);
      const isSiteMatch = !selectedSiteId || rental.site_id === parseInt(selectedSiteId);
      const isToolMatch = !selectedToolId || rental.tool_id === parseInt(selectedToolId);

      return isDateInRange && isCustomerMatch && isSiteMatch && isToolMatch;
    });
  }, [rentals, dateRange, selectedCustomerId, selectedSiteId, selectedToolId]);
  
  const handleResetFilters = () => {
    setSelectedCustomerId(null);
    setSelectedSiteId(null);
    setSelectedToolId(null);
    setDateRange(undefined);
  };


  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <div>
            <CardTitle>Rental Tracker</CardTitle>
            <CardDescription>Track all tool rentals, both active and returned.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <FileDown className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button asChild>
              <Link href="/dashboard/rentals/rent">
                <PlusCircle className="mr-2 h-4 w-4" /> New Rental
              </Link>
            </Button>
          </div>
        </div>
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
            onReset={handleResetFilters}
        />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Tool</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead>Return Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRentals.map((rental) => (
              <TableRow key={rental.id}>
                <TableCell className="font-mono font-code">{rental.invoice_number}</TableCell>
                <TableCell className="font-medium">{getToolName(rental.tool_id)}</TableCell>
                <TableCell>{rental.quantity}</TableCell>
                <TableCell>{getCustomerName(rental.customer_id)}</TableCell>
                <TableCell>{getSiteName(rental.site_id)}</TableCell>
                <TableCell>{rental.issue_date}</TableCell>
                <TableCell>{rental.return_date || 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant={rental.status === 'Rented' ? 'default' : 'secondary'} className={rental.status === 'Rented' ? 'bg-accent text-accent-foreground' : ''}>
                    {rental.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      {rental.status === 'Rented' && <DropdownMenuItem onClick={() => returnTool(rental.id)}>Return Tool</DropdownMenuItem>}
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {rentals.length > 0 && filteredRentals.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={9} className="text-center h-24">
                       No results found for the selected filters.
                    </TableCell>
                </TableRow>
            )}
            {rentals.length === 0 && (
                <TableRow>
                    <TableCell colSpan={9} className="text-center h-24">
                        No rentals found.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
