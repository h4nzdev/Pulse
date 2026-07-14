import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeOut } from "react-native-reanimated";
import EmptyState from "../components/EmptyState";
import Header from "../components/Header";
import ProgressBar from "../components/ProgressBar";
import { useAlert } from "../contexts/AlertContext";
import { useApp } from "../contexts/AppContext";
import { useTheme } from "../contexts/ThemeContext";
import { formatMoney } from "../utils/format";

export default function Todos() {
  const { colors } = useTheme();
  const { todos, addTodo, toggleTodo, deleteTodo, profile } = useApp();
  const { showAlert } = useAlert();
  const [text, setText] = useState("");
  const [amount, setAmount] = useState("");

  const currency = profile?.currency ?? "$";
  const done = todos.filter((t) => t.done).length;
  const progress = todos.length > 0 ? done / todos.length : 0;

  const submit = () => {
    if (!text.trim()) return;
    addTodo(text.trim(), parseFloat(amount) || undefined);
    setText("");
    setAmount("");
  };

  const confirmDelete = (id: string, label: string) => {
    showAlert({
      title: "Delete todo?",
      message: `"${label}" will be removed.`,
      type: "warning",
      buttons: [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteTodo(id) },
      ],
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.flex, { backgroundColor: colors.bg }]}
    >
      <Header title="Todo Lists" subtitle="Money tasks to stay on top of" showBack />

      <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressTitle, { color: colors.text }]}>
            {todos.length === 0
              ? "No tasks yet"
              : done === todos.length
                ? "All done! 🎉"
                : `${done} of ${todos.length} done`}
          </Text>
          <Text style={[styles.progressPct, { color: colors.primary }]}>
            {Math.round(progress * 100)}%
          </Text>
        </View>
        <ProgressBar progress={progress} color={colors.primary} trackColor={colors.surfaceAlt} height={8} />
      </View>

      <FlatList
        data={todos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 50)} exiting={FadeOut}>
            <View
              style={[styles.todoRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <TouchableOpacity onPress={() => toggleTodo(item.id)} style={styles.checkTap}>
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: item.done ? colors.primary : colors.textMuted,
                      backgroundColor: item.done ? colors.primary : "transparent",
                    },
                  ]}
                >
                  {item.done && <Ionicons name="checkmark" size={14} color={colors.onPrimary} />}
                </View>
              </TouchableOpacity>
              <View style={styles.todoMiddle}>
                <Text
                  style={[
                    styles.todoText,
                    {
                      color: item.done ? colors.textMuted : colors.text,
                      textDecorationLine: item.done ? "line-through" : "none",
                    },
                  ]}
                >
                  {item.text}
                </Text>
                {!!item.amount && (
                  <View
                    style={[
                      styles.amountChip,
                      { backgroundColor: item.done ? `${colors.success}22` : colors.surfaceAlt },
                    ]}
                  >
                    <Ionicons
                      name={item.done ? "checkmark-circle" : "pricetag"}
                      size={11}
                      color={item.done ? colors.success : colors.primary}
                    />
                    <Text
                      style={{
                        color: item.done ? colors.success : colors.primary,
                        fontSize: 11.5,
                        fontWeight: "700",
                      }}
                    >
                      {formatMoney(item.amount, currency)}
                      {item.done ? " · logged as expense" : ""}
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => confirmDelete(item.id, item.text)} style={styles.deleteTap}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="checkbox-outline"
            title="Nothing on the list"
            message='Add tasks like "Pay electricity bill" below. Give a task an amount and checking it off will log it as an expense automatically.'
          />
        }
      />

      <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Add a task..."
          placeholderTextColor={colors.textMuted}
          onSubmitEditing={submit}
          returnKeyType="done"
          style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
        />
        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder={currency}
          placeholderTextColor={colors.textMuted}
          keyboardType="decimal-pad"
          onSubmitEditing={submit}
          returnKeyType="done"
          style={[styles.amountInput, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
        />
        <TouchableOpacity onPress={submit} style={[styles.addButton, { backgroundColor: colors.primary }]}>
          <Ionicons name="arrow-up" size={22} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  progressCard: {
    margin: 20,
    marginBottom: 6,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 14.5,
    fontWeight: "700",
  },
  progressPct: {
    fontSize: 14.5,
    fontWeight: "800",
  },
  list: {
    padding: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  todoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  checkTap: {
    padding: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  todoMiddle: {
    flex: 1,
    gap: 5,
  },
  todoText: {
    fontSize: 14.5,
    fontWeight: "500",
  },
  amountChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  deleteTap: {
    padding: 4,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    paddingBottom: 24,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14.5,
  },
  amountInput: {
    width: 84,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14.5,
    fontWeight: "600",
    textAlign: "center",
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
