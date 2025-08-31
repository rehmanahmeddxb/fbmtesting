
'use client';

import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { format, differenceInCalendarDays, parseISO } from 'date-fns';
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

export type RentalStatus = 'Rented' | 'Returned' | 'Returned Pending';

export type Rental = {
    id: number;
    invoice_number: string;
    tool_id: number;
    customer_id: number;
    site_id: number;
    issue_date: string;
    return_date: string | null;
    status: RentalStatus;
    quantity: number;
    rate: number;
    total_fee: number | null;
    comment?: string;
};

export type RentalItemInput = {
    tool_id: number;
    quantity: number;
    rate: number;
    comment?: string;
}

export type RentalOrderInput = {
    customer_id: number;
    site_id: number;
    issue_date: string;
    invoice_number: string;
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
  addTool: (tool: Tool) => boolean;
  editTool: (tool: Tool) => void;
  deleteTool: (id: number) => boolean;
  addCustomer: (customer: Customer) => void;
  editCustomer: (customer: Customer) => void;
  deleteCustomer: (id: number) => void;
  addSite: (site: Site) => void;
  editSite: (site: Site) => void;
  deleteSite: (id: number) => void;
  addRental: (items: RentalItemInput[], orderDetails: RentalOrderInput) => void;
  editRental: (originalInvoiceNumber: string, items: RentalItemInput[], orderDetails: RentalOrderInput) => void;
  returnTool: (rentalId: number, quantity: number) => void;
  confirmReturn: (rentalId: number) => void;
  undoReturn: (rentalId: number) => void;
  resetData: (options: ResetOptions) => void;
  isLoading: boolean;
}

// Context
export const AppContext = createContext<AppContextType>({
  tools: [],
  customers: [],
  sites: [],
  rentals: [],
  addTool: () => false,
  editTool: () => {},
  deleteTool: () => false,
  addCustomer: () => {},
  editCustomer: () => {},
  deleteCustomer: () => {},
  addSite: () => {},
  editSite: () => {},
  deleteSite: () => {},
  addRental: () => {},
  editRental: () => {},
  returnTool: () => {},
  confirmReturn: () => {},
  undoReturn: () => {},
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
  const { toast } = useToast();


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
  const addTool = (tool: Tool): boolean => {
    const toolExists = tools.some(t => t.name.toLowerCase() === tool.name.toLowerCase());
    if (toolExists) {
        return false; // Indicate failure
    }
    const newTools = [...tools, { ...tool, id: Date.now(), available_quantity: tool.total_quantity }];
    setTools(newTools);
    saveData({ tools: newTools, customers, sites, rentals });
    return true; // Indicate success
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
    const customerActiveRentals = rentals.filter(r => r.customer_id === id && r.status === 'Rented');
    
    // Create a mutable copy of tools to update quantities
    let updatedTools = [...tools];
  
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
    const newRentalsToAdd: Rental[] = items.map(item => ({
        ...orderDetails,
        id: Date.now() + item.tool_id, // simple unique id
        tool_id: item.tool_id,
        quantity: item.quantity,
        rate: item.rate,
        comment: item.comment,
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

  const editRental = (originalInvoiceNumber: string, items: RentalItemInput[], orderDetails: RentalOrderInput) => {
    const originalRentals = rentals.filter(r => r.invoice_number === originalInvoiceNumber && r.status === 'Rented');
    let tempTools = [...tools];
    
    // 1. Revert inventory from original rentals
    originalRentals.forEach(rental => {
        const toolIndex = tempTools.findIndex(t => t.id === rental.tool_id);
        if (toolIndex !== -1) {
            tempTools[toolIndex].available_quantity += rental.quantity;
        }
    });

    // 2. Remove original 'Rented' rentals for this invoice
    const rentalsWithoutOriginal = rentals.filter(r => r.invoice_number !== originalInvoiceNumber || r.status !== 'Rented');

    // 3. Create new rental items
    const newRentalItems: Rental[] = items.map(item => ({
        ...orderDetails,
        id: Date.now() + item.tool_id, // new unique id
        tool_id: item.tool_id,
        quantity: item.quantity,
        rate: item.rate,
        comment: item.comment,
        status: 'Rented',
        return_date: null,
        total_fee: null,
    }));

    // 4. Update inventory for new rentals
    newRentalItems.forEach(item => {
        const toolIndex = tempTools.findIndex(t => t.id === item.tool_id);
        if (toolIndex !== -1) {
            tempTools[toolIndex].available_quantity -= item.quantity;
        }
    });

    // 5. Combine and set state
    const finalRentals = [...rentalsWithoutOriginal, ...newRentalItems];
    setTools(tempTools);
    setRentals(finalRentals);
    saveData({ tools: tempTools, customers, sites, rentals: finalRentals });
  };


  const returnTool = (rentalId: number, quantityToReturn: number) => {
    const rentalToUpdate = rentals.find(r => r.id === rentalId);
    if (!rentalToUpdate) return;
  
    let updatedRentals = [...rentals];
    
    const issueDate = parseISO(rentalToUpdate.issue_date);
    const returnDate = new Date();
    const daysRented = Math.max(1, differenceInCalendarDays(returnDate, issueDate) + 1);
    const feeForReturnedItems = rentalToUpdate.rate * quantityToReturn * daysRented;
  
    if (quantityToReturn >= rentalToUpdate.quantity) {
      // Full return of this specific rental record, mark as pending
      updatedRentals = updatedRentals.map(r =>
        r.id === rentalId
          ? {
              ...r,
              status: 'Returned Pending',
              return_date: format(returnDate, "yyyy-MM-dd"),
              total_fee: feeForReturnedItems,
              quantity: quantityToReturn,
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
      
      // 2. Create a new, separate "Returned Pending" record for the returned items
      const returnedRental: Rental = {
        ...rentalToUpdate,
        id: Date.now(),
        quantity: quantityToReturn,
        status: 'Returned Pending',
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

  const confirmReturn = (rentalId: number) => {
    const updatedRentals = rentals.map(r =>
      r.id === rentalId ? { ...r, status: 'Returned' as RentalStatus } : r
    );
    setRentals(updatedRentals);
    saveData({ tools, customers, sites, rentals: updatedRentals });
  };

  const undoReturn = (rentalId: number) => {
    const rentalToUndo = rentals.find(r => r.id === rentalId);
    if (!rentalToUndo) return;

    // This logic handles merging back if it was a partial return, or just deleting the pending record
    const originalRental = rentals.find(r => 
        r.tool_id === rentalToUndo.tool_id && 
        r.invoice_number === rentalToUndo.invoice_number &&
        r.status === 'Rented'
    );
    
    let updatedRentals: Rental[];

    if (originalRental) {
        // It was a partial return, merge it back
        updatedRentals = rentals.map(r => 
            r.id === originalRental.id 
            ? { ...r, quantity: r.quantity + rentalToUndo.quantity }
            : r
        ).filter(r => r.id !== rentalToUndo.id); // remove the pending record
    } else {
        // It was a full return, just revert its status
        updatedRentals = rentals.map(r => 
            r.id === rentalId 
            ? { ...r, status: 'Rented', return_date: null, total_fee: null } 
            : r
        );
    }
    
    setRentals(updatedRentals);

    // Decrease available quantity of the tool
    const newTools = tools.map(tool =>
        tool.id === rentalToUndo.tool_id
          ? { ...tool, available_quantity: tool.available_quantity - rentalToUndo.quantity }
          : tool
    );
    setTools(newTools);
    saveData({ tools: newTools, customers, sites, rentals: updatedRentals });
  };

  // Reset Data
  const resetData = (options: ResetOptions) => {
    let updatedTools: Tool[] = JSON.parse(JSON.stringify(tools));
    let updatedCustomers: Customer[] = JSON.parse(JSON.stringify(customers));
    let updatedSites: Site[] = JSON.parse(JSON.stringify(sites));
    let updatedRentals: Rental[] = JSON.parse(JSON.stringify(rentals));

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
        // Also clear rentals as sites are mandatory for them
        const rentedItems = updatedRentals.filter(r => r.status === 'Rented');
        rentedItems.forEach(rental => {
            const toolIndex = updatedTools.findIndex(t => t.id === rental.tool_id);
            if (toolIndex !==-1) {
                updatedTools[toolIndex].available_quantity += rental.quantity;
            }
        });
        updatedRentals = [];
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
      editRental,
      returnTool,
      confirmReturn,
      undoReturn,
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
