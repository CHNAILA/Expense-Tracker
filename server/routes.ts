import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertTransactionSchema, insertCategorySchema, insertBudgetSchema } from "@shared/schema";

// Default categories for new users
const DEFAULT_EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Utilities",
  "Housing",
  "Healthcare",
  "Entertainment",
  "Shopping",
  "Education",
  "Personal Care",
  "Others"
];

const DEFAULT_INCOME_CATEGORIES = [
  "Salary",
  "Business",
  "Investments",
  "Freelance",
  "Other Income"
];

async function createDefaultCategories(userId: number) {
  for (const name of DEFAULT_EXPENSE_CATEGORIES) {
    await storage.createCategory({
      name,
      type: "expense",
      userId,
    });
  }

  for (const name of DEFAULT_INCOME_CATEGORIES) {
    await storage.createCategory({
      name,
      type: "income",
      userId,
    });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app, createDefaultCategories);

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Categories
  app.get("/api/categories", requireAuth, async (req, res) => {
    const categories = await storage.getCategories(req.user!.id);
    res.json(categories);
  });

  app.post("/api/categories", requireAuth, async (req, res) => {
    const data = insertCategorySchema.parse(req.body);
    const category = await storage.createCategory({
      ...data,
      userId: req.user!.id,
    });
    res.json(category);
  });

  // Transactions
  app.get("/api/transactions", requireAuth, async (req, res) => {
    const transactions = await storage.getTransactions(req.user!.id);
    res.json(transactions);
  });

  app.post("/api/transactions", requireAuth, async (req, res) => {
    const data = insertTransactionSchema.parse(req.body);
    const transaction = await storage.createTransaction({
      ...data,
      userId: req.user!.id,
    });
    res.json(transaction);
  });

  app.patch("/api/transactions/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    const data = insertTransactionSchema.parse(req.body);
    const transaction = await storage.updateTransaction(id, {
      ...data,
      userId: req.user!.id,
    });
    res.json(transaction);
  });

  app.delete("/api/transactions/:id", requireAuth, async (req, res) => {
    await storage.deleteTransaction(parseInt(req.params.id));
    res.sendStatus(200);
  });

  // Budgets
  app.get("/api/budgets", requireAuth, async (req, res) => {
    const budgets = await storage.getBudgets(req.user!.id);
    res.json(budgets);
  });

  app.post("/api/budgets", requireAuth, async (req, res) => {
    const data = insertBudgetSchema.parse(req.body);
    const budget = await storage.createBudget({
      ...data,
      userId: req.user!.id,
    });
    res.json(budget);
  });

  const httpServer = createServer(app);
  return httpServer;
}