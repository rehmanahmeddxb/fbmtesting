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
// For this version, we will use mock data that is persisted to localStorage.
const initialData = {
    tools: [
        { id: 1, name: 'Hammer Drill', total_quantity: 10, available_quantity: 10, rate: 15.00 },
        { id: 2, name: 'Jackhammer', total_quantity: 5, available_quantity: 5, rate: 50.00 },
        { id: 3, name: 'Scaffolding Set', total_quantity: 20, available_quantity: 20, rate: 25.00 },
    ],
    customers: [
        { id: 1, name: 'John Doe Construction', phone: '123-456-7890', address: '123 Main St' },
        { id: 2, name: 'Jane Smith Renovations', phone: '098-765-4321', address: '456 Oak Ave' },
    ],
    sites: [
        { id: 1, name: 'Downtown Tower Project' },
        { id: 2, name: 'Suburb Residential Complex' },
    ],
    rentals: []
}

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
    const loadData = () => {
        setIsLoading(true);
        try {
            const toolsData = JSON.parse(localStorage.getItem('fbm_tools') || JSON.stringify(initialData.tools));
            const customersData = JSON.parse(localStorage.getItem('fbm_customers') || JSON.stringify(initialData.customers));
            const sitesData = JSON.parse(localStorage.getItem('fbm_sites') || JSON.stringify(initialData.sites));
            const rentalsData = JSON.parse(localStorage.getItem('fbm_rentals') || JSON.stringify(initialData.rentals));

            setTools(toolsData);
            setCustomers(customersData);
            setSites(sitesData);
            setRentals(rentalsData);
        } catch (error) {
            console.error("Failed to parse data from localStorage", error);
            // Fallback to initial data if parsing fails
            setTools(initialData.tools);
            setCustomers(initialData.customers);
            setSites(initialData.sites);
            setRentals(initialData.rentals);
        } finally {
            setIsLoading(false);
        }
    };
    loadData();
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    if(!isLoading) {
        localStorage.setItem('fbm_tools', JSON.stringify(tools));
        localStorage.setItem('fbm_customers', JSON.stringify(customers));
        localStorage.setItem('fbm_sites', JSON.stringify(sites));
        localStorage.setItem('fbm_rentals', JSON.stringify(rentals));
    }
  }, [tools, customers, sites, rentals, isLoading]);

  // Tool CRUD
  const addTool = (tool: Tool) => setTools(prev => [...prev, { ...tool, id: Date.now() }]);
  const editTool = (updatedTool: Tool) => {
    setTools(prev => prev.map(tool => tool.id === updatedTool.id ? updatedTool : tool));
  };
  const deleteTool = (id: number) => setTools(prev => prev.filter(tool => tool.id !== id));

  // Customer CRUD
  const addCustomer = (customer: Customer) => setCustomers(prev => [...prev, { ...customer, id: Date.now() }]);
  const editCustomer = (updatedCustomer: Customer) => {
    setCustomers(prev => prev.map(customer => customer.id === updatedCustomer.id ? updatedCustomer : customer));
  };
  const deleteCustomer = (id: number) => setCustomers(prev => prev.filter(customer => customer.id !== id));

  // Site CRUD
  const addSite = (site: Site) => setSites(prev => [...prev, { ...site, id: Date.now() }]);
  const editSite = (updatedSite: Site) => {
    setSites(prev => prev.map(site => site.id === updatedSite.id ? updatedSite : site));
  };
  const deleteSite = (id: number) => setSites(prev => prev.filter(site => site.id !== id));

  // Rental Operations
   const addRental = (items: RentalItemInput[], orderDetails: RentalOrderInput) => {
    const invoice_number = `INV-${Date.now()}`;
    const newRentals: Rental[] = items.map(item => ({
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

    setRentals(prev => [...prev, ...newRentals]);

    // Decrease available quantity for each tool
    items.forEach(item => {
        setTools(prevTools => prevTools.map(tool =>
            tool.id === item.tool_id
                ? { ...tool, available_quantity: tool.available_quantity - item.quantity }
                : tool
        ));
    });
  };

  const returnTool = (rentalId: number, quantityToReturn: number) => {
    const rentalToUpdate = rentals.find(r => r.id === rentalId);
    if (!rentalToUpdate) return;
  
    // Increase available quantity of the tool
    setTools(prevTools => prevTools.map(tool =>
      tool.id === rentalToUpdate.tool_id
        ? { ...tool, available_quantity: tool.available_quantity + quantityToReturn }
        : tool
    ));
  
    const issueDate = new Date(rentalToUpdate.issue_date);
    const returnDate = new Date();
    // Add 1 to include the start day in the rental period
    const daysRented = differenceInCalendarDays(returnDate, issueDate) + 1;
    const feeForReturnedItems = rentalToUpdate.rate * quantityToReturn * (daysRented > 0 ? daysRented : 1);
  
    // If all items are returned, update the existing rental record
    if (quantityToReturn === rentalToUpdate.quantity) {
      setRentals(prevRentals => prevRentals.map(r =>
        r.id === rentalId
          ? {
              ...r,
              status: 'Returned',
              return_date: format(returnDate, "yyyy-MM-dd"),
              total_fee: feeForReturnedItems,
            }
          : r
      ));
    } else {
      // If partially returned, update the original rental and create a new one for the returned items
      
      // 1. Update the original rental quantity
      setRentals(prevRentals => prevRentals.map(r =>
        r.id === rentalId
          ? { ...r, quantity: r.quantity - quantityToReturn }
          : r
      ));
      
      // 2. Create a new rental record for the returned items
      const returnedRental: Rental = {
        ...rentalToUpdate,
        id: Date.now(), // New unique ID
        invoice_number: `${rentalToUpdate.invoice_number}-RTN`, // Indicate it's a return
        quantity: quantityToReturn,
        status: 'Returned',
        return_date: format(returnDate, "yyyy-MM-dd"),
        total_fee: feeForReturnedItems,
      };
      setRentals(prev => [...prev, returnedRental]);
    }
  };


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
