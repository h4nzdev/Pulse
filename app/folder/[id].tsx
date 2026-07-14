import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import EmptyState from "../../components/EmptyState";
import ExpenseItem from "../../components/ExpenseItem";
import Header from "../../components/Header";
import { getCategory } from "../../constants/categories";
import { useAlert } from "../../contexts/AlertContext";
import { useApp } from "../../contexts/AppContext";
import { useTheme } from "../../contexts/ThemeContext";
import { formatMoney } from "../../utils/format";

export default function FolderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, mode } = useTheme();
  const { expenses, deleteExpense, profile } = useApp();
  const { showAlert } = useAlert();

  const cat = getCategory(id ?? "other");
  const catColor = mode === "dark" ? cat.colorDark : cat.color;
  const currency = profile?.currency ?? "$";

  const items = useMemo(
    () => expenses.filter((e) => e.categoryId === cat.id && e.type !== "income"),
    [expenses, cat.id]
  );
  const total = items.reduce((sum, e) => sum + e.amount, 0);

  const confirmDelete = (expenseId: string, note: string) => {
    showAlert({
      title: "Delete expense?",
      message: `"${note}" will be removed permanently.`,
      type: "warning",
      buttons: [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteExpense(expenseId) },
      ],
    });
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }]}>
      <Header title={cat.name} subtitle={`${items.length} expense${items.length === 1 ? "" : "s"}`} showBack />
      <View style={[styles.summary, { backgroundColor: `${catColor}22` }]}>
        <View style={[styles.summaryIcon, { backgroundColor: catColor }]}>
          <Ionicons name={cat.icon} size={22} color="#FFFFFF" />
        </View>
        <View>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
            Total in this folder
          </Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {formatMoney(total, currency)}
          </Text>
        </View>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ExpenseItem
            expense={item}
            currency={currency}
            onLongPress={() => confirmDelete(item.id, item.note || cat.name)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="folder-open-outline"
            title="This folder is empty"
            message={`Expenses you log under ${cat.name} will show up here.`}
          />
        }
        ListFooterComponent={
          items.length > 0 ? (
            <Text style={[styles.hint, { color: colors.textMuted }]}>
              Long-press an expense to delete it
            </Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    margin: 20,
    marginBottom: 10,
    padding: 16,
    borderRadius: 20,
  },
  summaryIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryLabel: {
    fontSize: 12.5,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: "800",
    marginTop: 2,
  },
  list: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  hint: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 10,
  },
});
