import { tool } from "ai";
import { z } from "zod";
import { getAiInsightsSnapshot } from "@/lib/services/ai-insights";
import { getCreditSummary, listCredits } from "@/lib/services/credits";
import { listCustomers } from "@/lib/services/customers";
import { getExpenseSummary } from "@/lib/services/expenses";
import { getLowStockAlerts, listInventory } from "@/lib/services/inventory";
import { getSalesSummary } from "@/lib/services/sales";

export function createStoreChatTools(storeId: string, storeName: string) {
  return {
    getStoreOverview: tool({
      description:
        "Get a 30-day overview of this store: revenue, transactions, profit, best sellers, slow movers, and low stock.",
      inputSchema: z.object({}),
      execute: async () => {
        const snapshot = await getAiInsightsSnapshot(storeId, storeName);
        return {
          storeName: snapshot.storeName,
          rangeLabel: snapshot.rangeLabel,
          summary: snapshot.summary,
          bestSellers: snapshot.bestSellers,
          slowMoving: snapshot.slowMoving,
          lowStock: snapshot.lowStock,
          dataNotes: snapshot.dataNotes,
          hasEnoughData: snapshot.hasEnoughData,
        };
      },
    }),

    getSalesSummary: tool({
      description:
        "Get sales totals for this store. Optionally filter by date range (YYYY-MM-DD).",
      inputSchema: z.object({
        dateFrom: z
          .string()
          .optional()
          .describe("Start date YYYY-MM-DD inclusive"),
        dateTo: z
          .string()
          .optional()
          .describe("End date YYYY-MM-DD inclusive"),
      }),
      execute: async ({ dateFrom, dateTo }) => {
        return getSalesSummary(storeId, { dateFrom, dateTo });
      },
    }),

    getLowStockItems: tool({
      description:
        "List products that are low stock or out of stock and should be restocked. Use this for any low-stock / restock question.",
      inputSchema: z.object({
        limit: z
          .number()
          .int()
          .min(1)
          .max(20)
          .optional()
          .describe("Max items to return (default 10)"),
      }),
      execute: async ({ limit }) => {
        const items = await getLowStockAlerts(storeId, limit ?? 10);
        return {
          count: items.length,
          items: items.map((item) => ({
            name: item.name,
            sku: item.sku,
            quantity: item.quantity,
            minStockLevel: item.minStockLevel,
            status: item.status,
            unit: item.unit,
          })),
        };
      },
    }),

    searchInventory: tool({
      description:
        "Search products and stock levels by name or SKU. Use for questions like 'how many Lucky Me left?'.",
      inputSchema: z.object({
        query: z
          .string()
          .min(1)
          .describe("Product name or SKU search text"),
        status: z
          .enum(["all", "in_stock", "low_stock", "out_of_stock"])
          .optional()
          .describe("Optional stock status filter"),
      }),
      execute: async ({ query, status }) => {
        const result = await listInventory(storeId, {
          q: query,
          status: status ?? "all",
          page: 1,
          pageSize: 15,
        });
        return {
          total: result.total,
          summary: result.summary,
          items: result.items.map((item) => ({
            name: item.name,
            sku: item.sku,
            quantity: item.quantity,
            minStockLevel: item.minStockLevel,
            status: item.status,
            sellingPrice: item.sellingPrice,
            unit: item.unit,
          })),
        };
      },
    }),

    getCreditSummary: tool({
      description:
        "Get utang/credit summary (outstanding and overdue balances) and top outstanding accounts.",
      inputSchema: z.object({
        customerQuery: z
          .string()
          .optional()
          .describe("Optional customer name search"),
      }),
      execute: async ({ customerQuery }) => {
        const [summary, outstanding] = await Promise.all([
          getCreditSummary(storeId, { q: customerQuery }),
          listCredits(storeId, {
            status: "outstanding",
            q: customerQuery,
            page: 1,
            pageSize: 8,
          }),
        ]);
        return {
          summary,
          topOutstanding: outstanding.items.map((item) => ({
            customerName: item.customerName,
            balance: item.balance,
            amount: item.amount,
            status: item.status,
            dueDate: item.dueDate,
            isOverdue: item.isOverdue,
          })),
        };
      },
    }),

    getExpenseSummary: tool({
      description:
        "Get expense totals for this store, optionally filtered by date range.",
      inputSchema: z.object({
        dateFrom: z
          .string()
          .optional()
          .describe("Start date YYYY-MM-DD inclusive"),
        dateTo: z
          .string()
          .optional()
          .describe("End date YYYY-MM-DD inclusive"),
      }),
      execute: async ({ dateFrom, dateTo }) => {
        return getExpenseSummary(storeId, { dateFrom, dateTo });
      },
    }),

    searchCustomers: tool({
      description:
        "Search customers by name, contact number, or address.",
      inputSchema: z.object({
        query: z.string().min(1).describe("Customer search text"),
      }),
      execute: async ({ query }) => {
        const result = await listCustomers(storeId, {
          q: query,
          page: 1,
          pageSize: 10,
        });
        return {
          total: result.total,
          items: result.items.map((item) => ({
            name: item.name,
            contactNumber: item.contactNumber,
            address: item.address,
            purchaseCount: item.purchaseCount,
            totalSpent: item.totalSpent,
            outstandingBalance: item.outstandingBalance,
          })),
        };
      },
    }),
  };
}

export type StoreChatTools = ReturnType<typeof createStoreChatTools>;
