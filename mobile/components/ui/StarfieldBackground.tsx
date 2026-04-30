import React, { useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { appTheme } from "@/theme/appTheme";

/** 100+ stars with varied motion so twinkles feel organic */
const STAR_COUNT = 130;

type StarSpec = {
  id: number;
  topPct: number;
  leftPct: number;
  size: number;
  duration: number;
  delay: number;
  minOpacity: number;
  maxOpacity: number;
};

function buildStars(): StarSpec[] {
  const stars: StarSpec[] = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      id: i,
      topPct: Math.random() * 100,
      leftPct: Math.random() * 100,
      size: 0.75 + Math.random() * 3,
      duration: 1600 + Math.random() * 5600,
      delay: Math.random() * 7000,
      minOpacity: 0.1 + Math.random() * 0.42,
      maxOpacity: 0.42 + Math.random() * 0.58,
    });
  }
  return stars;
}

function TwinklingStar({ spec }: { spec: StarSpec }) {
  const opacity = useRef(new Animated.Value(spec.minOpacity)).current;
  const animRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    const half = spec.duration / 2;
    const startTimer = setTimeout(() => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: spec.maxOpacity,
            duration: half,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: spec.minOpacity,
            duration: half,
            useNativeDriver: true,
          }),
        ])
      );
      animRef.current = loop;
      loop.start();
    }, spec.delay);

    return () => {
      clearTimeout(startTimer);
      animRef.current?.stop?.();
      animRef.current = null;
    };
  }, [opacity, spec.delay, spec.duration, spec.maxOpacity, spec.minOpacity]);

  const r = spec.size / 2;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.star,
        {
          top: `${spec.topPct}%`,
          left: `${spec.leftPct}%`,
          width: spec.size,
          height: spec.size,
          marginLeft: -r,
          marginTop: -r,
          borderRadius: r,
          opacity,
        },
      ]}
    />
  );
}

/**
 * Full-screen starfield behind app chrome. Does not receive touches (`pointerEvents="none"`).
 */
export function StarfieldBackground() {
  const specs = useMemo(() => buildStars(), []);

  return (
    <View style={styles.layer} pointerEvents="none" collapsable={false}>
      {specs.map((spec) => (
        <TwinklingStar key={spec.id} spec={spec} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: appTheme.colors.background,
    zIndex: 0,
  },
  star: {
    position: "absolute",
    backgroundColor: "#ffffff",
  },
});
