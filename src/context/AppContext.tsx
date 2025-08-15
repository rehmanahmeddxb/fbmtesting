'use client';

import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { format, differenceInCalendarDays } from 'date-fns';

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
  deleteTool: (id: number) => void;
  addCustomer: (customer: Customer) => void;
  editCustomer: (customer: Customer) => void;
  deleteCustomer: (id: number) => void;
  addSite: (site: Site) => void;
  editSite: (site: Site) => void;
  deleteSite: (id: number) => void;
  addRental: (items: RentalItemInput[], orderDetails: RentalOrderInput) => void;
  returnTool: (rentalId: number, quantity: number) => void;
  resetData: () => void;
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
  deleteTool: () => {},
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
            setTools(data.tools);
            setCustomers(data.customers);
            setSites(data.sites);
            setRentals(data.rentals);
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
    const newTools = [...tools, { ...tool, id: Date.now() }];
    setTools(newTools);
    saveData({ tools: newTools, customers, sites, rentals });
  }
  const editTool = (updatedTool: Tool) => {
    const newTools = tools.map(tool => tool.id === updatedTool.id ? updatedTool : tool);
    setTools(newTools);
    saveData({ tools: newTools, customers, sites, rentals });
  };
  const deleteTool = (id: number) => {
     const newTools = tools.filter(tool => tool.id !== id);
     setTools(newTools);
     saveData({ tools: newTools, customers, sites, rentals });
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
    const newCustomers = customers.filter(customer => customer.id !== id);
    setCustomers(newCustomers);
    saveData({ tools, customers: newCustomers, sites, rentals });
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
    // Add 1 to include the start day in the rental period
    const daysRented = differenceInCalendarDays(returnDate, issueDate) + 1;
    const feeForReturnedItems = rentalToUpdate.rate * quantityToReturn * (daysRented > 0 ? daysRented : 1);
  
    if (quantityToReturn === rentalToUpdate.quantity) {
      updatedRentals = updatedRentals.map(r =>
        r.id === rentalId
          ? {
              ...r,
              status: 'Returned',
              return_date: format(returnDate, "yyyy-MM-dd"),
              total_fee: feeForReturnedItems,
            }
          : r
      );
    } else {
      // 1. Update the original rental quantity
      updatedRentals = updatedRentals.map(r =>
        r.id === rentalId
          ? { ...r, quantity: r.quantity - quantityToReturn }
          : r
      );
      
      // 2. Create a new rental record for the returned items
      const returnedRental: Rental = {
        ...rentalToUpdate,
        id: Date.now(), // New unique ID
        invoice_number: `${rentalToUpdate.invoice_number}-RTN`,
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
  const resetData = () => {
    const emptyData = {
        tools: [],
        customers: [],
        sites: [],
        rentals: [],
    };
    setTools(emptyData.tools);
    setCustomers(emptyData.customers);
    setSites(emptyData.sites);
    setRentals(emptyData.rentals);
    saveData(emptyData);
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
