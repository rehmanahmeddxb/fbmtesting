'use client';

import React, { createContext, useState, ReactNode } from 'react';
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
  addRental: (rental: Omit<Rental, 'id' | 'invoice_number' | 'status' | 'return_date' | 'total_fee'> & { id?: number }) => void;
  returnTool: (rentalId: number) => void;
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
});

// Provider
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);

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
  const addRental = (rentalData: Omit<Rental, 'id' | 'invoice_number' | 'status' | 'return_date' | 'total_fee'> & { id?: number }) => {
    const newRental: Rental = {
        ...rentalData,
        id: rentalData.id || Date.now(),
        invoice_number: `INV-${Date.now()}`,
        status: 'Rented',
        return_date: null,
        total_fee: null,
    };
    setRentals(prev => [...prev, newRental]);
    // Decrease available quantity of the tool
    setTools(prevTools => prevTools.map(tool =>
        tool.id === rentalData.tool_id
            ? { ...tool, available_quantity: tool.available_quantity - rentalData.quantity }
            : tool
    ));
  };

  const returnTool = (rentalId: number) => {
    let returnedRental: Rental | undefined;

    const updatedRentals = rentals.map(r => {
        if (r.id === rentalId) {
            const issueDate = new Date(r.issue_date);
            const returnDate = new Date();
            // Add 1 to include the start day in the rental period
            const daysRented = differenceInCalendarDays(returnDate, issueDate) + 1;
            const total_fee = r.rate * r.quantity * (daysRented > 0 ? daysRented : 1);

            returnedRental = {
                ...r,
                status: 'Returned',
                return_date: format(returnDate, "yyyy-MM-dd"),
                total_fee: total_fee,
            };
            return returnedRental;
        }
        return r;
    });

    if (returnedRental) {
      setRentals(updatedRentals);
      // Increase available quantity of the tool
      const rentalToUpdate = returnedRental;
      setTools(prevTools => prevTools.map(tool => {
        if (tool.id === rentalToUpdate.tool_id) {
          return { ...tool, available_quantity: tool.available_quantity + rentalToUpdate.quantity };
        }
        return tool;
      }));
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
    }}>
      {children}
    </AppContext.Provider>
  );
};
