
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

  const updateStateAndSave = (newState: Partial<{ tools: Tool[], customers: Customer[], sites: Site[], rentals: Rental[] }>) => {
    const currentState = { tools, customers, sites, rentals };
    const updatedState = { ...currentState, ...newState };
    
    if (newState.tools) setTools(newState.tools);
    if (newState.customers) setCustomers(newState.customers);
    if (newState.sites) setSites(newState.sites);
    if (newState.rentals) setRentals(newState.rentals);

    saveData(updatedState);
  };


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
    if (tools.some(t => t.name.toLowerCase() === tool.name.toLowerCase())) {
        return false;
    }
    const newTool = { ...tool, id: Date.now(), available_quantity: tool.total_quantity };
    updateStateAndSave({ tools: [...tools, newTool] });
    return true;
  }

  const editTool = (updatedTool: Tool) => {
    const newTools = tools.map(tool => tool.id === updatedTool.id ? updatedTool : tool);
    updateStateAndSave({ tools: newTools });
  };

  const deleteTool = (id: number): boolean => {
     if (rentals.some(rental => rental.tool_id === id && rental.status !== 'Returned')) {
         return false;
     }
     const newTools = tools.filter(tool => tool.id !== id);
     updateStateAndSave({ tools: newTools });
     return true;
  }

  // Customer CRUD
  const addCustomer = (customer: Customer) => {
    const newCustomer = { ...customer, id: Date.now() };
    updateStateAndSave({ customers: [...customers, newCustomer] });
  }

  const editCustomer = (updatedCustomer: Customer) => {
    const newCustomers = customers.map(customer => customer.id === updatedCustomer.id ? updatedCustomer : customer);
    updateStateAndSave({ customers: newCustomers });
  };

  const deleteCustomer = (id: number) => {
    const customerActiveRentals = rentals.filter(r => r.customer_id === id && r.status !== 'Returned');
    
    let tempTools = [...tools];
    customerActiveRentals.forEach(rental => {
        const toolIndex = tempTools.findIndex(t => t.id === rental.tool_id);
        if (toolIndex !== -1) {
            tempTools[toolIndex] = {
                ...tempTools[toolIndex],
                available_quantity: tempTools[toolIndex].available_quantity + rental.quantity
            };
        }
    });

    const newCustomers = customers.filter(customer => customer.id !== id);
    const newRentals = rentals.filter(rental => rental.customer_id !== id);
    
    updateStateAndSave({
        tools: tempTools,
        customers: newCustomers,
        rentals: newRentals
    });
  }

  // Site CRUD
  const addSite = (site: Site) => {
    const newSite = { ...site, id: Date.now() };
    updateStateAndSave({ sites: [...sites, newSite] });
  };

  const editSite = (updatedSite: Site) => {
    const newSites = sites.map(site => site.id === updatedSite.id ? updatedSite : site);
    updateStateAndSave({ sites: newSites });
  };

  const deleteSite = (id: number) => {
    if (rentals.some(r => r.site_id === id && r.status !== 'Returned')) {
      toast({
        title: "Error",
        description: "Cannot delete a site with active rentals.",
        variant: "destructive"
      });
      return;
    }
    const newSites = sites.filter(site => site.id !== id);
    updateStateAndSave({ sites: newSites });
  }

  // Rental Operations
   const addRental = (items: RentalItemInput[], orderDetails: RentalOrderInput) => {
    const tempTools = [...tools];
    
    items.forEach(item => {
        const toolIndex = tempTools.findIndex(t => t.id === item.tool_id);
        if (toolIndex !== -1) {
            tempTools[toolIndex] = {
                ...tempTools[toolIndex],
                available_quantity: tempTools[toolIndex].available_quantity - item.quantity
            };
        }
    });

    const newRentalsToAdd: Rental[] = items.map(item => ({
        ...orderDetails,
        id: Date.now() + item.tool_id + Math.random(),
        tool_id: item.tool_id,
        quantity: item.quantity,
        rate: item.rate,
        comment: item.comment,
        status: 'Rented',
        return_date: null,
        total_fee: null,
    }));
    
    updateStateAndSave({
        tools: tempTools,
        rentals: [...rentals, ...newRentalsToAdd]
    });
  };

  const editRental = (originalInvoiceNumber: string, items: RentalItemInput[], orderDetails: RentalOrderInput) => {
    let tempTools = [...tools];
    
    // 1. Revert inventory from original rentals that are being edited/removed
    const originalInvoiceRentals = rentals.filter(r => r.invoice_number === originalInvoiceNumber && r.status === 'Rented');
    originalInvoiceRentals.forEach(rental => {
        const toolIndex = tempTools.findIndex(t => t.id === rental.tool_id);
        if (toolIndex !== -1) {
            tempTools[toolIndex].available_quantity += rental.quantity;
        }
    });

    // 2. Remove original 'Rented' rentals for this invoice
    const rentalsWithoutOriginals = rentals.filter(r => r.invoice_number !== originalInvoiceNumber || r.status !== 'Rented');
    
    // 3. Create new rental items
    const newRentalItems: Rental[] = items.map(item => ({
        ...orderDetails,
        id: Date.now() + item.tool_id + Math.random(),
        tool_id: item.tool_id,
        quantity: item.quantity,
        rate: item.rate,
        comment: item.comment,
        status: 'Rented',
        return_date: null,
        total_fee: null,
    }));

    // 4. Update inventory for new/edited rentals
    newRentalItems.forEach(item => {
        const toolIndex = tempTools.findIndex(t => t.id === item.tool_id);
        if (toolIndex !== -1) {
            tempTools[toolIndex].available_quantity -= item.quantity;
        }
    });
    
    // 5. Combine and set state
    const finalRentals = [...rentalsWithoutOriginals, ...newRentalItems];
    updateStateAndSave({ tools: tempTools, rentals: finalRentals });
  };


  const returnTool = (rentalId: number, quantityToReturn: number) => {
    const rentalToUpdate = rentals.find(r => r.id === rentalId);
    if (!rentalToUpdate) return;
  
    let tempRentals = [...rentals];
    
    const issueDate = parseISO(rentalToUpdate.issue_date);
    const returnDate = new Date();
    const daysRented = Math.max(0, differenceInCalendarDays(returnDate, issueDate)) + 1;
    const feeForReturnedItems = rentalToUpdate.rate * quantityToReturn * daysRented;
  
    if (quantityToReturn >= rentalToUpdate.quantity) {
      tempRentals = tempRentals.map(r =>
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
      tempRentals = tempRentals.map(r =>
        r.id === rentalId
          ? { ...r, quantity: r.quantity - quantityToReturn }
          : r
      );
      
      const returnedRental: Rental = {
        ...rentalToUpdate,
        id: Date.now() + Math.random(),
        quantity: quantityToReturn,
        status: 'Returned Pending',
        return_date: format(returnDate, "yyyy-MM-dd"),
        total_fee: feeForReturnedItems,
      };
      tempRentals.push(returnedRental);
    }
   
    const tempTools = tools.map(tool =>
        tool.id === rentalToUpdate.tool_id
          ? { ...tool, available_quantity: tool.available_quantity + quantityToReturn }
          : tool
    );
    updateStateAndSave({ tools: tempTools, rentals: tempRentals });
  };

  const confirmReturn = (rentalId: number) => {
    const updatedRentals = rentals.map(r =>
      r.id === rentalId ? { ...r, status: 'Returned' as RentalStatus } : r
    );
    updateStateAndSave({ rentals: updatedRentals });
  };

  const undoReturn = (rentalId: number) => {
    const rentalToUndo = rentals.find(r => r.id === rentalId);
    if (!rentalToUndo) return;

    const originalRental = rentals.find(r => 
        r.tool_id === rentalToUndo.tool_id && 
        r.invoice_number === rentalToUndo.invoice_number &&
        r.status === 'Rented'
    );
    
    let tempRentals: Rental[];

    if (originalRental) {
        tempRentals = rentals.map(r => 
            r.id === originalRental.id 
            ? { ...r, quantity: r.quantity + rentalToUndo.quantity }
            : r
        ).filter(r => r.id !== rentalToUndo.id);
    } else {
        tempRentals = rentals.map(r => 
            r.id === rentalId 
            ? { ...r, status: 'Rented', return_date: null, total_fee: null } 
            : r
        );
    }
    
    const tempTools = tools.map(tool =>
        tool.id === rentalToUndo.tool_id
          ? { ...tool, available_quantity: tool.available_quantity - rentalToUndo.quantity }
          : tool
    );
    
    updateStateAndSave({ tools: tempTools, rentals: tempRentals });
  };

  // Reset Data
  const resetData = (options: ResetOptions) => {
    let finalState: { tools: Tool[], customers: Customer[], sites: Site[], rentals: Rental[] } = {
        tools: [...tools],
        customers: [...customers],
        sites: [...sites],
        rentals: [...rentals],
    };

    if (options.rentals) {
        finalState.rentals = [];
        finalState.tools = finalState.tools.map(t => ({ ...t, available_quantity: t.total_quantity }));
    }
    if (options.tools) {
        finalState.tools = [];
        finalState.rentals = [];
    }
    if (options.customers) {
        finalState.customers = [];
        finalState.rentals = [];
        finalState.tools = finalState.tools.map(t => ({ ...t, available_quantity: t.total_quantity }));
    }
    if(options.sites) {
        finalState.sites = [];
        finalState.rentals = [];
        finalState.tools = finalState.tools.map(t => ({ ...t, available_quantity: t.total_quantity }));
    }
    
    updateStateAndSave(finalState);
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
