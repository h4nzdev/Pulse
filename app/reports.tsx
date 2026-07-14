import { Ionicons } from "@expo/vector-icons";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import React, { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Header from "../components/Header";
import ProgressBar from "../components/ProgressBar";
import { getCategory } from "../constants/categories";
import { useAlert } from "../contexts/AlertContext";
import { useApp } from "../contexts/AppContext";
import { useTheme } from "../contexts/ThemeContext";
import { MONTH_NAMES } from "../utils/dates";
import { formatMoney } from "../utils/format";

function monthKeyOf(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export default function Reports() {
  const { colors, mode } = useTheme();
  const { expenses, profile } = useApp();
  const { showAlert } = useAlert();

  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const currency = profile?.currency ?? "$";
  const selectedKey = monthKeyOf(year, month);
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  // spending per month (income excluded), for the trend and deltas
  const monthTotals = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of expenses) {
      if (e.type === "income") continue;
      const key = e.date.slice(0, 7);
      map[key] = (map[key] ?? 0) + e.amount;
    }
    return map;
  }, [expenses]);

  const monthStats = useMemo(() => {
    const items = expenses.filter((e) => e.date.slice(0, 7) === selectedKey);
    const spentItems = items.filter((e) => e.type !== "income");
    const total = spentItems.reduce((s, e) => s + e.amount, 0);
    const income = items
      .filter((e) => e.type === "income")
      .reduce((s, e) => s + e.amount, 0);
    const byCat: Record<string, number> = {};
    for (const e of spentItems) byCat[e.categoryId] = (byCat[e.categoryId] ?? 0) + e.amount;
    const biggest = [...spentItems].sort((a, b) => b.amount - a.amount)[0];
    const daysElapsed = isCurrentMonth
      ? now.getDate()
      : new Date(year, month + 1, 0).getDate();
    return {
      total,
      income,
      count: spentItems.length,
      byCat: Object.entries(byCat).sort((a, b) => b[1] - a[1]),
      biggest,
      dailyAvg: daysElapsed > 0 ? total / daysElapsed : 0,
    };
  }, [expenses, selectedKey, isCurrentMonth, year, month, now]);

  const prevKey = monthKeyOf(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1);
  const prevTotal = monthTotals[prevKey] ?? 0;
  const delta = monthStats.total - prevTotal;

  // last 6 months ending at the selected month, for the trend bars
  const trend = useMemo(() => {
    const out: { key: string; label: string; value: number; year: number; month: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - i, 1);
      const key = monthKeyOf(d.getFullYear(), d.getMonth());
      out.push({
        key,
        label: MONTH_NAMES[d.getMonth()].slice(0, 3),
        value: monthTotals[key] ?? 0,
        year: d.getFullYear(),
        month: d.getMonth(),
      });
    }
    return out;
  }, [year, month, monthTotals]);
  const trendMax = Math.max(...trend.map((t) => t.value), 1);

  const changeMonth = (dir: number) => {
    const d = new Date(year, month + dir, 1);
    if (d > now) return;
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const exportCsv = async () => {
    if (expenses.length === 0) {
      showAlert({ title: "Nothing to export", message: "Log some expenses first.", type: "info" });
      return;
    }
    if (Platform.OS === "web") {
      showAlert({
        title: "Not available on web",
        message: "CSV export works on the mobile app.",
        type: "info",
      });
      return;
    }
    try {
      const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
      const rows = [
        "date,type,category,details,amount",
        ...expenses.map((e) =>
          [
            e.date,
            e.type === "income" ? "income" : "expense",
            esc(getCategory(e.categoryId).name),
            esc(e.note ?? ""),
            e.amount.toFixed(2),
          ].join(",")
        ),
      ];
      const file = new File(Paths.cache, "pulse-expenses.csv");
      file.create({ overwrite: true });
      file.write(rows.join("\n"));
      await Sharing.shareAsync(file.uri, {
        mimeType: "text/csv",
        dialogTitle: "Export Pulse expenses",
      });
    } catch {
      showAlert({
        title: "Export failed",
        message: "Something went wrong while creating the CSV file.",
        type: "error",
      });
    }
  };

  const tiles = [
    {
      icon: "trending-down" as const,
      label: "Total spent",
      value: formatMoney(monthStats.total, currency),
    },
    {
      icon: (delta <= 0 ? "arrow-down" : "arrow-up") as "arrow-down" | "arrow-up",
      label: "vs last month",
      value: `${delta <= 0 ? "-" : "+"}${formatMoney(Math.abs(delta), currency)}`,
      good: delta <= 0,
    },
    {
      icon: "calendar" as const,
      label: "Daily average",
      value: formatMoney(monthStats.dailyAvg, currency),
    },
    {
      icon: "receipt" as const,
      label: "Entries",
      value: String(monthStats.count),
    },
  ];

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }]}>
      <Header
        title="Reports"
        subtitle="Understand your spending"
        showBack
        rightIcon="share-outline"
        onRightPress={exportCsv}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Month switcher */}
        <View style={[styles.monthBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthArrow}>
            <Ionicons name="chevron-back" size={20} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.monthTitle, { color: colors.text }]}>
            {MONTH_NAMES[month]} {year}
          </Text>
          <TouchableOpacity
            onPress={() => changeMonth(1)}
            style={[styles.monthArrow, isCurrentMonth && { opacity: 0.3 }]}
            disabled={isCurrentMonth}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* 6-month trend */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>6-month trend</Text>
          <Text style={[styles.trendValue, { color: colors.text }]}>
            {formatMoney(monthStats.total, currency)}
            <Text style={[styles.trendLabel, { color: colors.textSecondary }]}>
              {"  "}spent in {MONTH_NAMES[month].slice(0, 3)}
            </Text>
          </Text>
          <View style={styles.trendRow}>
            {trend.map((t) => {
              const selected = t.key === selectedKey;
              const h = Math.max((t.value / trendMax) * 90, t.value > 0 ? 6 : 3);
              return (
                <Pressable
                  key={t.key}
                  style={styles.trendSlot}
                  onPress={() => {
                    setYear(t.year);
                    setMonth(t.month);
                  }}
                >
                  <View style={styles.trendArea}>
                    <View
                      style={[
                        styles.trendBar,
                        {
                          height: h,
                          backgroundColor: selected ? colors.chartBar : colors.chartBarFaded,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.trendMonth,
                      {
                        color: selected ? colors.primary : colors.textMuted,
                        fontWeight: selected ? "700" : "500",
                      },
                    ]}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Stat tiles */}
        <View style={styles.tileGrid}>
          {tiles.map((tile) => (
            <View
              key={tile.label}
              style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Ionicons
                name={tile.icon}
                size={16}
                color={
                  tile.good === undefined ? colors.primary : tile.good ? colors.success : colors.danger
                }
              />
              <Text style={[styles.tileValue, { color: colors.text }]} numberOfLines={1}>
                {tile.value}
              </Text>
              <Text style={[styles.tileLabel, { color: colors.textMuted }]}>{tile.label}</Text>
            </View>
          ))}
        </View>

        {/* Extras */}
        {monthStats.income > 0 && (
          <View style={[styles.inlineRow, { backgroundColor: `${colors.success}1A` }]}>
            <Ionicons name="trending-up" size={16} color={colors.success} />
            <Text style={[styles.inlineText, { color: colors.text }]}>
              Money added: +{formatMoney(monthStats.income, currency)}
            </Text>
          </View>
        )}
        {monthStats.biggest && (
          <View style={[styles.inlineRow, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="flame" size={16} color={colors.primary} />
            <Text style={[styles.inlineText, { color: colors.text }]}>
              Biggest: {monthStats.biggest.note || getCategory(monthStats.biggest.categoryId).name}{" "}
              — {formatMoney(monthStats.biggest.amount, currency)}
            </Text>
          </View>
        )}

        {/* Category breakdown */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>By folder</Text>
          {monthStats.byCat.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No spending in this month.
            </Text>
          ) : (
            monthStats.byCat.map(([catId, total]) => {
              const cat = getCategory(catId);
              const catColor = mode === "dark" ? cat.colorDark : cat.color;
              const share = monthStats.total > 0 ? total / monthStats.total : 0;
              return (
                <View key={catId} style={styles.catRow}>
                  <View style={[styles.catIcon, { backgroundColor: `${catColor}22` }]}>
                    <Ionicons name={cat.icon} size={16} color={catColor} />
                  </View>
                  <View style={styles.catMiddle}>
                    <View style={styles.catLabelRow}>
                      <Text style={[styles.catName, { color: colors.text }]}>
                        {cat.name}
                        <Text style={{ color: colors.textMuted }}>
                          {"  "}{Math.round(share * 100)}%
                        </Text>
                      </Text>
                      <Text style={[styles.catAmount, { color: colors.textSecondary }]}>
                        {formatMoney(total, currency)}
                      </Text>
                    </View>
                    <ProgressBar progress={share} color={catColor} trackColor={colors.surfaceAlt} height={6} />
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Export */}
        <TouchableOpacity
          onPress={exportCsv}
          style={[styles.exportButton, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="download-outline" size={18} color={colors.onPrimary} />
          <Text style={[styles.exportText, { color: colors.onPrimary }]}>
            Export all entries as CSV
          </Text>
        </TouchableOpacity>
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
  monthBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 14,
  },
  monthArrow: {
    padding: 10,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15.5,
    fontWeight: "700",
    marginBottom: 10,
  },
  trendValue: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 12,
  },
  trendLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  trendRow: {
    flexDirection: "row",
    gap: 8,
  },
  trendSlot: {
    flex: 1,
    alignItems: "center",
  },
  trendArea: {
    height: 90,
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  trendBar: {
    width: "68%",
    maxWidth: 30,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  trendMonth: {
    fontSize: 11,
    marginTop: 6,
  },
  tileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 14,
  },
  tile: {
    width: "47.5%",
    flexGrow: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  tileValue: {
    fontSize: 17,
    fontWeight: "800",
  },
  tileLabel: {
    fontSize: 11.5,
  },
  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  inlineText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 13,
    paddingVertical: 6,
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
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 16,
    marginTop: 4,
  },
  exportText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
