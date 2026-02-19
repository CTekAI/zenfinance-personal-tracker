import type { Express } from "express";
import { isAuthenticated } from "./replit_integrations/auth";
import { db } from "./db";
import { income, outgoings, savings, debt, wishlist } from "@shared/models/finance";
import { eq, and } from "drizzle-orm";

export function registerRoutes(app: Express) {
  app.get("/api/finance", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [incomeData, outgoingsData, savingsData, debtData, wishlistData] = await Promise.all([
        db.select().from(income).where(eq(income.userId, userId)),
        db.select().from(outgoings).where(eq(outgoings.userId, userId)),
        db.select().from(savings).where(eq(savings.userId, userId)),
        db.select().from(debt).where(eq(debt.userId, userId)),
        db.select().from(wishlist).where(eq(wishlist.userId, userId)),
      ]);

      const toNum = (v: string | null) => v ? parseFloat(v) : 0;
      const toNumOrUndef = (v: string | null) => v ? parseFloat(v) : undefined;

      res.json({
        income: incomeData.map(r => ({ id: r.id, source: r.source, amount: toNum(r.amount), category: r.category, frequency: r.frequency })),
        outgoings: outgoingsData.map(r => ({ id: r.id, description: r.description, amount: toNum(r.amount), category: r.category, date: r.date, frequency: r.frequency })),
        savings: savingsData.map(r => ({ id: r.id, name: r.name, balance: toNum(r.balance), target: toNumOrUndef(r.target), category: r.category })),
        debt: debtData.map(r => ({ id: r.id, name: r.name, balance: toNum(r.balance), interestRate: toNum(r.interestRate), minPayment: toNum(r.minPayment), priority: r.priority, deadline: r.deadline || undefined })),
        wishlist: wishlistData.map(r => ({ id: r.id, item: r.item, cost: toNum(r.cost), saved: toNum(r.saved), priority: r.priority, deadline: r.deadline || undefined })),
      });
    } catch (error) {
      console.error("Error fetching finance data:", error);
      res.status(500).json({ message: "Failed to fetch finance data" });
    }
  });

  // Income CRUD
  app.post("/api/finance/income", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { source, amount, category, frequency } = req.body;
      const [row] = await db.insert(income).values({
        userId, source, amount: String(amount), category, frequency,
      }).returning();
      res.json({ id: row.id, source: row.source, amount: parseFloat(row.amount), category: row.category, frequency: row.frequency });
    } catch (error) {
      console.error("Error adding income:", error);
      res.status(500).json({ message: "Failed to add income" });
    }
  });

  app.put("/api/finance/income/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { source, amount, category, frequency } = req.body;
      const [row] = await db.update(income).set({
        source, amount: String(amount), category, frequency,
      }).where(and(eq(income.id, req.params.id), eq(income.userId, userId))).returning();
      if (!row) return res.status(404).json({ message: "Not found" });
      res.json({ id: row.id, source: row.source, amount: parseFloat(row.amount), category: row.category, frequency: row.frequency });
    } catch (error) {
      console.error("Error updating income:", error);
      res.status(500).json({ message: "Failed to update income" });
    }
  });

  app.delete("/api/finance/income/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await db.delete(income).where(and(eq(income.id, req.params.id), eq(income.userId, userId)));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting income:", error);
      res.status(500).json({ message: "Failed to delete income" });
    }
  });

  // Outgoings CRUD
  app.post("/api/finance/outgoings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { description, amount, category, date, frequency } = req.body;
      const [row] = await db.insert(outgoings).values({
        userId, description, amount: String(amount), category, date, frequency,
      }).returning();
      res.json({ id: row.id, description: row.description, amount: parseFloat(row.amount), category: row.category, date: row.date, frequency: row.frequency });
    } catch (error) {
      console.error("Error adding outgoing:", error);
      res.status(500).json({ message: "Failed to add expense" });
    }
  });

  app.put("/api/finance/outgoings/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { description, amount, category, date, frequency } = req.body;
      const [row] = await db.update(outgoings).set({
        description, amount: String(amount), category, date, frequency,
      }).where(and(eq(outgoings.id, req.params.id), eq(outgoings.userId, userId))).returning();
      if (!row) return res.status(404).json({ message: "Not found" });
      res.json({ id: row.id, description: row.description, amount: parseFloat(row.amount), category: row.category, date: row.date, frequency: row.frequency });
    } catch (error) {
      console.error("Error updating outgoing:", error);
      res.status(500).json({ message: "Failed to update expense" });
    }
  });

  app.delete("/api/finance/outgoings/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await db.delete(outgoings).where(and(eq(outgoings.id, req.params.id), eq(outgoings.userId, userId)));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting outgoing:", error);
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  // Savings CRUD
  app.post("/api/finance/savings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, balance, target, category } = req.body;
      const [row] = await db.insert(savings).values({
        userId, name, balance: String(balance), target: target != null ? String(target) : null, category,
      }).returning();
      res.json({ id: row.id, name: row.name, balance: parseFloat(row.balance), target: row.target ? parseFloat(row.target) : undefined, category: row.category });
    } catch (error) {
      console.error("Error adding savings:", error);
      res.status(500).json({ message: "Failed to add savings" });
    }
  });

  app.put("/api/finance/savings/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, balance, target, category } = req.body;
      const [row] = await db.update(savings).set({
        name, balance: String(balance), target: target != null ? String(target) : null, category,
      }).where(and(eq(savings.id, req.params.id), eq(savings.userId, userId))).returning();
      if (!row) return res.status(404).json({ message: "Not found" });
      res.json({ id: row.id, name: row.name, balance: parseFloat(row.balance), target: row.target ? parseFloat(row.target) : undefined, category: row.category });
    } catch (error) {
      console.error("Error updating savings:", error);
      res.status(500).json({ message: "Failed to update savings" });
    }
  });

  app.delete("/api/finance/savings/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await db.delete(savings).where(and(eq(savings.id, req.params.id), eq(savings.userId, userId)));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting savings:", error);
      res.status(500).json({ message: "Failed to delete savings" });
    }
  });

  // Debt CRUD
  app.post("/api/finance/debt", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, balance, interestRate, minPayment, priority, deadline } = req.body;
      const [row] = await db.insert(debt).values({
        userId, name, balance: String(balance), interestRate: String(interestRate), minPayment: String(minPayment), priority, deadline: deadline || null,
      }).returning();
      res.json({ id: row.id, name: row.name, balance: parseFloat(row.balance), interestRate: parseFloat(row.interestRate), minPayment: parseFloat(row.minPayment), priority: row.priority, deadline: row.deadline || undefined });
    } catch (error) {
      console.error("Error adding debt:", error);
      res.status(500).json({ message: "Failed to add debt" });
    }
  });

  app.put("/api/finance/debt/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, balance, interestRate, minPayment, priority, deadline } = req.body;
      const [row] = await db.update(debt).set({
        name, balance: String(balance), interestRate: String(interestRate), minPayment: String(minPayment), priority, deadline: deadline || null,
      }).where(and(eq(debt.id, req.params.id), eq(debt.userId, userId))).returning();
      if (!row) return res.status(404).json({ message: "Not found" });
      res.json({ id: row.id, name: row.name, balance: parseFloat(row.balance), interestRate: parseFloat(row.interestRate), minPayment: parseFloat(row.minPayment), priority: row.priority, deadline: row.deadline || undefined });
    } catch (error) {
      console.error("Error updating debt:", error);
      res.status(500).json({ message: "Failed to update debt" });
    }
  });

  app.delete("/api/finance/debt/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await db.delete(debt).where(and(eq(debt.id, req.params.id), eq(debt.userId, userId)));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting debt:", error);
      res.status(500).json({ message: "Failed to delete debt" });
    }
  });

  // Wishlist CRUD
  app.post("/api/finance/wishlist", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { item, cost, saved, priority, deadline } = req.body;
      const [row] = await db.insert(wishlist).values({
        userId, item, cost: String(cost), saved: String(saved || 0), priority, deadline: deadline || null,
      }).returning();
      res.json({ id: row.id, item: row.item, cost: parseFloat(row.cost), saved: parseFloat(row.saved), priority: row.priority, deadline: row.deadline || undefined });
    } catch (error) {
      console.error("Error adding wishlist item:", error);
      res.status(500).json({ message: "Failed to add wishlist item" });
    }
  });

  app.put("/api/finance/wishlist/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { item, cost, saved, priority, deadline } = req.body;
      const [row] = await db.update(wishlist).set({
        item, cost: String(cost), saved: String(saved || 0), priority, deadline: deadline || null,
      }).where(and(eq(wishlist.id, req.params.id), eq(wishlist.userId, userId))).returning();
      if (!row) return res.status(404).json({ message: "Not found" });
      res.json({ id: row.id, item: row.item, cost: parseFloat(row.cost), saved: parseFloat(row.saved), priority: row.priority, deadline: row.deadline || undefined });
    } catch (error) {
      console.error("Error updating wishlist item:", error);
      res.status(500).json({ message: "Failed to update wishlist item" });
    }
  });

  app.delete("/api/finance/wishlist/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await db.delete(wishlist).where(and(eq(wishlist.id, req.params.id), eq(wishlist.userId, userId)));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting wishlist item:", error);
      res.status(500).json({ message: "Failed to delete wishlist item" });
    }
  });
}
