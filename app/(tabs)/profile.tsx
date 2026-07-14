import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import AppModal from "../../components/AppModal";
import Header from "../../components/Header";
import { useAlert } from "../../contexts/AlertContext";
import { useApp } from "../../contexts/AppContext";
import { useTheme } from "../../contexts/ThemeContext";
import { MONTH_NAMES } from "../../utils/dates";
import { formatMoney } from "../../utils/format";

export default function Profile() {
  const { colors } = useTheme();
  const { profile, saveProfile, expenses, todos, monthTotal } = useApp();
  const { showAlert } = useAlert();

  const [editModal, setEditModal] = useState(false);
  const [name, setName] = useState("");

  const currency = profile?.currency ?? "$";
  const joined = profile ? new Date(profile.createdAt) : new Date();
  const initials = (profile?.name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const totalAll = expenses.reduce((sum, e) => sum + e.amount, 0);
  const doneTodos = todos.filter((t) => t.done).length;

  const stats = [
    { icon: "receipt" as const, label: "Expenses logged", value: String(expenses.length) },
    { icon: "cash" as const, label: "Total tracked", value: formatMoney(totalAll, currency) },
    { icon: "trending-down" as const, label: "This month", value: formatMoney(monthTotal, currency) },
    { icon: "checkmark-done" as const, label: "Todos done", value: `${doneTodos}/${todos.length}` },
  ];

  const openEdit = () => {
    setName(profile?.name ?? "");
    setEditModal(true);
  };

  const saveName = () => {
    if (!profile) return;
    if (!name.trim()) {
      showAlert({ title: "Name required", message: "Your name can't be empty.", type: "warning" });
      return;
    }
    saveProfile({ ...profile, name: name.trim() });
    setEditModal(false);
    showAlert({ title: "Profile updated", type: "success" });
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }]}>
      <Header title="Profile" subtitle="Your account at a glance" rightIcon="create" onRightPress={openEdit} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={[styles.name, { color: colors.text }]}>{profile?.name}</Text>
          <Text style={[styles.joined, { color: colors.textSecondary }]}>
            Tracking since {MONTH_NAMES[joined.getMonth()]} {joined.getFullYear()}
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={[styles.budgetRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={styles.budgetCol}>
            <Text style={[styles.budgetLabel, { color: colors.textMuted }]}>Monthly budget</Text>
            <Text style={[styles.budgetValue, { color: colors.text }]}>
              {formatMoney(profile?.monthlyBudget ?? 0, currency)}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.budgetCol}>
            <Text style={[styles.budgetLabel, { color: colors.textMuted }]}>Weekly budget</Text>
            <Text style={[styles.budgetValue, { color: colors.text }]}>
              {formatMoney(profile?.weeklyBudget ?? 0, currency)}
            </Text>
          </View>
        </Animated.View>

        <View style={styles.statsGrid}>
          {stats.map((stat, i) => (
            <Animated.View
              key={stat.label}
              entering={FadeInDown.delay(180 + i * 70).duration(400)}
              style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[styles.statIcon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name={stat.icon} size={18} color={colors.primary} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]} numberOfLines={1}>
                {stat.value}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{stat.label}</Text>
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      <AppModal visible={editModal} title="Edit profile" onClose={() => setEditModal(false)}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Your name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Name"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
        />
        <TouchableOpacity
          onPress={saveName}
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.saveText, { color: colors.onPrimary }]}>Save</Text>
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
  avatarSection: {
    alignItems: "center",
    paddingVertical: 18,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
  },
  name: {
    fontSize: 22,
    fontWeight: "800",
  },
  joined: {
    fontSize: 13,
    marginTop: 3,
  },
  budgetRow: {
    flexDirection: "row",
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginTop: 8,
    marginBottom: 16,
  },
  budgetCol: {
    flex: 1,
    alignItems: "center",
  },
  divider: {
    width: 1,
    marginHorizontal: 12,
  },
  budgetLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  budgetValue: {
    fontSize: 19,
    fontWeight: "800",
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    width: "47.8%",
    flexGrow: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 16,
    marginBottom: 16,
  },
  saveButton: {
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 8,
  },
  saveText: {
    fontSize: 15.5,
    fontWeight: "700",
  },
});
