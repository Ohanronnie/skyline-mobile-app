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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

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
  const insets = useSafeAreaInsets();
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
      <StatusBar style="dark" />
      <View style={styles.root}>
        {/* Absolute Header for edge-to-edge look */}
        <View style={[styles.headerPosition, { top: insets.top + 8 }]}>
          <Pressable
            onPress={goBack}
            hitSlop={12}
            disabled={index === 0}
            style={[styles.backBtn, { opacity: index === 0 ? 0 : 1 }]}
            pointerEvents={index === 0 ? "none" : "auto"}>
            <Ionicons name="chevron-back" size={24} color="#1A293B" />
          </Pressable>
          <Pressable onPress={onSkip} hitSlop={12}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        <View style={styles.scrollHost}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onScrollEnd}
            bounces={false}
            decelerationRate="fast"
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
                      "rgba(248, 250, 252, 0.45)",
                      "rgba(248, 250, 252, 0.85)",
                      "#F8FAFC",
                    ]}
                    locations={[0, 0.4, 0.85]}

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

        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
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
              android_ripple={{ color: "rgba(0,0,0,0.08)" }}>
              <Text style={styles.nextLabel}>
                {index === lastIndex ? "Get started" : "Next"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  headerPosition: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  skipText: {
    color: "#64748B",
    fontSize: 16,
    fontWeight: "600",
  },
  scrollHost: {
    flex: 1,
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
    paddingTop: 100, // accommodate status bar
    paddingBottom: 24,
    justifyContent: "space-between",
  },
  iconTop: {
    alignItems: "center",
    marginTop: 20,
  },
  iconTopLogo: {
    marginTop: 40,
  },
  iconCard: {
    backgroundColor: "rgba(0, 101, 234, 0.06)",
    padding: 24,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: "rgba(0, 101, 234, 0.12)",
  },
  logoWide: {
    width: 260,
    height: 100,
    maxWidth: "92%",
  },
  textBlock: {
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 36,
  },
  body: {
    fontSize: 16,
    color: "#475569",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  footer: {
    backgroundColor: "#F8FAFC",
    paddingTop: 8,
  },
  footerInner: {
    paddingHorizontal: 24,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 32,
    backgroundColor: "#0065EA",
  },
  dotIdle: {
    width: 8,
    backgroundColor: "rgba(0, 0, 0, 0.08)",
  },
  nextBtn: {
    backgroundColor: "#0065EA",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0065EA",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  nextBtnPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
  nextLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
});



