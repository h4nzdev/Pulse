import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AppModal from "../../components/AppModal";
import Header from "../../components/Header";
import { IoniconName } from "../../constants/categories";
import { CURRENCIES } from "../../constants/theme";
import { useAlert } from "../../contexts/AlertContext";
import { useApp } from "../../contexts/AppContext";
import { useTheme } from "../../contexts/ThemeContext";
import { formatMoney } from "../../utils/format";
import { disableDailyReminder, enableDailyReminder } from "../../utils/notifications";

function formatTime12(hour: number, minute: number): string {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:${String(minute).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`;
}

function Row({
  icon,
  label,
  sublabel,
  right,
  onPress,
  colors,
}: {
  icon: IoniconName;
  label: string;
  sublabel?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      style={[styles.row, { borderBottomColor: colors.border }]}
    >
      <View style={[styles.rowIcon, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.rowMiddle}>
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
        {!!sublabel && (
          <Text style={[styles.rowSub, { color: colors.textMuted }]}>{sublabel}</Text>
        )}
      </View>
      {right}
    </TouchableOpacity>
  );
}

export default function Settings() {
  const { colors, mode, toggleTheme } = useTheme();
  const { profile, saveProfile, settings, updateSettings, resetAll } = useApp();
  const { showAlert } = useAlert();

  const [budgetModal, setBudgetModal] = useState(false);
  const [monthly, setMonthly] = useState("");
  const [weekly, setWeekly] = useState("");
  const [aiModal, setAiModal] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showTimePicker, setShowTimePicker] = useState(false);

  const currency = profile?.currency ?? "$";

  const toggleNotifications = async (value: boolean) => {
    if (Platform.OS === "web") {
      showAlert({
        title: "Not available on web",
        message: "Reminders work on the mobile app (iOS/Android).",
        type: "info",
      });
      return;
    }
    if (value) {
      const ok = await enableDailyReminder(settings.reminderHour, settings.reminderMinute);
      if (!ok) {
        showAlert({
          title: "Permission needed",
          message: "Allow notifications in your device settings to get daily reminders.",
          type: "warning",
        });
        return;
      }
      updateSettings({ notificationsEnabled: true });
      showAlert({
        title: "Reminder on",
        message: `We'll remind you daily at ${formatTime12(settings.reminderHour, settings.reminderMinute)} to log your expenses.`,
        type: "success",
      });
    } else {
      await disableDailyReminder();
      updateSettings({ notificationsEnabled: false });
    }
  };

  const onTimePicked = async (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") setShowTimePicker(false);
    if (event.type !== "set" || !date) return;
    const hour = date.getHours();
    const minute = date.getMinutes();
    updateSettings({ reminderHour: hour, reminderMinute: minute });
    if (settings.notificationsEnabled && Platform.OS !== "web") {
      await enableDailyReminder(hour, minute);
    }
  };

  const pickerValue = new Date();
  pickerValue.setHours(settings.reminderHour, settings.reminderMinute, 0, 0);

  const cycleCurrency = () => {
    if (!profile) return;
    const idx = CURRENCIES.indexOf(profile.currency as (typeof CURRENCIES)[number]);
    const next = CURRENCIES[(idx + 1) % CURRENCIES.length];
    saveProfile({ ...profile, currency: next });
  };

  const openBudgetModal = () => {
    setMonthly(String(profile?.monthlyBudget ?? ""));
    setWeekly(String(profile?.weeklyBudget ?? ""));
    setBudgetModal(true);
  };

  const saveBudget = () => {
    if (!profile) return;
    const m = parseFloat(monthly);
    const w = parseFloat(weekly);
    if (!m || m <= 0) {
      showAlert({ title: "Invalid budget", message: "Monthly budget must be greater than zero.", type: "error" });
      return;
    }
    saveProfile({ ...profile, monthlyBudget: m, weeklyBudget: w > 0 ? w : Math.round(m / 4.33) });
    setBudgetModal(false);
    showAlert({ title: "Budget updated", type: "success" });
  };

  const hasKey = !!settings.geminiApiKey.trim();
  const maskedKey = hasKey
    ? `${settings.geminiApiKey.slice(0, 6)}••••${settings.geminiApiKey.slice(-4)}`
    : "";

  const openAiModal = () => {
    setApiKey(settings.geminiApiKey);
    setAiModal(true);
  };

  const saveApiKey = () => {
    updateSettings({ geminiApiKey: apiKey.trim() });
    setAiModal(false);
    showAlert({
      title: apiKey.trim() ? "Gemini connected" : "Key removed",
      message: apiKey.trim()
        ? "Penny will now answer with Gemini. If the key stops working, the built-in assistant takes over automatically."
        : "Penny is back to the built-in assistant.",
      type: "success",
    });
  };

  const confirmReset = () => {
    showAlert({
      title: "Reset everything?",
      message: "All expenses, todos, planned items, and your profile will be deleted. This cannot be undone.",
      type: "warning",
      buttons: [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: () => void resetAll() },
      ],
    });
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }]}>
      <Header title="Settings" subtitle="Make Expenso yours" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.section, { color: colors.textMuted }]}>APPEARANCE</Text>
        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Row
            icon={mode === "dark" ? "moon" : "sunny"}
            label="Dark mode"
            sublabel={mode === "dark" ? "On — easy on the eyes" : "Off — bright and clean"}
            colors={colors}
            right={
              <Switch
                value={mode === "dark"}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            }
          />
        </View>

        <Text style={[styles.section, { color: colors.textMuted }]}>BUDGET</Text>
        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Row
            icon="wallet"
            label="Monthly budget"
            sublabel={formatMoney(profile?.monthlyBudget ?? 0, currency)}
            colors={colors}
            onPress={openBudgetModal}
            right={<Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
          />
          <Row
            icon="calendar-number"
            label="Weekly budget"
            sublabel={formatMoney(profile?.weeklyBudget ?? 0, currency)}
            colors={colors}
            onPress={openBudgetModal}
            right={<Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
          />
          <Row
            icon="cash"
            label="Currency"
            sublabel={`Currently ${currency} — tap to change`}
            colors={colors}
            onPress={cycleCurrency}
            right={<Text style={[styles.currencyBadge, { color: colors.primary }]}>{currency}</Text>}
          />
        </View>

        <Text style={[styles.section, { color: colors.textMuted }]}>REMINDERS</Text>
        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Row
            icon="notifications"
            label="Daily reminder"
            sublabel="A nudge to log today's expenses"
            colors={colors}
            right={
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <Row
            icon="time"
            label="Reminder time"
            sublabel={`Daily at ${formatTime12(settings.reminderHour, settings.reminderMinute)} — tap to change`}
            colors={colors}
            onPress={() => setShowTimePicker(!showTimePicker)}
            right={
              <Text style={[styles.timeBadge, { color: colors.primary }]}>
                {formatTime12(settings.reminderHour, settings.reminderMinute)}
              </Text>
            }
          />
          {showTimePicker && (
            <DateTimePicker
              value={pickerValue}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onTimePicked}
            />
          )}
        </View>

        <Text style={[styles.section, { color: colors.textMuted }]}>AI ASSISTANT</Text>
        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Row
            icon="sparkles"
            label="Gemini API key"
            sublabel={hasKey ? `Connected · ${maskedKey}` : "Not set — Penny uses the built-in assistant"}
            colors={colors}
            onPress={openAiModal}
            right={<Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
          />
        </View>

        <Text style={[styles.section, { color: colors.textMuted }]}>DANGER ZONE</Text>
        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Row
            icon="trash"
            label="Reset all data"
            sublabel="Delete everything and start over"
            colors={colors}
            onPress={confirmReset}
            right={<Ionicons name="chevron-forward" size={18} color={colors.danger} />}
          />
        </View>

        <Text style={[styles.footer, { color: colors.textMuted }]}>Pulse v1.0 · made with 💜</Text>
      </ScrollView>

      <AppModal visible={aiModal} title="Gemini API key" onClose={() => setAiModal(false)}>
        <View style={[styles.stepsCard, { backgroundColor: colors.surfaceAlt }]}>
          <Text style={[styles.stepsTitle, { color: colors.text }]}>How to get a free key</Text>
          {[
            "Open aistudio.google.com in your browser",
            "Sign in with your Google account",
            'Click "Get API key" in the left menu',
            'Click "Create API key" and pick a project',
            "Copy the key (starts with AIza) and paste it below",
          ].map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
                <Text style={[styles.stepNumText, { color: colors.onPrimary }]}>{i + 1}</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.textSecondary }]}>{step}</Text>
            </View>
          ))}
        </View>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
          The key is stored only on this device. Leave empty to use the built-in assistant.
        </Text>
        <TextInput
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="AIza..."
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
        />
        <TouchableOpacity
          onPress={saveApiKey}
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.saveText, { color: colors.onPrimary }]}>Save</Text>
        </TouchableOpacity>
        {hasKey && (
          <TouchableOpacity
            onPress={() => {
              setApiKey("");
              updateSettings({ geminiApiKey: "" });
              setAiModal(false);
            }}
            style={[styles.saveButton, { backgroundColor: colors.surfaceAlt }]}
          >
            <Text style={[styles.saveText, { color: colors.danger }]}>Remove key</Text>
          </TouchableOpacity>
        )}
      </AppModal>

      <AppModal visible={budgetModal} title="Edit budget" onClose={() => setBudgetModal(false)}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Monthly budget</Text>
        <TextInput
          value={monthly}
          onChangeText={setMonthly}
          keyboardType="decimal-pad"
          placeholder="e.g. 1500"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
        />
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Weekly budget</Text>
        <TextInput
          value={weekly}
          onChangeText={setWeekly}
          keyboardType="decimal-pad"
          placeholder="e.g. 350"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
        />
        <TouchableOpacity
          onPress={saveBudget}
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.saveText, { color: colors.onPrimary }]}>Save budget</Text>
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
  section: {
    fontSize: 11.5,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 14,
    paddingHorizontal: 4,
  },
  group: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rowMiddle: { flex: 1 },
  rowLabel: {
    fontSize: 14.5,
    fontWeight: "600",
  },
  rowSub: {
    fontSize: 12,
    marginTop: 2,
  },
  currencyBadge: {
    fontSize: 18,
    fontWeight: "800",
  },
  timeBadge: {
    fontSize: 14,
    fontWeight: "800",
  },
  footer: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 28,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  stepsCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    gap: 10,
  },
  stepsTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  stepNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepNumText: {
    fontSize: 11,
    fontWeight: "800",
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 16,
    fontWeight: "600",
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
