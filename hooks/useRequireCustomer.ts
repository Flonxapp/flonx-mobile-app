import { setCredentials } from '@/redux/authSlice';
import { RootState } from '@/redux/store';
import { getStoredSession } from '@/utils/session';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

// Screens that need a logged-in customer. Guests also carry a "customer"
// token, so the stored session role decides, not the token.
export const useRequireCustomer = () => {
    const router = useRouter();
    const dispatch = useDispatch();
    const role = useSelector((state: RootState) => state.auth.userRole);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        const verify = async () => {
            if (role === 'customer') {
                setChecked(true);
                return;
            }

            const saved = await getStoredSession();
            if (saved.role === 'customer' && saved.accessToken) {
                dispatch(setCredentials({ role: 'customer', token: saved.accessToken }));
                setChecked(true);
                return;
            }

            router.replace('/(auth)/login' as any);
        };

        verify();
    }, [role]);

    return checked;
};
