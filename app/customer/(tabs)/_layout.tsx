import { AnimatedTabIcon } from '@/components/AnimatedTabIcon';
import { GigIcon, HomeIcon, OrderTabIcon, ProfileIcon, SearchBarIcon } from "@/assets/images/icons/icon";
import { Colors } from "@/constants/theme";
import { Tabs, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useRef } from "react";
import { BackHandler, Platform } from "react-native";

export default function TabsLayout() {
    const router = useRouter();
    const tabHistory = useRef<string[]>(['home']);

    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                if (tabHistory.current.length > 1) {
                    tabHistory.current.pop();
                    const prevTab = tabHistory.current[tabHistory.current.length - 1];
                    router.replace(`/customer/(tabs)/${prevTab}` as any);
                    return true;
                }
                return false;
            };

            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => subscription.remove();
        }, [])
    );

    return (
        <Tabs
            screenListeners={{
                tabPress: (e) => {
                    const tabName = e.target?.split('-')[0];
                    if (tabName && tabHistory.current[tabHistory.current.length - 1] !== tabName) {
                        tabHistory.current.push(tabName);
                    }
                },
            }}
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: Colors.BRAND_PRIMARY,
                tabBarInactiveTintColor: Colors.NEUTRAL0,
                tabBarStyle: {
                    height: Platform.OS === "ios" ? 90 : "12%",
                    paddingBottom: Platform.OS === "ios" ? 20 : 10,
                    backgroundColor: Colors.INPUT_BACKGROUND,
                    borderTopWidth: 1,
                    borderTopColor: Colors.BORDER_COLOR,
                },
                tabBarLabelStyle: {
                    fontSize: 14,
                },
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: "Home",
                    tabBarLabel: "Home",
                    tabBarIcon: ({ focused }) => (
                        <AnimatedTabIcon focused={focused}>
                            <HomeIcon />
                        </AnimatedTabIcon>
                    ),
                }}
            />

            <Tabs.Screen
                name="search"
                options={{
                    title: "Search",
                    tabBarLabel: "Search",
                    tabBarIcon: ({ focused }) => (
                        <AnimatedTabIcon focused={focused}>
                            <SearchBarIcon />
                        </AnimatedTabIcon>
                    ),
                }}
            />

            <Tabs.Screen
                name="orders"
                options={{
                    title: "Orders",
                    tabBarLabel: "Orders",
                    tabBarIcon: ({ focused }) => (
                        <AnimatedTabIcon focused={focused}>
                            <OrderTabIcon />
                        </AnimatedTabIcon>
                    ),
                }}
            />

            <Tabs.Screen
                name="gigs"
                options={{
                    title: "Gigs",
                    tabBarLabel: "Gigs",
                    tabBarIcon: ({ focused }) => (
                        <AnimatedTabIcon focused={focused}>
                            <GigIcon />
                        </AnimatedTabIcon>
                    ),
                }}
            />

            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarLabel: "Profile",
                    tabBarIcon: ({ focused }) => (
                        <AnimatedTabIcon focused={focused}>
                            <ProfileIcon />
                        </AnimatedTabIcon>
                    ),
                }}
            />
        </Tabs>
    );
}