import type { Express } from "express";
import { isAuthenticatedCustom } from "./auth";
import { db } from "./db";
import { income, outgoings, savings, debt, wishlist, spendingLog, accounts } from "@shared/models/finance";
import { eq } from "drizzle-orm";
import OpenAI from "openai";

let openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

async function getFinancialSnapshot(userId: string) {
  const toNum = (v: string | number | null | undefined): number => {
    if (v == null) return 0;
    const n = typeof v === "number" ? v : parseFloat(v);
    return isNaN(n) ? 0 : n;
  };

  const [incomeData, outgoingsData, savingsData, debtData, wishlistData, spendingData, accountsData] = await Promise.all([
    db.select().from(income).where(eq(income.userId, userId)),
    db.select().from(outgoings).where(eq(outgoings.userId, userId)),
    db.select().from(savings).where(eq(savings.userId, userId)),
    db.select().from(debt).where(eq(debt.userId, userId)),
    db.select().from(wishlist).where(eq(wishlist.userId, userId)),
    db.select().from(spendingLog).where(eq(spendingLog.userId, userId)),
    db.select().from(accounts).where(eq(accounts.userId, userId)),
  ]);

  const allCurrencies = new Set<string>();
  incomeData.forEach(r => allCurrencies.add(r.currency || "USD"));
  outgoingsData.forEach(r => allCurrencies.add(r.currency || "USD"));
  savingsData.forEach(r => allCurrencies.add(r.currency || "USD"));
  debtData.forEach(r => allCurrencies.add(r.currency || "USD"));
  wishlistData.forEach(r => allCurrencies.add(r.currency || "USD"));
  spendingData.forEach(r => allCurrencies.add(r.currency || "USD"));
  accountsData.forEach(r => allCurrencies.add(r.currency || "USD"));

  const accountBalancesByCurrency: Record<string, { accounts: { name: string; type: string; balance: number }[]; total: number }> = {};
  accountsData.forEach(r => {
    const cur = r.currency || "USD";
    if (!accountBalancesByCurrency[cur]) {
      accountBalancesByCurrency[cur] = { accounts: [], total: 0 };
    }
    const bal = toNum(r.balance);
    accountBalancesByCurrency[cur].accounts.push({ name: r.name, type: r.type, balance: bal });
    accountBalancesByCurrency[cur].total += bal;
  });

  const now = new Date();
  const currentDay = now.getDate();

  const upcomingExpenses = outgoingsData
    .filter(r => r.isRecurring && r.dayOfMonth)
    .map(r => {
      const day = r.dayOfMonth!;
      const daysUntil = day >= currentDay ? day - currentDay : (30 - currentDay + day);
      return {
        description: r.description,
        amount: toNum(r.amount),
        currency: r.currency || "USD",
        category: r.category,
        dayOfMonth: day,
        daysUntilDue: daysUntil,
      };
    })
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue);

  const spendingByCategory: Record<string, { total: number; count: number; currency: string }> = {};
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  spendingData.forEach(r => {
    const d = new Date(r.date);
    if (d >= last30Days) {
      const key = `${r.category}|${r.currency || "USD"}`;
      if (!spendingByCategory[key]) {
        spendingByCategory[key] = { total: 0, count: 0, currency: r.currency || "USD" };
      }
      spendingByCategory[key].total += toNum(r.amount);
      spendingByCategory[key].count += 1;
    }
  });

  const spendingPatterns = Object.entries(spendingByCategory).map(([key, val]) => {
    const category = key.split("|")[0];
    return { category, currency: val.currency, totalSpent: val.total, transactionCount: val.count };
  });

  return {
    currencies: Array.from(allCurrencies),
    income: incomeData.map(r => ({
      source: r.source,
      amount: toNum(r.amount),
      category: r.category,
      frequency: r.frequency,
      currency: r.currency || "USD",
      dayOfMonth: r.dayOfMonth || undefined,
    })),
    expenses: outgoingsData.map(r => ({
      description: r.description,
      amount: toNum(r.amount),
      category: r.category,
      frequency: r.frequency,
      currency: r.currency || "USD",
      dayOfMonth: r.dayOfMonth || undefined,
      isRecurring: r.isRecurring,
    })),
    debts: debtData.map(r => ({
      name: r.name,
      balance: toNum(r.balance),
      interestRate: toNum(r.interestRate),
      minPayment: toNum(r.minPayment),
      priority: r.priority,
      deadline: r.deadline || undefined,
      currency: r.currency || "USD",
    })),
    savings: savingsData.map(r => ({
      name: r.name,
      balance: toNum(r.balance),
      target: r.target ? parseFloat(r.target) : undefined,
      category: r.category,
      currency: r.currency || "USD",
    })),
    wishlist: wishlistData.map(r => ({
      item: r.item,
      cost: toNum(r.cost),
      saved: toNum(r.saved),
      priority: r.priority,
      deadline: r.deadline || undefined,
      currency: r.currency || "USD",
    })),
    recentSpending: spendingData
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 50)
      .map(r => ({
        description: r.description,
        amount: toNum(r.amount),
        currency: r.currency || "USD",
        category: r.category,
        date: r.date,
      })),
    spendingPatterns,
    upcomingExpenses,
    accountBalancesByCurrency,
  };
}

export function registerAIRoutes(app: Express) {
  app.post("/api/ai/advice", isAuthenticatedCustom, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { question } = req.body;

      if (!question || typeof question !== "string") {
        return res.status(400).json({ ok: false, error: "A question is required." });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ ok: false, error: "OpenAI API key is not configured." });
      }

      const snapshot = await getFinancialSnapshot(userId);

      const currencyList = snapshot.currencies.join(", ");

      const systemPrompt = `You are ZenAdvisor, a safe, friendly financial coach.
Your job is to help everyday people take control of their money.
Rules:
- Only give general guidance, never regulated financial advice.
- The user works with the following currencies: ${currencyList}. Always use the correct currency code/symbol for each amount based on the data (e.g. GBP 500, IDR 3,000,000, USD 1,200). Never assume a single currency — always match the currency to each specific item.
- Be encouraging but realistic.
- ONLY base your advice on the financial data provided below. Do NOT assume or invent any figures.
- When relevant, reference upcoming due dates for recurring expenses (the data includes dayOfMonth and daysUntilDue). Warn about bills coming due soon.
- Analyze spending patterns from the daily spending log. If a category has high spending (e.g. lots of coffee or entertainment purchases), suggest specific cutbacks.
- Reference debt priorities (High/Medium/Low) when advising on debt repayment strategy.
- Reference wishlist deadlines and progress when advising on savings goals.
- Consider account balances per currency when assessing the user's financial position.
- Understand multi-currency context — do not mix or convert currencies unless the user asks.
- Always respond with valid JSON in this exact format:
  { "summary": "<one-paragraph overview>", "steps": ["<step 1>", "<step 2>", ...] }
- The summary should directly address the user's question.
- Provide 3-6 concrete, actionable steps.
- Do NOT include any text outside the JSON object.`;

      const userMessage = `Here is my financial snapshot:\n${JSON.stringify(snapshot, null, 2)}\n\nMy question: ${question}`;

      const response = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        response_format: { type: "json_object" },
        max_tokens: 1024,
        temperature: 0.7,
      });

      const raw = response.choices[0]?.message?.content;
      if (!raw) {
        console.error("AI advice: empty response from OpenAI", JSON.stringify(response.choices));
        return res.status(500).json({ ok: false, error: "No response from AI. Please try again." });
      }

      let advice: { summary: string; steps: string[] };
      try {
        advice = JSON.parse(raw);
      } catch (parseErr) {
        console.error("AI advice: failed to parse JSON response:", raw);
        return res.status(500).json({ ok: false, error: "AI returned an unexpected format. Please try again." });
      }

      return res.json({ ok: true, advice });
    } catch (error: any) {
      console.error("AI advice error:", error?.message || error);
      let message = "Failed to get AI advice. Please try again.";
      if (error?.status === 401) {
        message = "Invalid OpenAI API key. Please check your key in settings.";
      } else if (error?.status === 429) {
        message = "Rate limit reached. Please wait a moment and try again.";
      } else if (error?.status === 404) {
        message = "AI model not available. Please check your OpenAI account.";
      }
      return res.status(500).json({ ok: false, error: message });
    }
  });
}
