import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getCategory } from "../constants/categories";
import { Expense } from "../contexts/AppContext";
import { useTheme } from "../contexts/ThemeContext";
import { formatDateKey } from "../utils/dates";
import { formatMoney } from "../utils/format";

interface ExpenseItemProps {
  expense: Expense;
  currency: string;
  onLongPress?: () => void;
}

export default function ExpenseItem({ expense, currency, onLongPress }: ExpenseItemProps) {
  const { colors, mode } = useTheme();
  const isIncome = expense.type === "income";
  const cat = getCategory(expense.categoryId);
  const catColor = isIncome ? colors.success : mode === "dark" ? cat.colorDark : cat.color;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onLongPress={onLongPress}
      style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={[styles.icon, { backgroundColor: `${catColor}22` }]}>
        <Ionicons name={isIncome ? "trending-up" : cat.icon} size={20} color={catColor} />
      </View>
      <View style={styles.middle}>
        <Text style={[styles.note, { color: colors.text }]} numberOfLines={1}>
          {expense.note || (isIncome ? "Money added" : cat.name)}
        </Text>
        <Text style={[styles.meta, { color: colors.textMuted }]}>
          {isIncome ? "Income" : cat.name} · {formatDateKey(expense.date)}
        </Text>
      </View>
      <Text style={[styles.amount, { color: isIncome ? colors.success : colors.text }]}>
        {isIncome ? "+" : "-"}
        {formatMoney(expense.amount, currency)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  middle: { flex: 1 },
  note: {
    fontSize: 15,
    fontWeight: "600",
  },
  meta: {
    fontSize: 12,
    marginTop: 2,
  },
  amount: {
    fontSize: 15,
    fontWeight: "700",
  },
});
