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
  returnTool: (rentalId: number, quantity: number) => void;
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
    }}>
      {children}
    </AppContext.Provider>
  );
};
