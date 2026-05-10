import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { colors } from "../theme/colors";

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
  count?: number;
  compact?: boolean;
}

export function Chip({ label, selected, onPress, color, count, compact }: Props) {
  const bg = selected ? color || colors.primary : colors.card;
  const fg = selected ? "#fff" : colors.text;
  const borderCol = selected ? bg : colors.border;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        compact ? styles.chipCompact : styles.chip,
        { backgroundColor: bg, borderColor: borderCol },
      ]}
      disabled={!onPress}
    >
      <Text
        style={[compact ? styles.textCompact : styles.text, { color: fg }]}
      >
        {label}
      </Text>
      {typeof count === "number" && (
        <View
          style={[
            compact ? styles.badgeCompact : styles.badge,
            {
              backgroundColor: selected
                ? "rgba(255,255,255,0.25)"
                : colors.secondary,
            },
          ]}
        >
          <Text
            style={[
              compact ? styles.badgeTextCompact : styles.badgeText,
              { color: fg },
            ]}
          >
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    marginEnd: 8,
    marginBottom: 8,
  },
  chipCompact: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginEnd: 6,
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
  },
  textCompact: {
    fontSize: 12,
    fontWeight: "600",
  },
  badge: {
    marginStart: 6,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeCompact: {
    marginStart: 5,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  badgeTextCompact: {
    fontSize: 10,
    fontWeight: "700",
  },
});
