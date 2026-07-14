import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../contexts/ThemeContext";
import { formatMoney } from "../utils/format";

interface DayDatum {
  key: string;
  label: string;
  value: number;
}

const CHART_HEIGHT = 110;

function Bar({
  datum,
  max,
  index,
  selected,
  onPress,
}: {
  datum: DayDatum;
  max: number;
  index: number;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const h = useSharedValue(0);
  const target = max > 0 ? Math.max((datum.value / max) * CHART_HEIGHT, datum.value > 0 ? 6 : 3) : 3;

  useEffect(() => {
    h.value = withDelay(index * 60, withTiming(target, { duration: 450 }));
  }, [target, index, h]);

  const barStyle = useAnimatedStyle(() => ({ height: h.value }));

  return (
    <Pressable style={styles.barSlot} onPress={onPress}>
      <View style={styles.barArea}>
        <Animated.View
          style={[
            styles.bar,
            { backgroundColor: selected ? colors.chartBar : colors.chartBarFaded },
            barStyle,
          ]}
        />
      </View>
      <Text
        style={[
          styles.dayLabel,
          {
            color: selected ? colors.primary : colors.textMuted,
            fontWeight: selected ? "700" : "500",
          },
        ]}
      >
        {datum.label}
      </Text>
    </Pressable>
  );
}

/** Single-series 7-day spending chart (brand hue; selected bar is direct-labeled). */
export default function WeeklyBarChart({
  data,
  currency,
}: {
  data: DayDatum[];
  currency: string;
}) {
  const { colors } = useTheme();
  // today (last entry) selected by default
  const [selected, setSelected] = useState(data.length - 1);
  const sel = data[selected];

  return (
    <View>
      <View style={styles.tooltipRow}>
        <Text style={[styles.tooltipValue, { color: colors.text }]}>
          {formatMoney(sel?.value ?? 0, currency)}
        </Text>
        <Text style={[styles.tooltipLabel, { color: colors.textSecondary }]}>
          {selected === data.length - 1 ? "spent today" : `spent ${sel?.label}`}
        </Text>
      </View>
      <View style={styles.chartRow}>
        {data.map((d, i) => (
          <Bar
            key={d.key}
            datum={d}
            max={Math.max(...data.map((x) => x.value), 1)}
            index={i}
            selected={i === selected}
            onPress={() => setSelected(i)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tooltipRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 12,
  },
  tooltipValue: {
    fontSize: 22,
    fontWeight: "800",
  },
  tooltipLabel: {
    fontSize: 13,
  },
  chartRow: {
    flexDirection: "row",
    gap: 8,
  },
  barSlot: {
    flex: 1,
    alignItems: "center",
  },
  barArea: {
    height: CHART_HEIGHT,
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  bar: {
    width: "70%",
    maxWidth: 26,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  dayLabel: {
    fontSize: 11,
    marginTop: 6,
  },
});
