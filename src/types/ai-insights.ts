export type AiConfidence = "low" | "medium" | "high";

export type AiInventoryAction = "restock" | "reduce" | "monitor" | "promote";

export type AiInsightCategory =
  | "sales"
  | "inventory"
  | "profit"
  | "customers"
  | "general";

export type AiSalesForecast = {
  outlook: string;
  expectedChangePercent: number | null;
  confidence: AiConfidence;
  rationale: string;
};

export type AiInventoryRecommendation = {
  productName: string;
  action: AiInventoryAction;
  reason: string;
  priority: "high" | "medium" | "low";
};

export type AiRestockSuggestion = {
  productName: string;
  suggestion: string;
};

export type AiInsightItem = {
  title: string;
  detail: string;
  category: AiInsightCategory;
};

export type AiGeneratedInsights = {
  summary: string;
  salesForecast: AiSalesForecast;
  inventoryRecommendations: AiInventoryRecommendation[];
  bestSellingAnalysis: string;
  slowMovingAnalysis: string;
  restockingRecommendations: AiRestockSuggestion[];
  insights: AiInsightItem[];
};

export type AiWeekdaySales = {
  weekday: string;
  averageSales: number;
  transactionCount: number;
};

export type AiProductMetric = {
  name: string;
  sku: string;
  quantitySold: number;
  revenue: number;
  stock?: number;
};

export type AiLowStockMetric = {
  name: string;
  sku: string;
  quantity: number;
  minStockLevel: number;
  status: string;
};

export type AiInsightsSnapshot = {
  storeName: string;
  rangeLabel: string;
  generatedAt: string;
  hasEnoughData: boolean;
  dataNotes: string[];
  summary: {
    revenue: number;
    transactions: number;
    averageTicket: number;
    grossProfit: number;
    expenses: number;
    netProfit: number;
    itemsSold: number;
  };
  recentTrend: {
    label: string;
    sales: number;
    transactions: number;
  }[];
  weekdaySales: AiWeekdaySales[];
  bestSellers: AiProductMetric[];
  slowMoving: AiProductMetric[];
  lowStock: AiLowStockMetric[];
  categorySales: {
    categoryName: string;
    revenue: number;
    quantitySold: number;
  }[];
};

export type AiInsightsResponse =
  | {
      status: "ok";
      source: "gemini" | "openai";
      model: string;
      snapshot: AiInsightsSnapshot;
      insights: AiGeneratedInsights;
    }
  | {
      status: "unconfigured";
      message: string;
      snapshot: AiInsightsSnapshot;
    }
  | {
      status: "insufficient_data";
      message: string;
      snapshot: AiInsightsSnapshot;
    }
  | {
      status: "error";
      message: string;
      snapshot: AiInsightsSnapshot;
    };
