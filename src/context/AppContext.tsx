'use client';

import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { format, differenceInCalendarDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

// Types
export type Tool = {
  id: number;
  name: string;
  total_quantity: number;
  available_quantity: number;
  rate: number;
};

export type Customer = {
  id: number;
  name: string;
  phone: string;
  address: string;
};

export type Site = {
  id: number;
  name:string;
};

export type Rental = {
    id: number;
    invoice_number: string;
    tool_id: number;
    customer_id: number;
    site_id: number;
    issue_date: string;
    return_date: string | null;
    status: 'Rented' | 'Returned';
    quantity: number;
    rate: number;
    total_fee: number | null;
};

type RentalItemInput = {
    tool_id: number;
    quantity: number;
    rate: number;
}

type RentalOrderInput = {
    customer_id: number;
    site_id: number;
    issue_date: string;
}

type ResetOptions = {
    tools?: boolean;
    customers?: boolean;
    sites?: boolean;
    rentals?: boolean;
}

// In a real app, this would be replaced with actual API calls to a backend.
// We will now use local JSON files via API routes for persistence.

// Context Type
interface AppContextType {
  tools: Tool[];
  customers: Customer[];
  sites: Site[];
  rentals: Rental[];
  addTool: (tool: Tool) => void;
  editTool: (tool: Tool) => void;
  deleteTool: (id: number) => boolean;
  addCustomer: (customer: Customer) => void;
  editCustomer: (customer: Customer) => void;
  deleteCustomer: (id: number) => void;
  addSite: (site: Site) => void;
  editSite: (site: Site) => void;
  deleteSite: (id: number) => void;
  addRental: (items: RentalItemInput[], orderDetails: RentalOrderInput) => void;
  returnTool: (rentalId: number, quantity: number) => void;
  resetData: (options: ResetOptions) => void;
  isLoading: boolean;
}

// Context
export const AppContext = createContext<AppContextType>({
  tools: [],
  customers: [],
  sites: [],
  rentals: [],
  addTool: () => {},
  editTool: () => {},
  deleteTool: () => false,
  addCustomer: () => {},
  editCustomer: () => {},
  deleteCustomer: () => {},
  addSite: () => {},
  editSite: () => {},
  deleteSite: () => {},
  addRental: () => {},
  returnTool: () => {},
  resetData: () => {},
  isLoading: true,
});

// Provider
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data on initial render
  useEffect(() => {
    const loadData = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/data');
            const data = await response.json();
            setTools(data.tools || []);
            setCustomers(data.customers || []);
            setSites(data.sites || []);
            setRentals(data.rentals || []);
        } catch (error) {
            console.error("Failed to fetch data from API", error);
            // Fallback to empty data if API fails
            setTools([]);
            setCustomers([]);
            setSites([]);
            setRentals([]);
        } finally {
            setIsLoading(false);
        }
    };
    loadData();
  }, []);

  const saveData = async (data: { tools: Tool[], customers: Customer[], sites: Site[], rentals: Rental[] }) => {
     try {
        await fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
     } catch (error) {
        console.error("Failed to save data via API", error);
     }
  };

  // Tool CRUD
  const addTool = (tool: Tool) => {
    const newTools = [...tools, { ...tool, id: Date.now(), available_quantity: tool.total_quantity }];
    setTools(newTools);
    saveData({ tools: newTools, customers, sites, rentals });
  }
  const editTool = (updatedTool: Tool) => {
    const newTools = tools.map(tool => tool.id === updatedTool.id ? updatedTool : tool);
    setTools(newTools);
    saveData({ tools: newTools, customers, sites, rentals });
  };
  const deleteTool = (id: number): boolean => {
     const hasActiveRentals = rentals.some(rental => rental.tool_id === id && rental.status === 'Rented');
     if (hasActiveRentals) {
         return false; // Indicate failure
     }
     const newTools = tools.filter(tool => tool.id !== id);
     setTools(newTools);
     saveData({ tools: newTools, customers, sites, rentals });
     return true; // Indicate success
  }

  // Customer CRUD
  const addCustomer = (customer: Customer) => {
    const newCustomers = [...customers, { ...customer, id: Date.now() }];
    setCustomers(newCustomers);
    saveData({ tools, customers: newCustomers, sites, rentals });
  }
  const editCustomer = (updatedCustomer: Customer) => {
    const newCustomers = customers.map(customer => customer.id === updatedCustomer.id ? updatedCustomer : customer);
    setCustomers(newCustomers);
    saveData({ tools, customers: newCustomers, sites, rentals });
  };
  const deleteCustomer = (id: number) => {
    let updatedTools = [...tools];
    const customerActiveRentals = rentals.filter(r => r.customer_id === id && r.status === 'Rented');

    // Return all items from active rentals to inventory before deleting the customer
    customerActiveRentals.forEach(rental => {
        const toolIndex = updatedTools.findIndex(t => t.id === rental.tool_id);
        if (toolIndex !== -1) {
            updatedTools[toolIndex].available_quantity += rental.quantity;
        }
    });

    // Remove the customer and all their associated rental records
    const newCustomers = customers.filter(customer => customer.id !== id);
    const newRentals = rentals.filter(rental => rental.customer_id !== id);
    
    setCustomers(newCustomers);
    setRentals(newRentals);
    setTools(updatedTools);

    saveData({ tools: updatedTools, customers: newCustomers, sites, rentals: newRentals });
  }

  // Site CRUD
  const addSite = (site: Site) => {
    const newSites = [...sites, { ...site, id: Date.now() }];
    setSites(newSites);
    saveData({ tools, customers, sites: newSites, rentals });
  };
  const editSite = (updatedSite: Site) => {
    const newSites = sites.map(site => site.id === updatedSite.id ? updatedSite : site);
    setSites(newSites);
    saveData({ tools, customers, sites: newSites, rentals });
  };
  const deleteSite = (id: number) => {
    // Note: Deleting a site does not affect inventory, just removes the location option.
    const newSites = sites.filter(site => site.id !== id);
    setSites(newSites);
    saveData({ tools, customers, sites: newSites, rentals });
  }

  // Rental Operations
   const addRental = (items: RentalItemInput[], orderDetails: RentalOrderInput) => {
    const invoice_number = `INV-${Date.now()}`;
    const newRentalsToAdd: Rental[] = items.map(item => ({
        ...orderDetails,
        id: Date.now() + item.tool_id, // simple unique id
        invoice_number: invoice_number,
        tool_id: item.tool_id,
        quantity: item.quantity,
        rate: item.rate,
        status: 'Rented',
        return_date: null,
        total_fee: null,
    }));
    
    const newRentals = [...rentals, ...newRentalsToAdd];
    setRentals(newRentals);

    // Decrease available quantity for each tool
    const newTools = tools.map(tool => {
        const rentedItem = items.find(item => item.tool_id === tool.id);
        if (rentedItem) {
            return { ...tool, available_quantity: tool.available_quantity - rentedItem.quantity }
        }
        return tool;
    });
    setTools(newTools);
    saveData({ tools: newTools, customers, sites, rentals: newRentals });
  };

  const returnTool = (rentalId: number, quantityToReturn: number) => {
    const rentalToUpdate = rentals.find(r => r.id === rentalId);
    if (!rentalToUpdate) return;
  
    let updatedRentals = [...rentals];
    
    const issueDate = new Date(rentalToUpdate.issue_date);
    const returnDate = new Date();
    // Ensure rental period is at least 1 day
    const daysRented = Math.max(1, differenceInCalendarDays(returnDate, issueDate) + 1);
    const feeForReturnedItems = rentalToUpdate.rate * quantityToReturn * daysRented;
  
    if (quantityToReturn >= rentalToUpdate.quantity) {
      // Full return of this specific rental record
      updatedRentals = updatedRentals.map(r =>
        r.id === rentalId
          ? {
              ...r,
              status: 'Returned',
              return_date: format(returnDate, "yyyy-MM-dd"),
              total_fee: (r.total_fee || 0) + feeForReturnedItems,
            }
          : r
      );
    } else {
      // Partial return: 1. Update the original rental's quantity
      updatedRentals = updatedRentals.map(r =>
        r.id === rentalId
          ? { ...r, quantity: r.quantity - quantityToReturn }
          : r
      );
      
      // 2. Create a new, separate "Returned" rental record for the returned items
      const returnedRental: Rental = {
        ...rentalToUpdate,
        id: Date.now(), // New unique ID for the returned portion
        invoice_number: rentalToUpdate.invoice_number, // Keep same invoice for tracking
        quantity: quantityToReturn,
        status: 'Returned',
        return_date: format(returnDate, "yyyy-MM-dd"),
        total_fee: feeForReturnedItems,
      };
      updatedRentals.push(returnedRental);
    }
    setRentals(updatedRentals);

    // Increase available quantity of the tool
    const newTools = tools.map(tool =>
        tool.id === rentalToUpdate.tool_id
          ? { ...tool, available_quantity: tool.available_quantity + quantityToReturn }
          : tool
    );
    setTools(newTools);
    saveData({ tools: newTools, customers, sites, rentals: updatedRentals });
  };

  // Reset Data
  const resetData = (options: ResetOptions) => {
    let updatedTools = [...tools];
    let updatedCustomers = [...customers];
    let updatedSites = [...sites];
    let updatedRentals = [...rentals];

    if (options.rentals) {
        const rentedItems = updatedRentals.filter(r => r.status === 'Rented');
        rentedItems.forEach(rental => {
            const toolIndex = updatedTools.findIndex(t => t.id === rental.tool_id);
            if (toolIndex !== -1) {
                 updatedTools[toolIndex].available_quantity += rental.quantity;
            }
        });
        updatedRentals = [];
    }
    if (options.tools) {
        updatedTools = [];
        updatedRentals = []; // Can't have rentals without tools
    }
    if (options.customers) {
        const rentedItems = updatedRentals.filter(r => r.status === 'Rented');
         rentedItems.forEach(rental => {
             const toolIndex = updatedTools.findIndex(t => t.id === rental.tool_id);
             if (toolIndex !== -1) {
                  updatedTools[toolIndex].available_quantity += rental.quantity;
             }
         });
        updatedCustomers = [];
        updatedRentals = []; // Can't have rentals without customers
    }
    if(options.sites) {
        updatedSites = [];
    }
    
    setTools(updatedTools);
    setCustomers(updatedCustomers);
    setSites(updatedSites);
    setRentals(updatedRentals);
    
    saveData({
        tools: updatedTools,
        customers: updatedCustomers,
        sites: updatedSites,
        rentals: updatedRentals
    });
  }


  return (
    <AppContext.Provider value={{
      tools,
      customers,
      sites,
      rentals,
      addTool,
      editTool,
      deleteTool,
      addCustomer,
      editCustomer,
      deleteCustomer,
      addSite,
      editSite,
      deleteSite,
      addRental,
      returnTool,
      resetData,
      isLoading,
    }}>
      {isLoading ? (
        <div className="flex items-center justify-center h-screen w-screen">
          <p className="text-lg">Loading data...</p>
        </div>
      ) : (
        children
      )}
    </AppContext.Provider>
  );
};
