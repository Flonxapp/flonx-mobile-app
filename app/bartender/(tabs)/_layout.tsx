import { AnimatedTabIcon } from '@/components/AnimatedTabIcon';
import { BrowseIcon, JobsIcon, ProfileIcon } from "@/assets/images/icons/icon";
import { Colors } from "@/constants/theme";
import { fp, hp } from "@/utils/responsive";
import { Tabs, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useRef } from "react";
import { BackHandler, Platform, Text } from "react-native";


const TAB_NAMES = ['browse', 'my-jobs', 'profile'];


export default function TabsLayout() {
    const router = useRouter();
    const tabHistory = useRef<string[]>(['browse']);

    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                if (tabHistory.current.length > 1) {
                    tabHistory.current.pop();
                    const prevTab = tabHistory.current[tabHistory.current.length - 1];
                    router.replace(`/bartender/(tabs)/${prevTab}` as any);
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
                    const target = e.target ?? '';
                    const tabName = TAB_NAMES.find(name => target.startsWith(name));
                    // console.log('tabName:', tabName);
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
                    height: Platform.OS === "ios" ? hp(90) : hp(100),
                    paddingBottom: Platform.OS === "ios" ? 20 : 10,
                    backgroundColor: Colors.INPUT_BACKGROUND,
                    borderTopWidth: 1,
                    borderTopColor: Colors.BORDER_COLOR,
                },
                tabBarLabelStyle: {
                    fontSize: fp(14),
                },
            }}
        >
            <Tabs.Screen
                name="browse"
                options={{
                    title: "Browse",
                    tabBarLabel: ({ focused, color }) => (
                        <Text style={{ color, fontSize: fp(11), fontWeight: focused ? "700" : "400" }}>
                            Browse
                        </Text>
                    ),
                    tabBarIcon: ({ focused }) => (
                        <AnimatedTabIcon focused={focused}>
                            <BrowseIcon />
                        </AnimatedTabIcon>
                    ),
                }}
            />

            <Tabs.Screen
                name="my-jobs"
                options={{
                    title: "My Jobs",
                    tabBarLabel: ({ focused, color }) => (
                        <Text style={{ color, fontSize: fp(11), fontWeight: focused ? "700" : "400" }}>
                            My Jobs
                        </Text>
                    ),
                    tabBarIcon: ({ focused }) => (
                        <AnimatedTabIcon focused={focused}>
                            <JobsIcon />
                        </AnimatedTabIcon>
                    ),
                }}
            />

            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarLabel: ({ focused, color }) => (
                        <Text style={{ color, fontSize: fp(11), fontWeight: focused ? "700" : "400" }}>
                            Profile
                        </Text>
                    ),
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