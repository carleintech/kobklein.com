import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fonts, radii } from "@/constants/theme";

type Variant = "default" | "success" | "warning" | "danger" | "gold" | "muted";

interface BadgeProps {
  children: string;
  variant?: Variant;
}

const badgeColors: Record<Variant, { bg: string; text: string }> = {
  default: { bg: colors.panel, text: colors.textBody },
  success: { bg: "rgba(31, 111, 74, 0.15)", text: colors.emerald },
  warning: { bg: "rgba(245, 158, 11, 0.15)", text: colors.warning },
  danger: { bg: "rgba(220, 38, 38, 0.15)", text: colors.danger },
  gold: { bg: "rgba(198, 167, 86, 0.12)", text: colors.gold },
  muted: { bg: "rgba(122, 131, 148, 0.12)", text: colors.textMuted },
};

export default function Badge({ children, variant = "default" }: BadgeProps) {
  const c = badgeColors[variant];

  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.text }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    alignSelf: "flex-start",
  },
  text: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
