import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPadding =
    Platform.OS === "ios" ? 20 : Math.max(insets.bottom, 12);

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: bottomPadding }]}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const iconMap: Record<string, string> = {
            shipments: "cube",
            notification: "notifications",
            support: "help-circle",
            profile: "person",
          };

          const iconName = iconMap[route.name] || "cube";

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={styles.tabButton}
              android_ripple={{ color: "rgba(0,0,0,0.1)" }}>
              <View style={styles.tabContent}>
                <Ionicons
                  name={
                    isFocused
                      ? (iconName as any)
                      : (`${iconName}-outline` as any)
                  }
                  size={24}
                  color={isFocused ? "#1A293B" : "#999"}
                />
                {options.tabBarLabel &&
                  typeof options.tabBarLabel === "string" && (
                    <Text
                      style={[
                        styles.labelText,
                        { color: isFocused ? "#1A293B" : "#999" },
                      ]}>
                      {options.tabBarLabel}
                    </Text>
                  )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function CustomerTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen
        name="shipments"
        options={{
          title: "Shipments",
          tabBarLabel: "Shipments",
        }}
      />
      <Tabs.Screen
        name="notification"
        options={{
          title: "Notifications",
          tabBarLabel: "Notifications",
        }}
      />
      <Tabs.Screen
        name="support"
        options={{
          title: "Support",
          tabBarLabel: "Support",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarLabel: "Profile",
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    elevation: 0,
    shadowOpacity: 0,
  },
  tabBar: {
    flexDirection: "row",
    height: Platform.OS === "ios" ? 56 : 56,
    paddingTop: 6,
    paddingBottom: 0,
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 0,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    paddingVertical: 4,
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  labelText: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
});
