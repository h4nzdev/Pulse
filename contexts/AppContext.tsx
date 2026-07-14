import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CATEGORIES,
  Category,
  setCustomCategories,
} from "../constants/categories";
import { isSameMonth, isSameWeek, toDateKey, todayKey } from "../utils/dates";
import { uid } from "../utils/format";

export interface Expense {
  id: string;
  amount: number;
  categoryId: string;
  note: string;
  date: string; // YYYY-MM-DD
  createdAt: number;
  /** "income" entries are money added back; absent means a normal expense */
  type?: "expense" | "income";
}

export interface PlannedExpense {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  amount: number;
  note: string;
}

export interface Todo {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
  /** Optional budget — checking the todo logs this amount as an expense */
  amount?: number;
  /** Id of the expense auto-created when this todo was checked */
  expenseId?: string;
}

export interface RecurringExpense {
  id: string;
  title: string;
  amount: number;
  categoryId: string;
  /** Day of the month it's due (1-31, clamped to the month's length) */
  dayOfMonth: number;
  createdAt: number;
  /** "YYYY-MM" of the last month this was auto-logged, to prevent duplicates */
  lastLoggedMonth?: string;
}

export interface Profile {
  name: string;
  monthlyBudget: number;
  weeklyBudget: number;
  currency: string;
  createdAt: number;
}

export interface ModuleFlags {
  folders: boolean;
  todos: boolean;
  calendar: boolean;
  chatbot: boolean;
  recurring: boolean;
  reports: boolean;
}

export interface AppSettings {
  notificationsEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  modules: ModuleFlags;
  /** Optional Gemini API key; empty string = use the built-in assistant */
  geminiApiKey: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  notificationsEnabled: false,
  reminderHour: 20,
  reminderMinute: 0,
  modules: {
    folders: true,
    todos: true,
    calendar: true,
    chatbot: true,
    recurring: true,
    reports: true,
  },
  geminiApiKey: "",
};

const KEYS = {
  profile: "@expenso/profile",
  expenses: "@expenso/expenses",
  planned: "@expenso/planned",
  todos: "@expenso/todos",
  settings: "@expenso/settings",
  categories: "@expenso/categories",
  recurring: "@expenso/recurring",
};

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Auto-log any recurring expense whose due day has arrived this month. */
function processRecurring(
  recs: RecurringExpense[],
  now: Date = new Date()
): { newExpenses: Expense[]; updatedRecs: RecurringExpense[] } {
  const monthKey = currentMonthKey();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const newExpenses: Expense[] = [];
  const updatedRecs = recs.map((r) => {
    const dueDay = Math.min(r.dayOfMonth, daysInMonth);
    if (r.lastLoggedMonth === monthKey || now.getDate() < dueDay) return r;
    newExpenses.push({
      id: uid(),
      amount: r.amount,
      categoryId: r.categoryId,
      note: `${r.title} (recurring)`,
      date: toDateKey(new Date(now.getFullYear(), now.getMonth(), dueDay)),
      createdAt: Date.now(),
      type: "expense",
    });
    return { ...r, lastLoggedMonth: monthKey };
  });
  return { newExpenses, updatedRecs };
}

interface AppContextValue {
  isLoaded: boolean;
  profile: Profile | null;
  expenses: Expense[];
  planned: PlannedExpense[];
  todos: Todo[];
  settings: AppSettings;
  // profile
  saveProfile: (p: Omit<Profile, "createdAt">) => void;
  // expenses
  addExpense: (e: Omit<Expense, "id" | "createdAt">) => void;
  deleteExpense: (id: string) => void;
  // planned
  addPlanned: (p: Omit<PlannedExpense, "id">) => void;
  deletePlanned: (id: string) => void;
  // todos
  addTodo: (text: string, amount?: number) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  // categories (folders)
  categories: Category[];
  addCategory: (cat: Omit<Category, "id">) => void;
  deleteCategory: (id: string) => void;
  // recurring
  recurring: RecurringExpense[];
  addRecurring: (r: Omit<RecurringExpense, "id" | "createdAt" | "lastLoggedMonth">) => void;
  deleteRecurring: (id: string) => void;
  // settings
  updateSettings: (patch: Partial<AppSettings>) => void;
  toggleModule: (key: keyof ModuleFlags) => void;
  resetAll: () => Promise<void>;
  // derived
  monthTotal: number;
  weekTotal: number;
  todayTotal: number;
  monthIncome: number;
  categoryTotals: Record<string, number>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [planned, setPlanned] = useState<PlannedExpense[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [customCats, setCustomCats] = useState<Category[]>([]);
  const [recurring, setRecurring] = useState<RecurringExpense[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const entries = await AsyncStorage.multiGet(Object.values(KEYS));
        const map = Object.fromEntries(entries);
        if (map[KEYS.profile]) setProfile(JSON.parse(map[KEYS.profile]!));
        if (map[KEYS.planned]) setPlanned(JSON.parse(map[KEYS.planned]!));
        if (map[KEYS.todos]) setTodos(JSON.parse(map[KEYS.todos]!));
        if (map[KEYS.settings]) {
          const stored = JSON.parse(map[KEYS.settings]!);
          setSettings({
            ...DEFAULT_SETTINGS,
            ...stored,
            // merge so module flags added in updates default to enabled
            modules: { ...DEFAULT_SETTINGS.modules, ...stored.modules },
          });
        }

        // load expenses + recurring together so due recurring items get logged
        let loadedExpenses: Expense[] = map[KEYS.expenses]
          ? JSON.parse(map[KEYS.expenses]!)
          : [];
        let loadedRecurring: RecurringExpense[] = map[KEYS.recurring]
          ? JSON.parse(map[KEYS.recurring]!)
          : [];
        const { newExpenses, updatedRecs } = processRecurring(loadedRecurring);
        if (newExpenses.length > 0) {
          loadedExpenses = [...newExpenses, ...loadedExpenses];
          loadedRecurring = updatedRecs;
          AsyncStorage.setItem(KEYS.expenses, JSON.stringify(loadedExpenses)).catch(() => {});
          AsyncStorage.setItem(KEYS.recurring, JSON.stringify(loadedRecurring)).catch(() => {});
        }
        setExpenses(loadedExpenses);
        setRecurring(loadedRecurring);
        if (map[KEYS.categories]) {
          const stored: Category[] = JSON.parse(map[KEYS.categories]!);
          setCustomCats(stored);
          setCustomCategories(stored); // register before first render of tabs
        }
      } catch (err) {
        console.warn("Failed to load stored data", err);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  const persist = (key: string, value: unknown) => {
    AsyncStorage.setItem(key, JSON.stringify(value)).catch((err) =>
      console.warn("Failed to save", key, err)
    );
  };

  const saveProfile = (p: Omit<Profile, "createdAt">) => {
    const next: Profile = { createdAt: profile?.createdAt ?? Date.now(), ...p };
    setProfile(next);
    persist(KEYS.profile, next);
  };

  const addExpense = (e: Omit<Expense, "id" | "createdAt">) => {
    const next = [{ ...e, id: uid(), createdAt: Date.now() }, ...expenses];
    setExpenses(next);
    persist(KEYS.expenses, next);
  };

  const deleteExpense = (id: string) => {
    const next = expenses.filter((e) => e.id !== id);
    setExpenses(next);
    persist(KEYS.expenses, next);
  };

  const addPlanned = (p: Omit<PlannedExpense, "id">) => {
    const next = [...planned, { ...p, id: uid() }];
    setPlanned(next);
    persist(KEYS.planned, next);
  };

  const deletePlanned = (id: string) => {
    const next = planned.filter((p) => p.id !== id);
    setPlanned(next);
    persist(KEYS.planned, next);
  };

  const addTodo = (text: string, amount?: number) => {
    const todo: Todo = { id: uid(), text, done: false, createdAt: Date.now() };
    if (amount && amount > 0) todo.amount = amount;
    const next = [todo, ...todos];
    setTodos(next);
    persist(KEYS.todos, next);
  };

  const toggleTodo = (id: string) => {
    const target = todos.find((t) => t.id === id);
    if (!target) return;

    const patch: Partial<Todo> = { done: !target.done };
    let nextExpenses = expenses;

    if (!target.done && target.amount && target.amount > 0) {
      // checking a budgeted todo logs it as a real expense
      const expense: Expense = {
        id: uid(),
        amount: target.amount,
        categoryId: "other",
        note: target.text,
        date: todayKey(),
        createdAt: Date.now(),
        type: "expense",
      };
      nextExpenses = [expense, ...expenses];
      patch.expenseId = expense.id;
    } else if (target.done && target.expenseId) {
      // unchecking removes the auto-created expense again
      nextExpenses = expenses.filter((e) => e.id !== target.expenseId);
      patch.expenseId = undefined;
    }

    if (nextExpenses !== expenses) {
      setExpenses(nextExpenses);
      persist(KEYS.expenses, nextExpenses);
    }
    const next = todos.map((t) => (t.id === id ? { ...t, ...patch } : t));
    setTodos(next);
    persist(KEYS.todos, next);
  };

  const deleteTodo = (id: string) => {
    const next = todos.filter((t) => t.id !== id);
    setTodos(next);
    persist(KEYS.todos, next);
  };

  const addCategory = (cat: Omit<Category, "id">) => {
    const next = [...customCats, { ...cat, id: `custom-${uid()}` }];
    setCustomCats(next);
    setCustomCategories(next);
    persist(KEYS.categories, next);
  };

  const deleteCategory = (id: string) => {
    const next = customCats.filter((c) => c.id !== id);
    if (next.length === customCats.length) return; // only custom folders can be deleted
    setCustomCats(next);
    setCustomCategories(next);
    persist(KEYS.categories, next);
    // expenses in the deleted folder move to "Other"
    if (expenses.some((e) => e.categoryId === id)) {
      const nextExpenses = expenses.map((e) =>
        e.categoryId === id ? { ...e, categoryId: "other" } : e
      );
      setExpenses(nextExpenses);
      persist(KEYS.expenses, nextExpenses);
    }
  };

  const addRecurring = (
    r: Omit<RecurringExpense, "id" | "createdAt" | "lastLoggedMonth">
  ) => {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const rec: RecurringExpense = { ...r, id: uid(), createdAt: Date.now() };
    // if this month's due day already passed, assume it was paid manually —
    // start auto-logging from next month to avoid duplicates
    if (now.getDate() >= Math.min(r.dayOfMonth, daysInMonth)) {
      rec.lastLoggedMonth = currentMonthKey();
    }
    const next = [...recurring, rec];
    setRecurring(next);
    persist(KEYS.recurring, next);
  };

  const deleteRecurring = (id: string) => {
    const next = recurring.filter((r) => r.id !== id);
    setRecurring(next);
    persist(KEYS.recurring, next);
  };

  const updateSettings = (patch: Partial<AppSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    persist(KEYS.settings, next);
  };

  const toggleModule = (key: keyof ModuleFlags) => {
    updateSettings({
      modules: { ...settings.modules, [key]: !settings.modules[key] },
    });
  };

  const resetAll = async () => {
    await AsyncStorage.multiRemove([...Object.values(KEYS), "@expenso/theme"]);
    setProfile(null);
    setExpenses([]);
    setPlanned([]);
    setTodos([]);
    setSettings(DEFAULT_SETTINGS);
    setCustomCats([]);
    setCustomCategories([]);
    setRecurring([]);
  };

  const categories = useMemo(() => [...CATEGORIES, ...customCats], [customCats]);

  const { monthTotal, weekTotal, todayTotal, monthIncome, categoryTotals } = useMemo(() => {
    const today = todayKey();
    let month = 0;
    let week = 0;
    let day = 0;
    let income = 0;
    const byCat: Record<string, number> = {};
    for (const e of expenses) {
      if (e.type === "income") {
        if (isSameMonth(e.date)) income += e.amount;
        continue;
      }
      if (isSameMonth(e.date)) {
        month += e.amount;
        byCat[e.categoryId] = (byCat[e.categoryId] ?? 0) + e.amount;
      }
      if (isSameWeek(e.date)) week += e.amount;
      if (e.date === today) day += e.amount;
    }
    return {
      monthTotal: month,
      weekTotal: week,
      todayTotal: day,
      monthIncome: income,
      categoryTotals: byCat,
    };
  }, [expenses]);

  return (
    <AppContext.Provider
      value={{
        isLoaded,
        profile,
        expenses,
        planned,
        todos,
        settings,
        saveProfile,
        addExpense,
        deleteExpense,
        addPlanned,
        deletePlanned,
        addTodo,
        toggleTodo,
        deleteTodo,
        categories,
        addCategory,
        deleteCategory,
        recurring,
        addRecurring,
        deleteRecurring,
        updateSettings,
        toggleModule,
        resetAll,
        monthTotal,
        weekTotal,
        todayTotal,
        monthIncome,
        categoryTotals,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
