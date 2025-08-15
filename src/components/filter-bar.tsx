'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/date-range-picker";
import { Button } from "@/components/ui/button";
import { Customer, Site, Tool } from "@/context/AppContext";
import { DateRange } from "react-day-picker";

interface FilterBarProps {
  customers: Customer[];
  sites: Site[];
  tools: Tool[];
  selectedCustomerId: string | null;
  setSelectedCustomerId: (value: string | null) => void;
  selectedSiteId: string | null;
  setSelectedSiteId: (value: string | null) => void;
  selectedToolId: string | null;
  setSelectedToolId: (value: string | null) => void;
  dateRange: DateRange | undefined;
  setDateRange: (date: DateRange | undefined) => void;
  onReset: () => void;
}

export default function FilterBar({
  customers,
  sites,
  tools,
  selectedCustomerId,
  setSelectedCustomerId,
  selectedSiteId,
  setSelectedSiteId,
  selectedToolId,
  setSelectedToolId,
  dateRange,
  setDateRange,
  onReset
}: FilterBarProps) {
    
  const hasActiveFilters = selectedCustomerId || selectedSiteId || selectedToolId || dateRange;

  return (
    <div className="flex flex-wrap items-center gap-4 pt-4 border-t mt-4">
      <Select value={selectedCustomerId || "all"} onValueChange={(value) => setSelectedCustomerId(value === "all" ? null : value)}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Filter by Customer" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Customers</SelectItem>
          {customers.map(customer => (
            <SelectItem key={customer.id} value={String(customer.id)}>
              {customer.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedSiteId || "all"} onValueChange={(value) => setSelectedSiteId(value === "all" ? null : value)}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Filter by Site" />
        </SelectTrigger>
        <SelectContent>
           <SelectItem value="all">All Sites</SelectItem>
          {sites.map(site => (
            <SelectItem key={site.id} value={String(site.id)}>
              {site.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedToolId || "all"} onValueChange={(value) => setSelectedToolId(value === "all" ? null : value)}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Filter by Tool" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Tools</SelectItem>
          {tools.map(tool => (
            <SelectItem key={tool.id} value={String(tool.id)}>
              {tool.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <DateRangePicker date={dateRange} setDate={setDateRange} />
      
      {hasActiveFilters && (
        <Button variant="ghost" onClick={onReset}>
            Reset Filters
        </Button>
      )}
    </div>
  );
}
