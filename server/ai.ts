import type { Express } from "express";
import { isAuthenticatedCustom } from "./auth";
import OpenAI from "openai";

// Using gpt-4o for broad compatibility with user's own OpenAI API key
let openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

// ──────────────────────────────────────────────────────────────────
// MOCK DATA HELPER
// Replace this function with a real DB query using your Drizzle ORM.
// For example, you could query the income, outgoings, savings, and
// debt tables for the given userId, exactly like the GET /api/finance
// route does in server/routes.ts.
// ──────────────────────────────────────────────────────────────────
function getMockFinancialSnapshot(userId: string) {
  return {
    income: [
      { source: "Salary", amount: 3200, frequency: "monthly" },
      { source: "Freelance", amount: 500, frequency: "monthly" },
    ],
    fixedExpenses: [
      { description: "Rent", amount: 950, frequency: "monthly" },
      { description: "Council Tax", amount: 150, frequency: "monthly" },
      { description: "Utilities", amount: 120, frequency: "monthly" },
      { description: "Groceries", amount: 350, frequency: "monthly" },
      { description: "Transport", amount: 100, frequency: "monthly" },
    ],
    debts: [
      { name: "Student Loan", balance: 24000, apr: 6.3, minPayment: 120 },
      { name: "Credit Card", balance: 2400, apr: 19.9, minPayment: 60 },
    ],
    savings: [
      { name: "Emergency Fund", balance: 1500, target: 5000 },
      { name: "Holiday Fund", balance: 800, target: 2000 },
    ],
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

      // ──────────────────────────────────────────────────────────────
      // REPLACE the mock call below with your real DB query, e.g.:
      //
      //   const [incomeData, outgoingsData, savingsData, debtData] =
      //     await Promise.all([
      //       db.select().from(income).where(eq(income.userId, userId)),
      //       db.select().from(outgoings).where(eq(outgoings.userId, userId)),
      //       db.select().from(savings).where(eq(savings.userId, userId)),
      //       db.select().from(debt).where(eq(debt.userId, userId)),
      //     ]);
      //
      // Then build the snapshot object from those query results.
      // ──────────────────────────────────────────────────────────────
      const snapshot = getMockFinancialSnapshot(userId);

      const systemPrompt = `You are ZenAdvisor, a safe, friendly UK-based financial coach.
Your job is to help everyday people take control of their money.
Rules:
- Only give general guidance, never regulated financial advice.
- Refer to amounts in GBP (£).
- Be encouraging but realistic.
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
