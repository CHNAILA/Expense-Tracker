import type { Express } from "express";
import { createServer, type Server } from "http";
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
  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Handle login and user creation
  app.post("/api/login", async (req, res, next) => {
    try {
      const { username, cnic } = req.body;

      // Find or create user
      let user = await storage.getUserByCNIC(cnic);

      if (!user) {
        // Create new user with default categories
        user = await storage.createUser({ username, cnic, password: cnic });
        await createDefaultCategories(user.id);
      }

      // Log in the user
      req.login(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return next(err);
        }
        res.json(user);
      });
    } catch (err) {
      console.error("Login route error:", err);
      next(err);
    }
  });

  // Handle logout
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((err) => {
        if (err) return next(err);
        res.sendStatus(200);
      });
    });
  });

  // Categories
  app.get("/api/categories", requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const categories = await storage.getCategories(userId);
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
    const userId = req.user!.id;
    const transactions = await storage.getTransactions(userId);
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
    const userId = req.user!.id;
    const data = insertTransactionSchema.parse(req.body);
    const transaction = await storage.updateTransaction(id, userId, {
      ...data,
      userId: req.user!.id,
    });
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    res.json(transaction);
  });

  app.delete("/api/transactions/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    const userId = req.user!.id;
    await storage.deleteTransaction(id, userId);
    res.sendStatus(200);
  });

  // Budgets
  app.get("/api/budgets", requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const budgets = await storage.getBudgets(userId);
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