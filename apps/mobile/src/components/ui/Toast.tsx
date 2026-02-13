import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { Animated, Text, StyleSheet, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, radii, shadows } from "@/constants/theme";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastMessage {
  id: number;
  text: string;
  type: ToastType;
}

interface ToastContextValue {
  show: (text: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const typeColors: Record<ToastType, ViewStyle> = {
  success: { backgroundColor: colors.emerald },
  error: { backgroundColor: colors.danger },
  warning: { backgroundColor: colors.warning },
  info: { backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.borderGold },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const counter = useRef(0);
  const insets = useSafeAreaInsets();

  const show = useCallback((text: string, type: ToastType = "info") => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, text, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toasts.map((toast, idx) => (
        <Animated.View
          key={toast.id}
          style={[
            styles.toast,
            typeColors[toast.type],
            shadows.md,
            { top: insets.top + 10 + idx * 60 },
          ]}
        >
          <Text style={styles.text}>{toast.text}</Text>
        </Animated.View>
      ))}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: 16,
    right: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: radii.lg,
    zIndex: 9999,
  },
  text: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.white,
    textAlign: "center",
  },
});
