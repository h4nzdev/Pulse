import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import Header from "../components/Header";
import { useApp } from "../contexts/AppContext";
import { useTheme } from "../contexts/ThemeContext";
import { BotContext, SUGGESTIONS, botReply, buildContextSummary } from "../utils/chatbot";
import { uid } from "../utils/format";
import { askGemini } from "../utils/gemini";

interface Message {
  id: string;
  from: "user" | "bot";
  text: string;
}

export default function Chatbot() {
  const { colors } = useTheme();
  const app = useApp();
  const listRef = useRef<FlatList<Message>>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      from: "bot",
      text: `Hi ${app.profile?.name ?? "there"}! 🤖 I'm Penny, your expense assistant. Ask me anything about your spending, budget, todos, or plans.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const geminiEnabled = !!app.settings.geminiApiKey.trim();

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || typing) return;
    const userMsg: Message = { id: uid(), from: "user", text: trimmed };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setTyping(true);

    const ctx: BotContext = {
      profile: app.profile,
      expenses: app.expenses,
      todos: app.todos,
      planned: app.planned,
      monthTotal: app.monthTotal,
      weekTotal: app.weekTotal,
      todayTotal: app.todayTotal,
      categoryTotals: app.categoryTotals,
    };

    let reply: string;
    if (geminiEnabled) {
      try {
        reply = await askGemini(
          app.settings.geminiApiKey.trim(),
          buildContextSummary(ctx),
          history.filter((m) => m.id !== "welcome").slice(-10)
        );
      } catch {
        // key invalid / offline — quietly fall back to the built-in assistant
        reply = `${botReply(trimmed, ctx)}\n\n(Gemini couldn't be reached, so I answered with the built-in assistant.)`;
      }
    } else {
      // small delay so the reply feels conversational
      await new Promise((r) => setTimeout(r, 600));
      reply = botReply(trimmed, ctx);
    }

    setMessages((prev) => [...prev, { id: uid(), from: "bot", text: reply }]);
    setTyping(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.flex, { backgroundColor: colors.bg }]}
    >
      <Header
        title="Penny · AI Chatbot"
        subtitle={geminiEnabled ? "Powered by Gemini ✨" : "Built-in assistant · add a Gemini key in Settings"}
        showBack
      />

      <FlatList
        ref={listRef}
        data={typing ? [...messages, { id: "typing", from: "bot" as const, text: "…" }] : messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const isUser = item.from === "user";
          return (
            <Animated.View
              entering={isUser ? FadeInDown.duration(250) : FadeInUp.duration(250)}
              style={[styles.bubbleRow, isUser && styles.bubbleRowUser]}
            >
              {!isUser && (
                <View style={[styles.botAvatar, { backgroundColor: colors.primary }]}>
                  <Ionicons name="sparkles" size={14} color="#FFFFFF" />
                </View>
              )}
              <View
                style={[
                  styles.bubble,
                  isUser
                    ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
                    : {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        borderWidth: 1,
                        borderBottomLeftRadius: 4,
                      },
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    { color: isUser ? colors.onPrimary : colors.text },
                  ]}
                >
                  {item.text}
                </Text>
              </View>
            </Animated.View>
          );
        }}
      />

      {/* Suggestion chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        style={styles.chipsWrap}
      >
        {SUGGESTIONS.map((s) => (
          <Pressable
            key={s}
            onPress={() => send(s)}
            style={[styles.chip, { backgroundColor: colors.primarySoft }]}
          >
            <Text style={[styles.chipText, { color: colors.primary }]}>{s}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask Penny anything..."
          placeholderTextColor={colors.textMuted}
          onSubmitEditing={() => send(input)}
          returnKeyType="send"
          style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
        />
        <TouchableOpacity
          onPress={() => send(input)}
          style={[styles.sendButton, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="send" size={18} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: {
    padding: 20,
    paddingBottom: 10,
    gap: 10,
  },
  bubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    maxWidth: "88%",
  },
  bubbleRowUser: {
    alignSelf: "flex-end",
    justifyContent: "flex-end",
  },
  botAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexShrink: 1,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  chipsWrap: {
    maxHeight: 46,
  },
  chips: {
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 16,
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: "600",
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
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
