import type { Express } from "express";
import { isAuthenticatedCustom } from "./auth";
import { db } from "./db";
import { income, outgoings, savings, debt, wishlist } from "@shared/models/finance";
import { eq } from "drizzle-orm";
import OpenAI from "openai";

// Using gpt-4o for broad compatibility with user's own OpenAI API key
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

  const [incomeData, outgoingsData, savingsData, debtData, wishlistData] = await Promise.all([
    db.select().from(income).where(eq(income.userId, userId)),
    db.select().from(outgoings).where(eq(outgoings.userId, userId)),
    db.select().from(savings).where(eq(savings.userId, userId)),
    db.select().from(debt).where(eq(debt.userId, userId)),
    db.select().from(wishlist).where(eq(wishlist.userId, userId)),
  ]);

  return {
    income: incomeData.map(r => ({ source: r.source, amount: toNum(r.amount), category: r.category, frequency: r.frequency })),
    expenses: outgoingsData.map(r => ({ description: r.description, amount: toNum(r.amount), category: r.category, frequency: r.frequency })),
    debts: debtData.map(r => ({ name: r.name, balance: toNum(r.balance), interestRate: toNum(r.interestRate), minPayment: toNum(r.minPayment), priority: r.priority })),
    savings: savingsData.map(r => ({ name: r.name, balance: toNum(r.balance), target: r.target ? parseFloat(r.target) : undefined, category: r.category })),
    wishlist: wishlistData.map(r => ({ item: r.item, cost: toNum(r.cost), saved: toNum(r.saved), priority: r.priority })),
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

      const systemPrompt = `You are ZenAdvisor, a safe, friendly financial coach.
Your job is to help everyday people take control of their money.
Rules:
- Only give general guidance, never regulated financial advice.
- Use the same currency symbols that appear in the user's financial data. If no currency is specified, use $.
- Be encouraging but realistic.
- ONLY base your advice on the financial data provided below. Do NOT assume or invent any figures.
- Always respond with valid JSON in this exact format:
  { "summary": "<one-paragraph overview>", "steps": ["<step 1>", "<step 2>", ...] }
- The summary should directly address the user's question.
- Provide 3-6 concrete, actionable steps.
- Do NOT include any text outside the JSON object.`;

      const userMessage = `Here is my financial snapshot:\n${JSON.stringify(snapshot, null, 2)}\n\nMy question: ${question}`;

      const response = await getOpenAI().chat.completions.create({
        model: "gpt-4o",
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
