import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import { colors, fonts, radii } from "@/constants/theme";
import * as Haptics from "expo-haptics";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  children: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

const variantStyles: Record<Variant, { bg: ViewStyle; text: TextStyle }> = {
  primary: {
    bg: { backgroundColor: colors.gold },
    text: { color: colors.black },
  },
  secondary: {
    bg: { backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.borderLight },
    text: { color: colors.textHeading },
  },
  outline: {
    bg: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.borderGold },
    text: { color: colors.gold },
  },
  ghost: {
    bg: { backgroundColor: "transparent" },
    text: { color: colors.gold },
  },
  danger: {
    bg: { backgroundColor: colors.danger },
    text: { color: colors.white },
  },
  success: {
    bg: { backgroundColor: colors.emerald },
    text: { color: colors.white },
  },
};

const sizeStyles: Record<Size, { container: ViewStyle; text: TextStyle }> = {
  sm: {
    container: { paddingVertical: 8, paddingHorizontal: 16 },
    text: { fontSize: 13 },
  },
  md: {
    container: { paddingVertical: 14, paddingHorizontal: 24 },
    text: { fontSize: 15 },
  },
  lg: {
    container: { paddingVertical: 18, paddingHorizontal: 32 },
    text: { fontSize: 17 },
  },
};

export default function Button({
  children,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  style,
}: ButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const isDisabled = disabled || loading;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        v.bg,
        s.container,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" ? colors.black : colors.gold}
        />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, v.text, s.text, icon ? { marginLeft: 8 } : undefined]}>
            {children}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.xl,
  },
  text: {
    fontFamily: fonts.sansSemiBold,
    textAlign: "center",
  },
  disabled: {
    opacity: 0.5,
  },
});
