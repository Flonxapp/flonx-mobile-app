import { WarningIcon } from "@/assets/images/icons/ProfileInfoIcons/WarningIcon";
import { ConfirmationModal } from "@/components/ConfirmationModalProps";
import CustomLoader from "@/components/CustomLoader";
import { Colors } from "@/constants/theme";
import { logout } from '@/redux/authSlice';
import { baseApis } from '@/redux/base';
import { useLogoutUserMutation } from '@/redux/services/authApi';
import { clearSession } from '@/utils/session';
import { OneSignal } from 'react-native-onesignal';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch } from 'react-redux';

interface LogoutScreenProps {
    redirectRoute?: string;
}

export default function LogoutScreen({ redirectRoute = '/select-role' }: LogoutScreenProps) {
    const router = useRouter();
    const dispatch = useDispatch();
    const [showModal, setShowModal] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(false);
    const [logoutUser] = useLogoutUserMutation();

    const handleLogout = (): void => {
        setShowModal(false);
        setTimeout(async () => {
            setLoading(true);
            try {
                // stop push notifications to this phone for this account
                const playerId = await OneSignal.User.pushSubscription
                    .getIdAsync()
                    .catch(() => null);
                await logoutUser({ playerId }).unwrap().catch(() => undefined);
            } finally {
                await clearSession();
                dispatch(logout());
                dispatch(baseApis.util.resetApiState());
                setLoading(false);
                router.replace('/(auth)/login');
            }
        }, 300);
    };

    const handleCancel = (): void => {
        setShowModal(false);
        setTimeout(() => router.back(), 300);
    };

    return (
        <SafeAreaView style={styles.container}>
            {loading && (
                <View style={styles.loaderOverlay}>
                    <CustomLoader size={40} />
                </View>
            )}
            <ConfirmationModal
                visible={showModal}
                title="Log out?"
                description="Are you sure you want to log out?"
                confirmText="Log Out"
                icon={<WarningIcon size={28} />}
                onCancel={handleCancel}
                onConfirm={handleLogout}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.APP_BACKGROUND,
    },
    loaderOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});