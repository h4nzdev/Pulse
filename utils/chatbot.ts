import { allCategories, getCategory } from "../constants/categories";
import { Expense, PlannedExpense, Profile, Todo } from "../contexts/AppContext";
import { formatDateKey, isSameMonth } from "./dates";
import { formatMoney } from "./format";

export interface BotContext {
  profile: Profile | null;
  expenses: Expense[];
  todos: Todo[];
  planned: PlannedExpense[];
  monthTotal: number;
  weekTotal: number;
  todayTotal: number;
  categoryTotals: Record<string, number>;
}

export const SUGGESTIONS = [
  "How much did I spend this month?",
  "How is my budget?",
  "What's my biggest expense?",
  "How much on groceries?",
  "What's planned next?",
  "Any tips?",
];

const TIPS = [
  "Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings.",
  "Log expenses right when they happen — the Add tab is one tap away.",
  "Review your Top Categories weekly to spot where money leaks.",
  "Plan big purchases in the Calendar so they never surprise you.",
  "Set a daily reminder in Settings so you never forget to log.",
];

/** Compact snapshot of the user's data, used to ground Gemini replies. */
export function buildContextSummary(ctx: BotContext): string {
  const currency = ctx.profile?.currency ?? "$";
  const money = (n: number) => formatMoney(n, currency);
  const lines: string[] = [];

  lines.push(`User: ${ctx.profile?.name ?? "unknown"} · currency: ${currency}`);
  lines.push(
    `Budgets: monthly ${money(ctx.profile?.monthlyBudget ?? 0)}, weekly ${money(ctx.profile?.weeklyBudget ?? 0)}`
  );
  lines.push(
    `Spent: today ${money(ctx.todayTotal)}, this week ${money(ctx.weekTotal)}, this month ${money(ctx.monthTotal)}`
  );
  const income = ctx.expenses
    .filter((e) => e.type === "income" && isSameMonth(e.date))
    .reduce((s, e) => s + e.amount, 0);
  if (income > 0) lines.push(`Money added (income) this month: ${money(income)}`);

  const cats = Object.entries(ctx.categoryTotals).sort((a, b) => b[1] - a[1]);
  if (cats.length > 0) {
    lines.push(
      `This month by category: ${cats.map(([id, t]) => `${getCategory(id).name} ${money(t)}`).join(", ")}`
    );
  }

  const recent = ctx.expenses.slice(0, 8);
  if (recent.length > 0) {
    lines.push(
      `Recent entries: ${recent
        .map(
          (e) =>
            `${e.date} ${e.type === "income" ? "+" : "-"}${money(e.amount)} ${
              e.type === "income" ? "income" : getCategory(e.categoryId).name
            }${e.note ? ` (${e.note})` : ""}`
        )
        .join("; ")}`
    );
  }

  const open = ctx.todos.filter((t) => !t.done);
  lines.push(
    `Todos: ${ctx.todos.length} total, ${open.length} open${open.length ? ` — ${open.slice(0, 5).map((t) => t.text).join(", ")}` : ""}`
  );

  if (ctx.planned.length > 0) {
    lines.push(
      `Planned expenses: ${[...ctx.planned]
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 6)
        .map((p) => `${p.date} ${p.title} ${money(p.amount)}`)
        .join("; ")}`
    );
  }

  lines.push(`Today's date: ${new Date().toISOString().slice(0, 10)}`);
  return lines.join("\n");
}

export function botReply(raw: string, ctx: BotContext): string {
  const q = raw.toLowerCase();
  const currency = ctx.profile?.currency ?? "$";
  const money = (n: number) => formatMoney(n, currency);

  // greetings
  if (/^(hi|hello|hey|yo|sup)\b/.test(q)) {
    return `Hey ${ctx.profile?.name ?? "there"}! 👋 Ask me about your spending, budget, todos, or planned expenses.`;
  }

  // category-specific spend
  for (const cat of allCategories()) {
    const nameParts = cat.name.toLowerCase().split(/[^a-z]+/).filter(Boolean);
    if (nameParts.some((part) => part.length > 3 && q.includes(part)) || q.includes(cat.id)) {
      const total = ctx.categoryTotals[cat.id] ?? 0;
      const count = ctx.expenses.filter((e) => e.categoryId === cat.id).length;
      if (count === 0) return `You haven't logged anything under ${cat.name} yet.`;
      return `You've spent ${money(total)} on ${cat.name} this month (${count} expense${count === 1 ? "" : "s"} all-time). Open its folder in Modules → Expense Folders for details.`;
    }
  }

  // budget status
  if (q.includes("budget") || q.includes("left") || q.includes("remaining")) {
    const budget = ctx.profile?.monthlyBudget ?? 0;
    if (budget <= 0) return "You haven't set a monthly budget yet — you can add one in Settings.";
    const remaining = budget - ctx.monthTotal;
    const pct = Math.round((ctx.monthTotal / budget) * 100);
    if (remaining < 0) {
      return `⚠️ You're ${money(-remaining)} over your ${money(budget)} monthly budget (${pct}% used). Time to slow down a little!`;
    }
    return `You've used ${pct}% of your monthly budget — ${money(remaining)} left of ${money(budget)}. ${pct >= 80 ? "Careful, you're getting close!" : "Looking good! 💜"}`;
  }

  // totals
  if (q.includes("today")) {
    return ctx.todayTotal > 0
      ? `You've spent ${money(ctx.todayTotal)} today.`
      : "No expenses logged today yet. Nice — or did you forget to log? 😉";
  }
  if (q.includes("week")) {
    return `You've spent ${money(ctx.weekTotal)} this week${ctx.profile?.weeklyBudget ? ` of your ${money(ctx.profile.weeklyBudget)} weekly budget` : ""}.`;
  }
  if (q.includes("month") || q.includes("total") || q.includes("spent") || q.includes("spend")) {
    if (ctx.expenses.length === 0) return "You haven't logged any expenses yet. Tap the purple + button to start!";
    return `You've spent ${money(ctx.monthTotal)} this month across ${Object.keys(ctx.categoryTotals).length} categories. This week: ${money(ctx.weekTotal)}. Today: ${money(ctx.todayTotal)}.`;
  }

  // biggest expense / top category
  if (q.includes("biggest") || q.includes("largest") || q.includes("most") || q.includes("top")) {
    const onlyExpenses = ctx.expenses.filter((e) => e.type !== "income");
    if (onlyExpenses.length === 0) return "No expenses yet, so nothing to rank. Log a few first!";
    const biggest = [...onlyExpenses].sort((a, b) => b.amount - a.amount)[0];
    const topCat = Object.entries(ctx.categoryTotals).sort((a, b) => b[1] - a[1])[0];
    let answer = `Your biggest single expense is ${money(biggest.amount)} (${biggest.note || getCategory(biggest.categoryId).name}) on ${formatDateKey(biggest.date)}.`;
    if (topCat) answer += ` Your top category this month is ${getCategory(topCat[0]).name} at ${money(topCat[1])}.`;
    return answer;
  }

  // todos
  if (q.includes("todo") || q.includes("task")) {
    if (ctx.todos.length === 0) return "Your todo list is empty. Add money tasks in Modules → Todo Lists.";
    const open = ctx.todos.filter((t) => !t.done);
    if (open.length === 0) return `All ${ctx.todos.length} todos are done. 🎉`;
    return `You have ${open.length} open todo${open.length === 1 ? "" : "s"}: ${open.slice(0, 3).map((t) => `"${t.text}"`).join(", ")}${open.length > 3 ? "…" : ""}.`;
  }

  // planned expenses
  if (q.includes("plan") || q.includes("upcoming") || q.includes("calendar") || q.includes("next")) {
    if (ctx.planned.length === 0) return "Nothing planned yet. Open Modules → Calendar and tap a day to plan an expense.";
    const upcoming = [...ctx.planned].sort((a, b) => a.date.localeCompare(b.date))[0];
    const totalPlanned = ctx.planned.reduce((s, p) => s + p.amount, 0);
    return `Next up: "${upcoming.title}" (${money(upcoming.amount)}) on ${formatDateKey(upcoming.date)}. You have ${ctx.planned.length} planned expense${ctx.planned.length === 1 ? "" : "s"} totaling ${money(totalPlanned)}.`;
  }

  // tips
  if (q.includes("tip") || q.includes("advice") || q.includes("save") || q.includes("help")) {
    return `💡 ${TIPS[Math.floor(Math.random() * TIPS.length)]}`;
  }

  // thanks
  if (q.includes("thank")) {
    return "Anytime! 💜 Keep that budget happy.";
  }

  return `I'm your expense assistant — I can answer things like "${SUGGESTIONS[0]}", "${SUGGESTIONS[2]}", or "${SUGGESTIONS[4]}". Try one of the suggestions below!`;
}
