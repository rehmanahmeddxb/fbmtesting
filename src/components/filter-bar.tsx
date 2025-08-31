'use client';

import * as React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { DateRangePicker } from './date-range-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Customer, Site, Tool } from '@/context/AppContext';
import { DateRange } from 'react-day-picker';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  selectedStatus: string | null;
  setSelectedStatus: (value: string | null) => void;
  dateRange: DateRange | undefined;
  setDateRange: (date: DateRange | undefined) => void;
  onReset: () => void;
}

interface ComboboxProps {
  items: { value: string; label: string }[];
  selectedValue: string | null;
  onSelectValue: (value: string | null) => void;
  placeholder: string;
  searchPlaceholder: string;
}

function ComboboxFilter({ items, selectedValue, onSelectValue, placeholder, searchPlaceholder }: ComboboxProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full sm:w-[180px] justify-between font-normal"
        >
          {selectedValue ? items.find((item) => item.value === selectedValue)?.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[180px] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all"
                onSelect={() => {
                  onSelectValue(null);
                  setOpen(false);
                }}
              >
                All
              </CommandItem>
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.label}
                  onSelect={() => {
                    onSelectValue(item.value === selectedValue ? null : item.value);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4', selectedValue === item.value ? 'opacity-100' : 'opacity-0')} />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
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
  selectedStatus,
  setSelectedStatus,
  dateRange,
  setDateRange,
  onReset,
}: FilterBarProps) {
  const hasActiveFilters = selectedCustomerId || selectedSiteId || selectedToolId || dateRange || selectedStatus;

  const customerItems = customers.map(c => ({ value: String(c.id), label: c.name }));
  const siteItems = sites.map(s => ({ value: String(s.id), label: s.name }));
  const toolItems = tools.map(t => ({ value: String(t.id), label: t.name }));

  return (
    <div className="flex flex-wrap items-center gap-4 pt-4 border-t mt-4">
      <ComboboxFilter
        items={customerItems}
        selectedValue={selectedCustomerId}
        onSelectValue={setSelectedCustomerId}
        placeholder="Filter by Customer"
        searchPlaceholder="Search customers..."
      />

      <ComboboxFilter
        items={siteItems}
        selectedValue={selectedSiteId}
        onSelectValue={setSelectedSiteId}
        placeholder="Filter by Site"
        searchPlaceholder="Search sites..."
      />
      
      <ComboboxFilter
        items={toolItems}
        selectedValue={selectedToolId}
        onSelectValue={setSelectedToolId}
        placeholder="Filter by Tool"
        searchPlaceholder="Search tools..."
      />

      <Select value={selectedStatus || 'all'} onValueChange={(value) => setSelectedStatus(value === 'all' ? null : value)}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Filter by Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="Rented">Rented</SelectItem>
          <SelectItem value="Returned">Returned</SelectItem>
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
