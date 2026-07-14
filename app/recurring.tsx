import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AppModal from "../components/AppModal";
import EmptyState from "../components/EmptyState";
import Header from "../components/Header";
import { getCategory } from "../constants/categories";
import { useAlert } from "../contexts/AlertContext";
import { useApp } from "../contexts/AppContext";
import { useTheme } from "../contexts/ThemeContext";
import { formatMoney } from "../utils/format";

function ordinal(n: number): string {
  const suffix =
    n % 100 >= 11 && n % 100 <= 13
      ? "th"
      : n % 10 === 1
        ? "st"
        : n % 10 === 2
          ? "nd"
          : n % 10 === 3
            ? "rd"
            : "th";
  return `${n}${suffix}`;
}

export default function Recurring() {
  const { colors, mode } = useTheme();
  const { recurring, addRecurring, deleteRecurring, categories, profile } = useApp();
  const { showAlert } = useAlert();

  const [modal, setModal] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("bills");
  const [dayOfMonth, setDayOfMonth] = useState(1);

  const currency = profile?.currency ?? "$";
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthlyTotal = recurring.reduce((s, r) => s + r.amount, 0);

  const openModal = () => {
    setTitle("");
    setAmount("");
    setCategoryId("bills");
    setDayOfMonth(1);
    setModal(true);
  };

  const save = () => {
    if (!title.trim()) {
      showAlert({ title: "Title needed", message: "What is this recurring expense?", type: "warning" });
      return;
    }
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      showAlert({ title: "Amount needed", message: "Enter the amount it costs each month.", type: "warning" });
      return;
    }
    addRecurring({ title: title.trim(), amount: value, categoryId, dayOfMonth });
    setModal(false);
    showAlert({
      title: "Recurring expense added",
      message: `"${title.trim()}" will be logged automatically every ${ordinal(dayOfMonth)}.`,
      type: "success",
    });
  };

  const confirmDelete = (id: string, label: string) => {
    showAlert({
      title: "Delete recurring expense?",
      message: `"${label}" will stop being logged automatically. Already-logged expenses stay.`,
      type: "warning",
      buttons: [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteRecurring(id) },
      ],
    });
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }]}>
      <Header
        title="Recurring"
        subtitle="Bills that log themselves every month"
        showBack
        rightIcon="add"
        onRightPress={openModal}
      />

      <View style={[styles.summary, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name="repeat" size={20} color={colors.primary} />
        <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
          {recurring.length === 0
            ? "No recurring expenses yet"
            : `${recurring.length} recurring · ${formatMoney(monthlyTotal, currency)}/month`}
        </Text>
      </View>

      <FlatList
        data={recurring}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const cat = getCategory(item.categoryId);
          const catColor = mode === "dark" ? cat.colorDark : cat.color;
          const loggedThisMonth = item.lastLoggedMonth === monthKey;
          return (
            <View
              style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[styles.icon, { backgroundColor: `${catColor}22` }]}>
                <Ionicons name={cat.icon} size={20} color={catColor} />
              </View>
              <View style={styles.middle}>
                <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.meta, { color: colors.textMuted }]}>
                  {formatMoney(item.amount, currency)} · every {ordinal(item.dayOfMonth)}
                </Text>
                <View
                  style={[
                    styles.statusChip,
                    { backgroundColor: loggedThisMonth ? `${colors.success}22` : colors.surfaceAlt },
                  ]}
                >
                  <Ionicons
                    name={loggedThisMonth ? "checkmark-circle" : "time-outline"}
                    size={11}
                    color={loggedThisMonth ? colors.success : colors.primary}
                  />
                  <Text
                    style={{
                      color: loggedThisMonth ? colors.success : colors.primary,
                      fontSize: 11.5,
                      fontWeight: "700",
                    }}
                  >
                    {loggedThisMonth
                      ? "Logged this month"
                      : `Due on the ${ordinal(item.dayOfMonth)}`}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => confirmDelete(item.id, item.title)}
                style={styles.deleteTap}
              >
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="repeat-outline"
            title="Nothing recurring yet"
            message="Add rent, subscriptions, or bills once — Pulse logs them automatically on their due day each month."
          />
        }
      />

      <AppModal visible={modal} title="New recurring expense" onClose={() => setModal(false)}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Rent, Netflix, Internet"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
        />

        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Amount per month</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder={`Amount (${currency})`}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
        />

        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Folder</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {categories.map((cat) => {
            const active = categoryId === cat.id;
            const catColor = mode === "dark" ? cat.colorDark : cat.color;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setCategoryId(cat.id)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? `${catColor}22` : colors.surfaceAlt,
                    borderColor: active ? catColor : "transparent",
                  },
                ]}
              >
                <Ionicons name={cat.icon} size={14} color={active ? catColor : colors.textMuted} />
                <Text
                  style={{
                    color: active ? catColor : colors.textSecondary,
                    fontSize: 12.5,
                    fontWeight: active ? "700" : "500",
                  }}
                >
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
          {"Day of the month it's due"}
        </Text>
        <View style={styles.dayGrid}>
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
            const active = dayOfMonth === d;
            return (
              <Pressable
                key={d}
                onPress={() => setDayOfMonth(d)}
                style={[
                  styles.dayChip,
                  { backgroundColor: active ? colors.primary : colors.surfaceAlt },
                ]}
              >
                <Text
                  style={{
                    color: active ? colors.onPrimary : colors.textSecondary,
                    fontSize: 12.5,
                    fontWeight: active ? "800" : "600",
                  }}
                >
                  {d}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <TouchableOpacity
          onPress={save}
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="repeat" size={18} color={colors.onPrimary} />
          <Text style={[styles.saveText, { color: colors.onPrimary }]}>
            Add recurring expense
          </Text>
        </TouchableOpacity>
      </AppModal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    margin: 20,
    marginBottom: 8,
    padding: 14,
    borderRadius: 16,
  },
  summaryText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: "600",
  },
  list: {
    padding: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
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
  middle: { flex: 1, gap: 3 },
  title: {
    fontSize: 15,
    fontWeight: "700",
  },
  meta: {
    fontSize: 12.5,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 2,
  },
  deleteTap: {
    padding: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    marginBottom: 16,
  },
  chips: {
    gap: 8,
    paddingBottom: 16,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  dayGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 16,
  },
  dayChip: {
    width: 38,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 16,
    marginBottom: 8,
  },
  saveText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
