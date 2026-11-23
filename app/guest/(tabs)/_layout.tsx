import { AnimatedTabIcon } from '@/components/AnimatedTabIcon';
import { OrderTabIcon, SearchBarIcon } from "@/assets/images/icons/icon";
import { Colors } from "@/constants/theme";
import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

export default function TabsLayout() {
    return (
        <Tabs
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
                    fontSize: 11,
                    fontWeight:"600"
                },
            }}
        >
            <Tabs.Screen
                name="search"
                options={{
                    title: "Search",
                    tabBarLabelStyle: { fontWeight: '800', fontSize: 11 },
                    tabBarLabel: "Search",
                    tabBarIcon: ({ focused }) => (
                        <AnimatedTabIcon focused={focused}>
                            <SearchBarIcon />
                        </AnimatedTabIcon>
                    ),
                }}
            />

            <Tabs.Screen
                name="order"
                options={{
                    title: "Order",
                    tabBarLabelStyle: { fontWeight: '800', fontSize: 11 },
                    tabBarLabel: "Order",
                    tabBarIcon: ({ focused }) => (
                        <AnimatedTabIcon focused={focused}>
                            <OrderTabIcon />
                        </AnimatedTabIcon>
                    ),
                }}
            />
        </Tabs>
    );
}