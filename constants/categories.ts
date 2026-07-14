import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

export type IoniconName = ComponentProps<typeof Ionicons>["name"];

export interface Category {
  id: string;
  name: string;
  icon: IoniconName;
  /** Validated categorical palette — light / dark surface steps */
  color: string;
  colorDark: string;
}

// Slot order follows the validated categorical palette (CVD-safe ordering).
// Category identity is always shown with icon + name, never color alone.
export const CATEGORIES: Category[] = [
  { id: "groceries", name: "Groceries", icon: "cart", color: "#2a78d6", colorDark: "#3987e5" },
  { id: "food", name: "Food & Dining", icon: "restaurant", color: "#1baf7a", colorDark: "#199e70" },
  { id: "transport", name: "Transport", icon: "bus", color: "#eda100", colorDark: "#c98500" },
  { id: "bills", name: "Bills & Utilities", icon: "flash", color: "#008300", colorDark: "#008300" },
  { id: "shopping", name: "Shopping", icon: "bag-handle", color: "#4a3aa7", colorDark: "#9085e9" },
  { id: "health", name: "Health", icon: "medkit", color: "#e34948", colorDark: "#e66767" },
  { id: "entertainment", name: "Entertainment", icon: "game-controller", color: "#e87ba4", colorDark: "#d55181" },
  { id: "other", name: "Other", icon: "ellipsis-horizontal-circle", color: "#eb6834", colorDark: "#d95926" },
];

/** Icons users can pick for custom folders */
export const FOLDER_ICONS: IoniconName[] = [
  "pricetag", "gift", "airplane", "home", "book", "barbell",
  "cafe", "paw", "musical-notes", "car-sport", "shirt", "construct",
];

/** Color pairs (light/dark) from the validated palette, for custom folders */
export const FOLDER_COLORS: { color: string; colorDark: string }[] = CATEGORIES.map(
  ({ color, colorDark }) => ({ color, colorDark })
);

// Custom folders are registered here by AppContext so getCategory works
// everywhere (lists, chatbot, dashboard) without threading context through.
let customCategories: Category[] = [];

export function setCustomCategories(list: Category[]) {
  customCategories = list;
}

export function allCategories(): Category[] {
  return [...CATEGORIES, ...customCategories];
}

export function getCategory(id: string): Category {
  return allCategories().find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}
