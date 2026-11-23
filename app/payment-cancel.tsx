import CustomLoader from '@/components/CustomLoader';
import { Colors } from '@/constants/theme';
import { RootState } from '@/redux/store';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';

// Return point after a payment that left the app; goes to the user's orders
export default function PaymentCancel() {
    const router = useRouter();
    const { role: roleParam } = useLocalSearchParams<{ role?: string }>();
    const sessionRole = useSelector((state: RootState) => state.auth.userRole);
    const role = roleParam || sessionRole;

    useEffect(() => {
        if (role === 'customer') {
            router.replace('/customer/(tabs)/orders' as any);
        } else {
            router.replace('/guest/(tabs)/order' as any);
        }
    }, [role]);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.APP_BACKGROUND }}>
            <CustomLoader />
        </View>
    );
}
