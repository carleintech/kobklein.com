import React from "react";
import { View, StyleSheet, type ViewStyle } from "react-native";
import { colors, radii, shadows } from "@/constants/theme";

interface CardProps {
  children: React.ReactNode;
  variant?: "default" | "gold" | "dark";
  style?: ViewStyle;
}

export default function Card({ children, variant = "default", style }: CardProps) {
  return (
    <View style={[styles.base, variantMap[variant], style]}>
      {children}
    </View>
  );
}

const variantMap: Record<string, ViewStyle> = {
  default: {
    backgroundColor: colors.panel,
    borderColor: colors.border,
  },
  gold: {
    backgroundColor: "rgba(198, 167, 86, 0.05)",
    borderColor: colors.borderGold,
  },
  dark: {
    backgroundColor: colors.navy,
    borderColor: colors.border,
  },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: 16,
    ...shadows.sm,
  },
});
