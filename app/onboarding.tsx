import { setOnboardingComplete } from "@/lib/onboarding-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { useCallback, useRef, useState } from "react";
import type { ImageSourcePropType } from "react-native";
import {
  Image,
  ImageBackground,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/** Reused across slides so later screens always have a photo backdrop. */
const ONBOARDING_BG_SHIPPING = require("@/assets/images/background-image.jpg");
const ONBOARDING_BG_WAREHOUSE = require("@/assets/images/customer-login-fill.jpg");

type SlideSpec = {
  key: string;
  background: ImageSourcePropType;
  icon: ImageSourcePropType;
  iconDisplay: "card" | "logo";
  iconSize: number;
  title: string;
  subtitle: string;
};

const SLIDES: SlideSpec[] = [
  {
    key: "cross-border",
    background: ONBOARDING_BG_SHIPPING,
    icon: require("@/assets/images/cargo-icon.png"),
    iconDisplay: "card",
    iconSize: 112,
    title: "Cross-Border Shipping Made Simple",
    subtitle:
      "Manage the movement of goods from China to Ghana with one secure platform built for logistics operations.",
  },
  {
    key: "track",
    background: ONBOARDING_BG_WAREHOUSE,
    icon: require("@/assets/images/box-icon.png"),
    iconDisplay: "card",
    iconSize: 112,
    title: "Track Parcels, Containers & Deliveries",
    subtitle:
      "Monitor shipment progress, container activity, parcel handling, and delivery status in one organized workflow.",
  },
  {
    key: "warehouse",
    background: ONBOARDING_BG_SHIPPING,
    icon: require("@/assets/images/warehouse-icon.png"),
    iconDisplay: "card",
    iconSize: 96,
    title: "Warehouse & Customer Management",
    subtitle:
      "Manage warehouse-related operations and customer records under assigned partner accounts with better visibility and coordination.",
  },
  {
    key: "access",
    background: ONBOARDING_BG_WAREHOUSE,
    icon: require("@/assets/images/splash.png"),
    iconDisplay: "logo",
    iconSize: 100,
    title: "Access for Approved Users Only",
    subtitle:
      "Skyinventories is a restricted-access platform.\nAccounts are created by authorized administrators for approved partners and customers.",
  },
];

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const lastIndex = SLIDES.length - 1;

  const finish = useCallback(async () => {
    if (Platform.OS === "ios") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
    }
    await setOnboardingComplete();
    router.replace("/(auth)");
  }, []);

  const onSkip = useCallback(() => {
    void finish();
  }, [finish]);

  const goNext = useCallback(() => {
    if (index < lastIndex) {
      const next = index + 1;
      scrollRef.current?.scrollTo({ x: width * next, animated: true });
      setIndex(next);
    } else {
      void finish();
    }
  }, [index, lastIndex, width, finish]);

  const goBack = useCallback(() => {
    if (index > 0) {
      const prev = index - 1;
      scrollRef.current?.scrollTo({ x: width * prev, animated: true });
      setIndex(prev);
    }
  }, [index, width]);

  const onScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const i_ = Math.round(x / Math.max(width, 1));
      setIndex(Math.max(0, Math.min(lastIndex, i_)));
    },
    [width, lastIndex],
  );

  return (
    <>
      <StatusBar style="light" />
      <View style={styles.root}>
        <SafeAreaView edges={["top"]} style={styles.topSafe}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={goBack}
              hitSlop={12}
              disabled={index === 0}
              style={[styles.backBtn, { opacity: index === 0 ? 0 : 1 }]}
              pointerEvents={index === 0 ? "none" : "auto"}
              accessibilityState={{ disabled: index === 0 }}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </Pressable>
            <Pressable onPress={onSkip} hitSlop={12} style={styles.skipHit}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          </View>
        </SafeAreaView>

        <View style={styles.scrollHost}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onScrollEnd}
            bounces={false}
            decelerationRate="fast"
            keyboardShouldPersistTaps="handled"
            style={styles.hScroll}
            contentContainerStyle={styles.hScrollContent}>
            {SLIDES.map((slide) => (
              <View key={slide.key} style={{ width, flex: 1 }}>
                <ImageBackground
                  source={slide.background}
                  style={styles.slideFill}
                  resizeMode="cover">
                  <LinearGradient
                    colors={[
                      "rgba(26, 41, 59, 0.78)",
                      "rgba(26, 41, 59, 0.92)",
                      "#1A293B",
                    ]}
                    locations={[0, 0.45, 1]}
                    style={[StyleSheet.absoluteFill, styles.slideInnerPad]}>
                    <View
                      style={[
                        styles.iconTop,
                        slide.iconDisplay === "logo" && styles.iconTopLogo,
                      ]}>
                      {slide.iconDisplay === "logo" ? (
                        <Image
                          source={slide.icon}
                          style={styles.logoWide}
                          resizeMode="contain"
                        />
                      ) : (
                        <View style={styles.iconCard}>
                          <Image
                            source={slide.icon}
                            style={{
                              width: slide.iconSize,
                              height: slide.iconSize,
                            }}
                            resizeMode="contain"
                          />
                        </View>
                      )}
                    </View>
                    <View style={styles.textBlock}>
                      <Text style={styles.title}>{slide.title}</Text>
                      <Text style={styles.body}>{slide.subtitle}</Text>
                    </View>
                  </LinearGradient>
                </ImageBackground>
              </View>
            ))}
          </ScrollView>
        </View>

        <SafeAreaView edges={["bottom"]} style={styles.footerSafe}>
          <View style={styles.footerInner}>
            <View style={styles.dotsRow}>
              {SLIDES.map((s, i) => (
                <View
                  key={s.key}
                  style={[
                    styles.dot,
                    i === index ? styles.dotActive : styles.dotIdle,
                  ]}
                />
              ))}
            </View>
            <Pressable
              onPress={goNext}
              style={({ pressed }) => [
                styles.nextBtn,
                pressed && styles.nextBtnPressed,
              ]}
              android_ripple={{ color: "rgba(0,0,0,0.12)" }}>
              <Text style={styles.nextLabel}>
                {index === lastIndex ? "Get started" : "Next"}
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#1A293B",
  },
  topSafe: {
    flexShrink: 0,
    zIndex: 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  skipHit: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    fontWeight: "600",
  },
  scrollHost: {
    flex: 1,
    minHeight: 0,
    zIndex: 1,
  },
  hScroll: {
    flex: 1,
  },
  hScrollContent: {
    flexGrow: 1,
  },
  slideFill: {
    flex: 1,
  },
  slideInnerPad: {
    paddingHorizontal: 32,
    paddingTop: 16,
    paddingBottom: 24,
    justifyContent: "space-between",
  },
  iconTop: {
    alignItems: "center",
    marginTop: 12,
  },
  iconTopLogo: {
    marginTop: 20,
  },
  iconCard: {
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  logoWide: {
    width: 260,
    height: 100,
    maxWidth: "92%",
  },
  textBlock: {
    paddingBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 32,
  },
  body: {
    fontSize: 16,
    color: "rgba(255,255,255,0.82)",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 4,
  },
  footerSafe: {
    flexShrink: 0,
    backgroundColor: "#1A293B",
    zIndex: 10,
    elevation: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
    }),
  },
  footerInner: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 8,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 32,
    backgroundColor: "#fff",
  },
  dotIdle: {
    width: 8,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  nextBtn: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  nextBtnPressed: {
    opacity: 0.92,
  },
  nextLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A293B",
  },
});
