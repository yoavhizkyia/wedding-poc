import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { colors } from "../theme/colors";

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
  count?: number;
}

export function Chip({ label, selected, onPress, color, count }: Props) {
  const bg = selected ? color || colors.primary : colors.card;
  const fg = selected ? "#fff" : colors.text;
  const borderCol = selected ? bg : colors.border;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.chip, { backgroundColor: bg, borderColor: borderCol }]}
      disabled={!onPress}
    >
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
      {typeof count === "number" && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: selected
                ? "rgba(255,255,255,0.25)"
                : colors.secondary,
            },
          ]}
        >
          <Text style={[styles.badgeText, { color: fg }]}>{count}</Text>
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
  text: {
    fontSize: 14,
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
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
});
