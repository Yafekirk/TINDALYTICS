export type CustomerListFilters = {
  q?: string;
  page?: number;
  pageSize?: number;
};

export type CustomerListItem = {
  id: string;
  name: string;
  contactNumber: string | null;
  address: string | null;
  notes: string | null;
  purchaseCount: number;
  totalSpent: number;
  outstandingBalance: number;
  createdAt: string;
  updatedAt: string;
};

export type CustomerListResult = {
  items: CustomerListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type CustomerSale = {
  id: string;
  receiptNumber: string;
  status: string;
  total: number;
  paymentMethod: string;
  createdAt: string;
};

export type CustomerCreditSummary = {
  id: string;
  amount: number;
  balance: number;
  status: string;
  dueDate: string | null;
  createdAt: string;
};

export type CustomerDetail = CustomerListItem & {
  sales: CustomerSale[];
  credits: CustomerCreditSummary[];
};
