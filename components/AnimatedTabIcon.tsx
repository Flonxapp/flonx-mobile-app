import { Colors } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import Animated, {
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

// Tab bar icon that lifts and gets a gradient when its tab is active.
// A real component, so its hooks follow the rules of hooks (they used to
// run inside the tabBarIcon callback).
export const AnimatedTabIcon = ({
    focused,
    children,
}: {
    focused: boolean;
    children: React.ReactNode;
}) => {
    const progress = useSharedValue(focused ? 1 : 0);
    useDerivedValue(() => {
        progress.value = withTiming(focused ? 1 : 0, { duration: 250 });
    });
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: -10 * progress.value }],
        borderRadius: 25,
        padding: 12,
    }));

    return (
        <Animated.View style={animatedStyle}>
            {focused ? (
                <LinearGradient
                    colors={[Colors.BRAND_PRIMARY, Colors.BRAND_PRIMARY_LIGHT]}
                    start={{ x: -0.5, y: 1 }}
                    end={{ x: 1, y: -0.5 }}
                    style={{ borderRadius: 25, padding: 12 }}
                >
                    {children}
                </LinearGradient>
            ) : (
                children
            )}
        </Animated.View>
    );
};
