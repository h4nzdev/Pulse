import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  FadeIn,
  SlideInDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../contexts/ThemeContext";

interface AppModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

/** Bottom-sheet style modal. Swipe down on the header to dismiss. */
export default function AppModal({ visible, title, onClose, children }: AppModalProps) {
  const { colors } = useTheme();
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (visible) translateY.value = 0;
  }, [visible, translateY]);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      // follow the finger, downward only
      translateY.value = Math.max(e.translationY, 0);
    })
    .onEnd((e) => {
      if (e.translationY > 120 || e.velocityY > 800) {
        translateY.value = withTiming(700, { duration: 200 });
        runOnJS(onClose)();
      } else {
        translateY.value = withTiming(0, { duration: 180 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.flex}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.flex}
        >
          <Animated.View
            entering={FadeIn.duration(150)}
            style={[styles.backdrop, { backgroundColor: colors.overlay }]}
          >
            <Pressable style={styles.flex} onPress={onClose} />
            <Animated.View
              entering={SlideInDown.duration(280)}
              style={[styles.sheet, { backgroundColor: colors.surface }, sheetStyle]}
            >
              <GestureDetector gesture={pan}>
                <View>
                  <View style={[styles.handle, { backgroundColor: colors.border }]} />
                  <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                    <TouchableOpacity
                      onPress={onClose}
                      style={[styles.close, { backgroundColor: colors.surfaceAlt }]}
                    >
                      <Ionicons name="close" size={20} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              </GestureDetector>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {children}
              </ScrollView>
            </Animated.View>
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 30,
    maxHeight: "85%",
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    alignSelf: "center",
    marginTop: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  title: {
    fontSize: 19,
    fontWeight: "700",
  },
  close: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
});
