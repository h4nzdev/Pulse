import { Ionicons } from "@expo/vector-icons";
import React, { createContext, useContext, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useTheme } from "./ThemeContext";

export type AlertType = "success" | "error" | "warning" | "info";

interface AlertButton {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
}

interface AlertOptions {
  title: string;
  message?: string;
  type?: AlertType;
  buttons?: AlertButton[];
}

const AlertContext = createContext<{ showAlert: (opts: AlertOptions) => void }>({
  showAlert: () => {},
});

const ICONS: Record<AlertType, { name: keyof typeof Ionicons.glyphMap }> = {
  success: { name: "checkmark-circle" },
  error: { name: "close-circle" },
  warning: { name: "warning" },
  info: { name: "information-circle" },
};

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const [alert, setAlert] = useState<AlertOptions | null>(null);

  const showAlert = (opts: AlertOptions) => setAlert(opts);
  const close = () => setAlert(null);

  const type = alert?.type ?? "info";
  const iconColor =
    type === "success"
      ? colors.success
      : type === "error"
        ? colors.danger
        : type === "warning"
          ? colors.warning
          : colors.primary;

  const buttons = alert?.buttons?.length
    ? alert.buttons
    : [{ text: "OK", style: "default" as const }];

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <Modal visible={!!alert} transparent animationType="none" onRequestClose={close}>
        {alert && (
          <Animated.View
            entering={FadeIn.duration(150)}
            style={[styles.backdrop, { backgroundColor: colors.overlay }]}
          >
            <Animated.View
              entering={FadeIn.duration(180)}
              style={[styles.card, { backgroundColor: colors.surface }]}
            >
              <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name={ICONS[type].name} size={40} color={iconColor} />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>{alert.title}</Text>
              {!!alert.message && (
                <Text style={[styles.message, { color: colors.textSecondary }]}>
                  {alert.message}
                </Text>
              )}
              <View style={styles.buttonRow}>
                {buttons.map((b, i) => {
                  const isCancel = b.style === "cancel";
                  const isDestructive = b.style === "destructive";
                  return (
                    <Pressable
                      key={i}
                      onPress={() => {
                        close();
                        b.onPress?.();
                      }}
                      style={[
                        styles.button,
                        {
                          backgroundColor: isCancel
                            ? colors.surfaceAlt
                            : isDestructive
                              ? colors.danger
                              : colors.primary,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.buttonText,
                          { color: isCancel ? colors.text : colors.onPrimary },
                        ]}
                      >
                        {b.text}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>
          </Animated.View>
        )}
      </Modal>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  return useContext(AlertContext);
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 19,
    fontWeight: "700",
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 6,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
    alignSelf: "stretch",
  },
  button: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
