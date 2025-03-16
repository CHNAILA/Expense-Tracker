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
  users,
  categories,
  transactions,
  budgets,
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // Category operations
  async getCategories(userId: number): Promise<Category[]> {
    return await db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId))
      .orderBy(categories.name);
  }

  async createCategory(category: InsertCategory & { userId: number }): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getUserByCNIC(cnic: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.cnic, cnic));
    return user;
  }

  async updateUserUsername(id: number, username: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ username })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Transaction operations
  async getTransactions(userId: number): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(transactions.date);
  }

  async createTransaction(
    transaction: InsertTransaction & { userId: number },
  ): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async updateTransaction(
    id: number,
    userId: number,
    transaction: InsertTransaction & { userId: number },
  ): Promise<Transaction | undefined> {
    const [updatedTransaction] = await db
      .update(transactions)
      .set(transaction)
      .where(
        and(
          eq(transactions.id, id),
          eq(transactions.userId, userId)
        )
      )
      .returning();
    return updatedTransaction;
  }

  async deleteTransaction(id: number, userId: number): Promise<void> {
    await db.delete(transactions).where(
      and(
        eq(transactions.id, id),
        eq(transactions.userId, userId)
      )
    );
  }

  // Budget operations
  async getBudgets(userId: number): Promise<Budget[]> {
    return await db
      .select()
      .from(budgets)
      .where(eq(budgets.userId, userId))
      .orderBy(budgets.year, budgets.month);
  }

  async createBudget(budget: InsertBudget & { userId: number }): Promise<Budget> {
    const [newBudget] = await db.insert(budgets).values(budget).returning();
    return newBudget;
  }
}

export const storage = new DatabaseStorage();