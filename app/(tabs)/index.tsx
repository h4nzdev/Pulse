import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import BudgetWarningBanner from "../../components/BudgetWarningBanner";
import EmptyState from "../../components/EmptyState";
import ExpenseItem from "../../components/ExpenseItem";
import Header from "../../components/Header";
import ProgressBar from "../../components/ProgressBar";
import WeeklyBarChart from "../../components/WeeklyBarChart";
import { getCategory } from "../../constants/categories";
import { useAlert } from "../../contexts/AlertContext";
import { useApp } from "../../contexts/AppContext";
import { useTheme } from "../../contexts/ThemeContext";
import { last7Days } from "../../utils/dates";
import { formatMoney } from "../../utils/format";

export default function Dashboard() {
  const { colors, mode } = useTheme();
  const {
    profile,
    expenses,
    deleteExpense,
    monthTotal,
    weekTotal,
    monthIncome,
    categoryTotals,
  } = useApp();
  const { showAlert } = useAlert();
  const router = useRouter();

  const currency = profile?.currency ?? "$";
  const monthlyBudget = profile?.monthlyBudget ?? 0;
  const remaining = monthlyBudget - monthTotal;
  const progress = monthlyBudget > 0 ? monthTotal / monthlyBudget : 0;
  const overBudget = remaining < 0;
  const nearBudget = !overBudget && progress >= 0.8;

  const chartData = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const e of expenses) {
      if (e.type === "income") continue;
      totals[e.date] = (totals[e.date] ?? 0) + e.amount;
    }
    return last7Days().map((d) => ({ ...d, value: totals[d.key] ?? 0 }));
  }, [expenses]);

  const topCategories = useMemo(
    () =>
      Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4),
    [categoryTotals]
  );

  const recent = expenses.slice(0, 5);

  const confirmDelete = (id: string, note: string) => {
    showAlert({
      title: "Delete expense?",
      message: `"${note}" will be removed permanently.`,
      type: "warning",
      buttons: [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteExpense(id) },
      ],
    });
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }]}>
      <Header
        title={`Hello, ${profile?.name ?? "there"} 👋`}
        subtitle="Here's your spending overview"
        rightIcon="chatbubble-ellipses"
        onRightPress={() => router.push("/chatbot")}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Budget card */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={[styles.budgetCard, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.budgetLabel}>Spent this month</Text>
          <Text style={styles.budgetValue}>{formatMoney(monthTotal, currency)}</Text>
          <ProgressBar
            progress={progress}
            color={overBudget ? "#FCA5A5" : nearBudget ? "#FCD34D" : "#FFFFFF"}
            trackColor="rgba(255,255,255,0.25)"
          />
          <View style={styles.budgetFooter}>
            <Text style={styles.budgetSmall}>
              {overBudget
                ? `${formatMoney(-remaining, currency)} over budget`
                : `${formatMoney(remaining, currency)} left of ${formatMoney(monthlyBudget, currency)}`}
            </Text>
            <Text style={styles.budgetSmall}>
              Week: {formatMoney(weekTotal, currency)}
            </Text>
          </View>
          {monthIncome > 0 && (
            <Text style={styles.budgetIncome}>
              +{formatMoney(monthIncome, currency)} added this month
            </Text>
          )}
        </Animated.View>

        {/* Visual budget warning */}
        {(overBudget || nearBudget) && (
          <BudgetWarningBanner
            level={overBudget ? "danger" : "warning"}
            percent={Math.round(progress * 100)}
            message={
              overBudget
                ? `You're ${formatMoney(-remaining, currency)} over your monthly budget — time to slow down!`
                : "You're getting close to your monthly budget. Spend carefully!"
            }
          />
        )}

        {/* 7-day chart */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>Last 7 days</Text>
          <WeeklyBarChart data={chartData} currency={currency} />
        </Animated.View>

        {/* Category breakdown */}
        <Animated.View
          entering={FadeInDown.delay(180).duration(400)}
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Top categories</Text>
            <TouchableOpacity onPress={() => router.push("/folders")}>
              <Text style={[styles.link, { color: colors.primary }]}>All folders</Text>
            </TouchableOpacity>
          </View>
          {topCategories.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No spending this month yet.
            </Text>
          ) : (
            topCategories.map(([catId, total]) => {
              const cat = getCategory(catId);
              const catColor = mode === "dark" ? cat.colorDark : cat.color;
              const share = monthTotal > 0 ? total / monthTotal : 0;
              return (
                <View key={catId} style={styles.catRow}>
                  <View style={[styles.catIcon, { backgroundColor: `${catColor}22` }]}>
                    <Ionicons name={cat.icon} size={16} color={catColor} />
                  </View>
                  <View style={styles.catMiddle}>
                    <View style={styles.catLabelRow}>
                      <Text style={[styles.catName, { color: colors.text }]}>{cat.name}</Text>
                      <Text style={[styles.catAmount, { color: colors.textSecondary }]}>
                        {formatMoney(total, currency)}
                      </Text>
                    </View>
                    <ProgressBar
                      progress={share}
                      color={catColor}
                      trackColor={colors.surfaceAlt}
                      height={6}
                    />
                  </View>
                </View>
              );
            })
          )}
        </Animated.View>

        {/* Recent history */}
        <Animated.View entering={FadeInDown.delay(260).duration(400)}>
          <View style={[styles.cardHeader, styles.sectionHeader]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Recent history</Text>
          </View>
          {recent.length === 0 ? (
            <EmptyState
              icon="receipt-outline"
              title="No expenses yet"
              message="Tap the purple + button below to log your first expense."
            />
          ) : (
            recent.map((e) => (
              <ExpenseItem
                key={e.id}
                expense={e}
                currency={currency}
                onLongPress={() => confirmDelete(e.id, e.note || getCategory(e.categoryId).name)}
              />
            ))
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  budgetCard: {
    borderRadius: 24,
    padding: 22,
    marginBottom: 16,
  },
  budgetLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13.5,
    fontWeight: "600",
  },
  budgetValue: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "800",
    marginVertical: 8,
    letterSpacing: -1,
  },
  budgetFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  budgetSmall: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12.5,
    fontWeight: "600",
  },
  budgetIncome: {
    color: "#D1FAE5",
    fontSize: 12.5,
    fontWeight: "700",
    marginTop: 8,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionHeader: {
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  link: {
    fontSize: 13,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 13.5,
    paddingVertical: 8,
  },
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  catIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  catMiddle: { flex: 1 },
  catLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  catName: {
    fontSize: 13.5,
    fontWeight: "600",
  },
  catAmount: {
    fontSize: 12.5,
    fontWeight: "600",
  },
});
