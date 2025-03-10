import { IStorage } from "./types";
import {
  User,
  InsertUser,
  Category,
  InsertCategory,
  Transaction,
  InsertTransaction,
  Budget,
  InsertBudget,
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private transactions: Map<number, Transaction>;
  private budgets: Map<number, Budget>;
  public sessionStore: session.SessionStore;
  private currentIds: {
    users: number;
    categories: number;
    transactions: number;
    budgets: number;
  };

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.transactions = new Map();
    this.budgets = new Map();
    this.currentIds = {
      users: 1,
      categories: 1,
      transactions: 1,
      budgets: 1,
    };
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const newUser = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  // Category operations
  async getCategories(userId: number): Promise<Category[]> {
    return Array.from(this.categories.values()).filter(
      (cat) => cat.userId === userId,
    );
  }

  async createCategory(category: InsertCategory & { userId: number }): Promise<Category> {
    const id = this.currentIds.categories++;
    const newCategory = { ...category, id };
    this.categories.set(id, newCategory);
    return newCategory;
  }

  // Transaction operations
  async getTransactions(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (tx) => tx.userId === userId,
    );
  }

  async createTransaction(
    transaction: InsertTransaction & { userId: number },
  ): Promise<Transaction> {
    const id = this.currentIds.transactions++;
    const newTransaction = { ...transaction, id };
    this.transactions.set(id, newTransaction);
    return newTransaction;
  }

  async deleteTransaction(id: number): Promise<void> {
    this.transactions.delete(id);
  }

  // Budget operations
  async getBudgets(userId: number): Promise<Budget[]> {
    return Array.from(this.budgets.values()).filter(
      (budget) => budget.userId === userId,
    );
  }

  async createBudget(budget: InsertBudget & { userId: number }): Promise<Budget> {
    const id = this.currentIds.budgets++;
    const newBudget = { ...budget, id };
    this.budgets.set(id, newBudget);
    return newBudget;
  }

  async updateBudget(id: number, budget: Partial<Budget>): Promise<Budget> {
    const existing = this.budgets.get(id);
    if (!existing) throw new Error("Budget not found");
    const updated = { ...existing, ...budget };
    this.budgets.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
