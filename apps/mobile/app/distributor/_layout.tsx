import { Stack } from "expo-router";
import { colors } from "@/constants/theme";

export default function DistributorLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.black },
        animation: "slide_from_right",
      }}
    />
  );
}
