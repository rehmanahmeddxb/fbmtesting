export const users = [
  { id: 1, name: "Rehman Ahmed", username: "admin" },
];

export const tools = [
  { id: 1, name: "Hammer Drill", total_quantity: 10, available_quantity: 7, rate: 25.00 },
  { id: 2, name: "Circular Saw", total_quantity: 5, available_quantity: 5, rate: 30.00 },
  { id: 3, name: "Angle Grinder", total_quantity: 8, available_quantity: 6, rate: 20.00 },
  { id: 4, name: "Jigsaw", total_quantity: 6, available_quantity: 3, rate: 22.00 },
  { id: 5, name: "Lawn Mower", total_quantity: 4, available_quantity: 0, rate: 45.00 },
  { id: 6, name: "Pressure Washer", total_quantity: 3, available_quantity: 3, rate: 50.00 },
];

export const customers = [
  { id: 1, name: "John Doe", phone: "555-1234", address: "123 Main St, Anytown, USA" },
  { id: 2, name: "Jane Smith", phone: "555-5678", address: "456 Oak Ave, Anytown, USA" },
  { id: 3, name: "Build-It Corp", phone: "555-9999", address: "789 Industrial Park, Anytown, USA" },
];

export const sites = [
  { id: 1, name: "Downtown Project" },
  { id: 2, name: "Suburbia Residence" },
  { id: 3, name: "Industrial Complex" },
];

export const rentals = [
  {
    id: 1,
    tool_id: 1,
    customer_id: 1,
    site_id: 1,
    quantity: 1,
    rate: 25.00,
    issue_date: "2024-07-15",
    return_date: null,
    comment: "Handle with care",
    manual_book_ref: "HD-101",
    status: "Rented",
    invoice_number: "INV-2024-001",
    total_fee: null,
  },
  {
    id: 2,
    tool_id: 4,
    customer_id: 2,
    site_id: 2,
    quantity: 1,
    rate: 22.00,
    issue_date: "2024-07-20",
    return_date: null,
    comment: "",
    manual_book_ref: "JS-205A",
    status: "Rented",
    invoice_number: "INV-2024-002",
    total_fee: null,
  },
  {
    id: 3,
    tool_id: 5,
    customer_id: 3,
    site_id: 3,
    quantity: 2,
    rate: 45.00,
    issue_date: "2024-07-01",
    return_date: "2024-07-10",
    comment: "Heavy duty usage",
    manual_book_ref: "LM-3000",
    status: "Returned",
    invoice_number: "INV-2024-000",
    total_fee: 810.00,
  },
  {
    id: 4,
    tool_id: 3,
    customer_id: 1,
    site_id: 1,
    quantity: 2,
    rate: 20.00,
    issue_date: "2024-07-22",
    return_date: null,
    comment: "Needs new disc soon",
    manual_book_ref: "AG-45X",
    status: "Rented",
    invoice_number: "INV-2024-003",
    total_fee: null,
  },
];
