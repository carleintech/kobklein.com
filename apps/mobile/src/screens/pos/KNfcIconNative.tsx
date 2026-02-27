import React, { useEffect, useRef } from "react";
import { Animated, Easing, ViewStyle } from "react-native";
import Svg, { Path, Circle, G } from "react-native-svg";

/**
 * KNfcIconNative — React Native SVG version of the K-NFC icon.
 *
 * K letterform (stem + upper arm + lower arm) with 3 concentric NFC arcs
 * radiating from the tip of the upper arm toward the upper-right.
 *
 * Animation is applied at the Animated.View wrapper level (scale + opacity).
 * The arcs use different opacities via direct SVG opacity attribute.
 */

type Props = {
  size?: number;
  active?: boolean;
  style?: ViewStyle;
};

export function KNfcIconNative({ size = 56, active = false, style }: Props) {
  const pulseScale   = useRef(new Animated.Value(1)).current;
  const arcWave      = useRef(new Animated.Value(0)).current; // 0→1 drives arc anim

  useEffect(() => {
    if (!active) {
      // Scale pulse for the whole icon
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseScale, {
            toValue: 1.10,
            duration: 950,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseScale, {
            toValue: 1,
            duration: 950,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Wave value: 0→1→0 loop for CSS-less arc timing
      Animated.loop(
        Animated.timing(arcWave, {
          toValue: 1,
          duration: 1600,
          easing: Easing.linear,
          useNativeDriver: false, // opacity on SVG requires false
        })
      ).start();
    } else {
      pulseScale.stopAnimation();
      pulseScale.setValue(1);
      arcWave.stopAnimation();
      arcWave.setValue(1);
    }
  }, [active]);

  // Active state colors
  const kColor   = active ? "#E2CA6E" : "#C9A84C";
  const arcColor = active ? "#16C784" : "#C9A84C";

  // SVG viewBox: 0 0 100 100
  // K letterform paths
  const stemPath     = "M 22 14 L 22 86";
  const upperArmPath = "M 22 50 L 73 14";
  const lowerArmPath = "M 29 55 L 73 86";

  // NFC arcs centered near (75, 17) — upper-right of K's arm tip
  // Each arc sweeps ~90° in the upper-right quadrant
  const arc1Path = "M 77.4 9.5 A 9 9 0 0 1 83.9 17.8";
  const arc2Path = "M 78.9 3.0 A 15 15 0 0 1 90.5 18.5";
  const arc3Path = "M 80.5 -2.5 A 21 21 0 0 1 97.0 19.5";

  // Arc opacities (inactive = sequential fade via arcWave)
  const arc1Opacity = arcWave.interpolate({
    inputRange:  [0, 0.2, 0.35, 0.6, 1],
    outputRange: [0.3, 1,  0.5,  0.3, 0.3],
  });
  const arc2Opacity = arcWave.interpolate({
    inputRange:  [0, 0.25, 0.45, 0.65, 1],
    outputRange: [0.2, 0.8,  1,   0.2, 0.2],
  });
  const arc3Opacity = arcWave.interpolate({
    inputRange:  [0, 0.35, 0.6, 0.8, 1],
    outputRange: [0.15, 0.5, 1,  0.15, 0.15],
  });

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          transform: [{ scale: active ? 1 : pulseScale }],
        },
        style,
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {/* Active green glow ring */}
        {active && (
          <Circle
            cx={50}
            cy={50}
            r={46}
            fill="none"
            stroke="#16C784"
            strokeWidth={2}
            opacity={0.3}
          />
        )}

        {/* K letterform */}
        <Path
          d={stemPath}
          stroke={kColor}
          strokeWidth={8}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d={upperArmPath}
          stroke={kColor}
          strokeWidth={6}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d={lowerArmPath}
          stroke={kColor}
          strokeWidth={6}
          strokeLinecap="round"
          fill="none"
        />

        {/* NFC Arc 1 (inner) */}
        <Path
          d={arc1Path}
          stroke={arcColor}
          strokeWidth={3.5}
          strokeLinecap="round"
          fill="none"
          opacity={active ? 0.9 : 0.6}
        />
        {/* NFC Arc 2 (middle) */}
        <Path
          d={arc2Path}
          stroke={arcColor}
          strokeWidth={3.5}
          strokeLinecap="round"
          fill="none"
          opacity={active ? 0.72 : 0.45}
        />
        {/* NFC Arc 3 (outer) */}
        <Path
          d={arc3Path}
          stroke={arcColor}
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
          opacity={active ? 0.5 : 0.3}
        />
      </Svg>
    </Animated.View>
  );
}
