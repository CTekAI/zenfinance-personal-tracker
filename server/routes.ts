import type { Express } from "express";
import { isAuthenticatedCustom } from "./auth";
import { db } from "./db";
import { income, outgoings, savings, debt, wishlist, accounts, spendingLog, notifications } from "@shared/models/finance";
import { eq, and, desc } from "drizzle-orm";

export function registerRoutes(app: Express) {
  const toNum = (v: string | null) => v ? parseFloat(v) : 0;
  const toNumOrUndef = (v: string | null) => v ? parseFloat(v) : undefined;
  const toIntOrNull = (v: number | null | undefined) => v != null ? v : null;

  app.get("/api/finance", isAuthenticatedCustom, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [incomeData, outgoingsData, savingsData, debtData, wishlistData, accountsData, spendingData] = await Promise.all([
        db.select().from(income).where(eq(income.userId, userId)),
        db.select().from(outgoings).where(eq(outgoings.userId, userId)),
        db.select().from(savings).where(eq(savings.userId, userId)),
        db.select().from(debt).where(eq(debt.userId, userId)),
        db.select().from(wishlist).where(eq(wishlist.userId, userId)),
        db.select().from(accounts).where(eq(accounts.userId, userId)),
        db.select().from(spendingLog).where(eq(spendingLog.userId, userId)).orderBy(desc(spendingLog.createdAt)),
      ]);

      res.json({
        income: incomeData.map(r => ({ id: r.id, source: r.source, amount: toNum(r.amount), category: r.category, frequency: r.frequency, currency: r.currency || "USD", dayOfMonth: toIntOrNull(r.dayOfMonth) })),
        outgoings: outgoingsData.map(r => ({ id: r.id, description: r.description, amount: toNum(r.amount), category: r.category, date: r.date, frequency: r.frequency, currency: r.currency || "USD", dayOfMonth: toIntOrNull(r.dayOfMonth), isRecurring: r.isRecurring ?? false })),
        savings: savingsData.map(r => ({ id: r.id, name: r.name, balance: toNum(r.balance), target: toNumOrUndef(r.target), category: r.category, currency: r.currency || "USD" })),
        debt: debtData.map(r => ({ id: r.id, name: r.name, balance: toNum(r.balance), interestRate: toNum(r.interestRate), minPayment: toNum(r.minPayment), priority: r.priority, deadline: r.deadline || undefined, currency: r.currency || "USD" })),
        wishlist: wishlistData.map(r => ({ id: r.id, item: r.item, cost: toNum(r.cost), saved: toNum(r.saved), priority: r.priority, deadline: r.deadline || undefined, currency: r.currency || "USD" })),
        accounts: accountsData.map(r => ({ id: r.id, name: r.name, type: r.type, balance: toNum(r.balance), currency: r.currency })),
        spendingLog: spendingData.map(r => ({ id: r.id, description: r.description, amount: toNum(r.amount), currency: r.currency || "USD", category: r.category, date: r.date })),
      });
    } catch (error) {
      console.error("Error fetching finance data:", error);
      res.status(500).json({ message: "Failed to fetch finance data" });
    }
  });

  app.post("/api/finance/income", isAuthenticatedCustom, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { source, amount, category, frequency, currency, dayOfMonth } = req.body;
      const [row] = await db.insert(income).values({
        userId, source, amount: String(amount), category, frequency, currency: currency || "USD", dayOfMonth: dayOfMonth || null,
      }).returning();
      res.json({ id: row.id, source: row.source, amount: parseFloat(row.amount), category: row.category, frequency: row.frequency, currency: row.currency || "USD", dayOfMonth: toIntOrNull(row.dayOfMonth) });
    } catch (error) {
      console.error("Error adding income:", error);
      res.status(500).json({ message: "Failed to add income" });
    }
  });

  app.put("/api/finance/income/:id", isAuthenticatedCustom, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { source, amount, category, frequency, currency, dayOfMonth } = req.body;
      const [row] = await db.update(income).set({
        source, amount: String(amount), category, frequency, currency: currency || "USD", dayOfMonth: dayOfMonth || null,
      }).where(and(eq(income.id, req.params.id), eq(income.userId, userId))).returning();
      if (!row) return res.status(404).json({ message: "Not found" });
      res.json({ id: row.id, source: row.source, amount: parseFloat(row.amount), category: row.category, frequency: row.frequency, currency: row.currency || "USD", dayOfMonth: toIntOrNull(row.dayOfMonth) });
    } catch (error) {
      console.error("Error updating income:", error);
      res.status(500).json({ message: "Failed to update income" });
    }
  });

  app.delete("/api/finance/income/:id", isAuthenticatedCustom, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await db.delete(income).where(and(eq(income.id, req.params.id), eq(income.userId, userId)));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting income:", error);
      res.status(500).json({ message: "Failed to delete income" });
    }
  });

  app.post("/api/finance/outgoings", isAuthenticatedCustom, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { description, amount, category, date, frequency, currency, dayOfMonth, isRecurring } = req.body;
      const [row] = await db.insert(outgoings).values({
        userId, description, amount: String(amount), category, date, frequency, currency: currency || "USD", dayOfMonth: dayOfMonth || null, isRecurring: isRecurring ?? false,
      }).returning();
      res.json({ id: row.id, description: row.description, amount: parseFloat(row.amount), category: row.category, date: row.date, frequency: row.frequency, currency: row.currency || "USD", dayOfMonth: toIntOrNull(row.dayOfMonth), isRecurring: row.isRecurring ?? false });
    } catch (error) {
      console.error("Error adding outgoing:", error);
      res.status(500).json({ message: "Failed to add expense" });
    }
  });

  app.put("/api/finance/outgoings/:id", isAuthenticatedCustom, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { description, amount, category, date, frequency, currency, dayOfMonth, isRecurring } = req.body;
      const [row] = await db.update(outgoings).set({
        description, amount: String(amount), category, date, frequency, currency: currency || "USD", dayOfMonth: dayOfMonth || null, isRecurring: isRecurring ?? false,
      }).where(and(eq(outgoings.id, req.params.id), eq(outgoings.userId, userId))).returning();
      if (!row) return res.status(404).json({ message: "Not found" });
      res.json({ id: row.id, description: row.description, amount: parseFloat(row.amount), category: row.category, date: row.date, frequency: row.frequency, currency: row.currency || "USD", dayOfMonth: toIntOrNull(row.dayOfMonth), isRecurring: row.isRecurring ?? false });
    } catch (error) {
      console.error("Error updating outgoing:", error);
      res.status(500).json({ message: "Failed to update expense" });
    }
  });

  app.delete("/api/finance/outgoings/:id", isAuthenticatedCustom, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await db.delete(outgoings).where(and(eq(outgoings.id, req.params.id), eq(outgoings.userId, userId)));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting outgoing:", error);
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  app.post("/api/finance/savings", isAuthenticatedCustom, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, balance, target, category, currency } = req.body;
      const [row] = await db.insert(savings).values({
        userId, name, balance: String(balance), target: target != null ? String(target) : null, category, currency: currency || "USD",
      }).returning();
      res.json({ id: row.id, name: row.name, balance: parseFloat(row.balance), target: row.target ? parseFloat(row.target) : undefined, category: row.category, currency: row.currency || "USD" });
    } catch (error) {
      console.error("Error adding savings:", error);
      res.status(500).json({ message: "Failed to add savings" });
    }
  });

  app.put("/api/finance/savings/:id", isAuthenticatedCustom, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, balance, target, category, currency } = req.body;
      const [row] = await db.update(savings).set({
        name, balance: String(balance), target: target != null ? String(target) : null, category, currency: currency || "USD",
      }).where(and(eq(savings.id, req.params.id), eq(savings.userId, userId))).returning();
      if (!row) return res.status(404).json({ message: "Not found" });
      res.json({ id: row.id, name: row.name, balance: parseFloat(row.balance), target: row.target ? parseFloat(row.target) : undefined, category: row.category, currency: row.currency || "USD" });
    } catch (error) {
      console.error("Error updating savings:", error);
      res.status(500).json({ message: "Failed to update savings" });
    }
  });

  app.delete("/api/finance/savings/:id", isAuthenticatedCustom, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await db.delete(savings).where(and(eq(savings.id, req.params.id), eq(savings.userId, userId)));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting savings:", error);
      res.status(500).json({ message: "Failed to delete savings" });
    }
  });

  app.post("/api/finance/debt", isAuthenticatedCustom, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, balance, interestRate, minPayment, priority, deadline, currency } = req.body;
      const [row] = await db.insert(debt).values({
        userId, name, balance: String(balance), interestRate: String(interestRate), minPayment: String(minPayment), priority, deadline: deadline || null, currency: currency || "USD",
      }).returning();
      res.json({ id: row.id, name: row.name, balance: parseFloat(row.balance), interestRate: parseFloat(row.interestRate), minPayment: parseFloat(row.minPayment), priority: row.priority, deadline: row.deadline || undefined, currency: row.currency || "USD" });
    } catch (error) {
      console.error("Error adding debt:", error);
      res.status(500).json({ message: "Failed to add debt" });
    }
  });

  app.put("/api/finance/debt/:id", isAuthenticatedCustom, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, balance, interestRate, minPayment, priority, deadline, currency } = req.body;
      const [row] = await db.update(debt).set({
        name, balance: String(balance), interestRate: String(interestRate), minPayment: String(minPayment), priority, deadline: deadline || null, currency: currency || "USD",
      }).where(and(eq(debt.id, req.params.id), eq(debt.userId, userId))).returning();
      if (!row) return res.status(404).json({ message: "Not found" });
      res.json({ id: row.id, name: row.name, balance: parseFloat(row.balance), interestRate: parseFloat(row.interestRate), minPayment: parseFloat(row.minPayment), priority: row.priority, deadline: row.deadline || undefined, currency: row.currency || "USD" });
    } catch (error) {
      console.error("Error updating debt:", error);
      res.status(500).json({ message: "Failed to update debt" });
    }
  });

  app.delete("/api/finance/debt/:id", isAuthenticatedCustom, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await db.delete(debt).where(and(eq(debt.id, req.params.id), eq(debt.userId, userId)));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting debt:", error);
      res.status(500).json({ message: "Failed to delete debt" });
    }
  });

  app.post("/api/finance/wishlist", isAuthenticatedCustom, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { item, cost, saved, priority, deadline, currency } = req.body;
      const [row] = await db.insert(wishlist).values({
        userId, item, cost: String(cost), saved: String(saved || 0), priority, deadline: deadline || null, currency: currency || "USD",
      }).returning();
      res.json({ id: row.id, item: row.item, cost: parseFloat(row.cost), saved: parseFloat(row.saved), priority: row.priority, deadline: row.deadline || undefined, currency: row.currency || "USD" });
    } catch (error) {
      console.error("Error adding wishlist item:", error);
      res.status(500).json({ message: "Failed to add wishlist item" });
    }
  });

  app.put("/api/finance/wishlist/:id", isAuthenticatedCustom, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { item, cost, saved, priority, deadline, currency } = req.body;
      const [row] = await db.update(wishlist).set({
        item, cost: String(cost), saved: String(saved || 0), priority, deadline: deadline || null, currency: currency || "USD",
      }).where(and(eq(wishlist.id, req.params.id), eq(wishlist.userId, userId))).returning();
      if (!row) return res.status(404).json({ message: "Not found" });
      res.json({ id: row.id, item: row.item, cost: parseFloat(row.cost), saved: parseFloat(row.saved), priority: row.priority, deadline: row.deadline || undefined, currency: row.currency || "USD" });
    } catch (error) {
      console.error("Error updating wishlist item:", error);
      res.status(500).json({ message: "Failed to update wishlist item" });
    }
  });

  app.delete("/api/finance/wishlist/:id", isAuthenticatedCustom, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await db.delete(wishlist).where(and(eq(wishlist.id, req.params.id), eq(wishlist.userId, userId)));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting wishlist item:", error);
      res.status(500).json({ message: "Failed to delete wishlist item" });
    }
  });

  app.post("/api/finance/accounts", isAuthenticatedCustom, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, type, balance, currency } = req.body;
      const [row] = await db.insert(accounts).values({
        userId, name, type, balance: String(balance), currency: currency || "USD",
      }).returning();
      res.json({ id: row.id, name: row.name, type: row.type, balance: parseFloat(row.balance), currency: row.currency });
    } catch (error) {
      console.error("Error adding account:", error);
      res.status(500).json({ message: "Failed to add account" });
    }
  });

  app.put("/api/finance/accounts/:id", isAuthenticatedCustom, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, type, balance, currency } = req.body;
      const [row] = await db.update(accounts).set({
        name, type, balance: String(balance), currency: currency || "USD",
      }).where(and(eq(accounts.id, req.params.id), eq(accounts.userId, userId))).returning();
      if (!row) return res.status(404).json({ message: "Not found" });
      res.json({ id: row.id, name: row.name, type: row.type, balance: parseFloat(row.balance), currency: row.currency });
    } catch (error) {
      console.error("Error updating account:", error);
      res.status(500).json({ message: "Failed to update account" });
    }
  });

  app.delete("/api/finance/accounts/:id", isAuthenticatedCustom, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await db.delete(accounts).where(and(eq(accounts.id, req.params.id), eq(accounts.userId, userId)));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  app.post("/api/finance/spending", isAuthenticatedCustom, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { description, amount, currency, category, date } = req.body;
      const [row] = await db.insert(spendingLog).values({
        userId, description, amount: String(amount), currency: currency || "USD", category, date: date || new Date().toISOString().split('T')[0],
      }).returning();
      res.json({ id: row.id, description: row.description, amount: parseFloat(row.amount), currency: row.currency || "USD", category: row.category, date: row.date });
    } catch (error) {
      console.error("Error adding spending:", error);
      res.status(500).json({ message: "Failed to add spending entry" });
    }
  });

  app.delete("/api/finance/spending/:id", isAuthenticatedCustom, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await db.delete(spendingLog).where(and(eq(spendingLog.id, req.params.id), eq(spendingLog.userId, userId)));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting spending:", error);
      res.status(500).json({ message: "Failed to delete spending entry" });
    }
  });

  app.get("/api/notifications", isAuthenticatedCustom, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const upcoming = await db.select().from(outgoings).where(and(eq(outgoings.userId, userId), eq(outgoings.isRecurring, true)));
      const today = new Date();
      const currentDay = today.getDate();

      for (const expense of upcoming) {
        if (expense.dayOfMonth) {
          let daysUntil = expense.dayOfMonth - currentDay;
          if (daysUntil < 0) daysUntil += 30;
          if (daysUntil <= 3 && daysUntil >= 0) {
            const existing = await db.select().from(notifications).where(
              and(eq(notifications.userId, userId), eq(notifications.relatedId, expense.id), eq(notifications.type, "bill_due"))
            );
            const recentExists = existing.some(n => {
              const created = new Date(n.createdAt!);
              return (today.getTime() - created.getTime()) < 24 * 60 * 60 * 1000;
            });
            if (!recentExists) {
              await db.insert(notifications).values({
                userId,
                type: "bill_due",
                title: `${expense.description} due soon`,
                message: `Your ${expense.description} payment of ${expense.amount} is due on day ${expense.dayOfMonth} of this month.`,
                relatedId: expense.id,
              });
            }
          }
        }
      }

      const savingsData = await db.select().from(savings).where(eq(savings.userId, userId));
      for (const s of savingsData) {
        if (s.target) {
          const balance = parseFloat(s.balance);
          const target = parseFloat(s.target);
          const pct = (balance / target) * 100;
          const milestones = [25, 50, 75, 100];
          for (const m of milestones) {
            if (pct >= m) {
              const existing = await db.select().from(notifications).where(
                and(eq(notifications.userId, userId), eq(notifications.relatedId, s.id), eq(notifications.type, `savings_${m}`))
              );
              if (existing.length === 0) {
                await db.insert(notifications).values({
                  userId,
                  type: `savings_${m}`,
                  title: `${s.name} hit ${m}%!`,
                  message: `Your ${s.name} savings has reached ${m}% of its target. ${m === 100 ? 'Congratulations!' : 'Keep going!'}`,
                  relatedId: s.id,
                });
              }
            }
          }
        }
      }

      const notifs = await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
      res.json(notifs.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.read,
        relatedId: n.relatedId,
        createdAt: n.createdAt?.toISOString() || new Date().toISOString(),
      })));
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.put("/api/notifications/:id/read", isAuthenticatedCustom, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await db.update(notifications).set({ read: true }).where(and(eq(notifications.id, req.params.id), eq(notifications.userId, userId)));
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.post("/api/notifications/mark-all-read", isAuthenticatedCustom, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await db.update(notifications).set({ read: true }).where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  app.post("/api/finance/accounts/:id/deduct", isAuthenticatedCustom, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { amount } = req.body;
      const [account] = await db.select().from(accounts).where(and(eq(accounts.id, req.params.id), eq(accounts.userId, userId)));
      if (!account) return res.status(404).json({ message: "Account not found" });
      const newBalance = parseFloat(account.balance) - parseFloat(String(amount));
      const [row] = await db.update(accounts).set({ balance: String(newBalance) }).where(eq(accounts.id, req.params.id)).returning();
      res.json({ id: row.id, name: row.name, type: row.type, balance: parseFloat(row.balance), currency: row.currency });
    } catch (error) {
      console.error("Error deducting from account:", error);
      res.status(500).json({ message: "Failed to deduct from account" });
    }
  });
}
