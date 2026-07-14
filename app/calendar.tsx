import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AppModal from "../components/AppModal";
import Header from "../components/Header";
import { useAlert } from "../contexts/AlertContext";
import { useApp } from "../contexts/AppContext";
import { useTheme } from "../contexts/ThemeContext";
import { MONTH_NAMES, formatDateKey, monthGrid, todayKey } from "../utils/dates";
import { formatMoney } from "../utils/format";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export default function Calendar() {
  const { colors } = useTheme();
  const { planned, addPlanned, deletePlanned, profile } = useApp();
  const { showAlert } = useAlert();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const currency = profile?.currency ?? "$";
  const today = todayKey();
  const cells = useMemo(() => monthGrid(year, month), [year, month]);

  const plannedByDay = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of planned) map[p.date] = (map[p.date] ?? 0) + 1;
    return map;
  }, [planned]);

  const dayPlans = selectedDay ? planned.filter((p) => p.date === selectedDay) : [];

  const changeMonth = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const closeModal = () => {
    setSelectedDay(null);
    setTitle("");
    setAmount("");
    setNote("");
  };

  const savePlan = () => {
    if (!selectedDay) return;
    if (!title.trim()) {
      showAlert({ title: "Title needed", message: "What are you planning to spend on?", type: "warning" });
      return;
    }
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      showAlert({ title: "Amount needed", message: "Enter the planned amount.", type: "warning" });
      return;
    }
    addPlanned({ date: selectedDay, title: title.trim(), amount: value, note: note.trim() });
    setTitle("");
    setAmount("");
    setNote("");
    showAlert({ title: "Planned!", message: `${title.trim()} on ${formatDateKey(selectedDay)}`, type: "success" });
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }]}>
      <Header title="Calendar" subtitle="Tap a day to plan an expense" showBack />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Month switcher */}
        <View style={[styles.monthBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthArrow}>
            <Ionicons name="chevron-back" size={20} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.monthTitle, { color: colors.text }]}>
            {MONTH_NAMES[month]} {year}
          </Text>
          <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthArrow}>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Grid */}
        <View style={[styles.calendar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.weekRow}>
            {WEEKDAYS.map((d) => (
              <Text key={d} style={[styles.weekday, { color: colors.textMuted }]}>
                {d}
              </Text>
            ))}
          </View>
          <View style={styles.daysGrid}>
            {cells.map((key, i) => {
              if (!key) return <View key={`pad-${i}`} style={styles.dayCell} />;
              const dayNum = Number(key.slice(-2));
              const isToday = key === today;
              const hasPlans = !!plannedByDay[key];
              return (
                <Pressable
                  key={key}
                  onPress={() => setSelectedDay(key)}
                  style={({ pressed }) => [
                    styles.dayCell,
                    pressed && { backgroundColor: colors.surfaceAlt, borderRadius: 12 },
                  ]}
                >
                  <View style={[styles.dayInner, isToday && { backgroundColor: colors.primary }]}>
                    <Text
                      style={[
                        styles.dayText,
                        { color: isToday ? colors.onPrimary : colors.text },
                        isToday && { fontWeight: "800" },
                      ]}
                    >
                      {dayNum}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: hasPlans ? colors.primary : "transparent" },
                    ]}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Upcoming plans */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Planned expenses</Text>
        {planned.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Nothing planned yet — tap any day above to add one.
          </Text>
        ) : (
          [...planned]
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((p) => (
              <View
                key={p.id}
                style={[styles.planRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={[styles.planDate, { backgroundColor: colors.primarySoft }]}>
                  <Text style={[styles.planDay, { color: colors.primary }]}>
                    {Number(p.date.slice(-2))}
                  </Text>
                  <Text style={[styles.planMonth, { color: colors.primary }]}>
                    {MONTH_NAMES[Number(p.date.slice(5, 7)) - 1].slice(0, 3)}
                  </Text>
                </View>
                <View style={styles.planMiddle}>
                  <Text style={[styles.planTitle, { color: colors.text }]}>{p.title}</Text>
                  {!!p.note && (
                    <Text style={[styles.planNote, { color: colors.textMuted }]} numberOfLines={1}>
                      {p.note}
                    </Text>
                  )}
                </View>
                <Text style={[styles.planAmount, { color: colors.text }]}>
                  {formatMoney(p.amount, currency)}
                </Text>
              </View>
            ))
        )}
      </ScrollView>

      {/* Day detail modal */}
      <AppModal
        visible={!!selectedDay}
        title={selectedDay ? formatDateKey(selectedDay) : ""}
        onClose={closeModal}
      >
        {dayPlans.length > 0 && (
          <View style={styles.modalPlans}>
            {dayPlans.map((p) => (
              <View
                key={p.id}
                style={[styles.modalPlanRow, { backgroundColor: colors.surfaceAlt }]}
              >
                <View style={styles.planMiddle}>
                  <Text style={[styles.planTitle, { color: colors.text }]}>{p.title}</Text>
                  <Text style={[styles.planNote, { color: colors.textSecondary }]}>
                    {formatMoney(p.amount, currency)}
                    {p.note ? ` · ${p.note}` : ""}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => deletePlanned(p.id)}>
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
          Plan a new expense
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Title, e.g. Car insurance"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
        />
        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder={`Amount (${currency})`}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
        />
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Details (optional)"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
        />
        <TouchableOpacity
          onPress={savePlan}
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="calendar" size={18} color={colors.onPrimary} />
          <Text style={[styles.saveText, { color: colors.onPrimary }]}>Add planned expense</Text>
        </TouchableOpacity>
      </AppModal>
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
  calendar: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    marginBottom: 22,
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  weekday: {
    flex: 1,
    textAlign: "center",
    fontSize: 11.5,
    fontWeight: "700",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  dayInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    fontSize: 13.5,
    fontWeight: "600",
  },
  // always rendered (transparent when no plans) so day numbers stay aligned
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 13.5,
  },
  planRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  planDate: {
    width: 48,
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 6,
  },
  planDay: {
    fontSize: 17,
    fontWeight: "800",
  },
  planMonth: {
    fontSize: 10.5,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  planMiddle: { flex: 1 },
  planTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  planNote: {
    fontSize: 12,
    marginTop: 2,
  },
  planAmount: {
    fontSize: 14,
    fontWeight: "700",
  },
  modalPlans: {
    gap: 8,
    marginBottom: 16,
  },
  modalPlanRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    padding: 12,
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
    fontSize: 14.5,
    marginBottom: 10,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 16,
    marginTop: 6,
    marginBottom: 8,
  },
  saveText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
