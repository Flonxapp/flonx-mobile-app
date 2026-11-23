import * as Application from 'expo-application';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = 'guest_device_id';
// set when the server rejected the hardware id (its guest secret was lost,
// e.g. after a reinstall); from then on the stored random id is used
const USE_STORED_ID_KEY = 'guest_device_id_override';

const newRandomId = () =>
    `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

export const getDeviceId = async (): Promise<string> => {
    const useStored = await SecureStore.getItemAsync(USE_STORED_ID_KEY);
    if (Platform.OS === 'android' && useStored !== 'true') {
        const androidId = Application.getAndroidId();
        if (androidId) return androidId;
    }

    const stored = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (stored) return stored;

    const newId = newRandomId();
    await SecureStore.setItemAsync(DEVICE_ID_KEY, newId);
    return newId;
};

// Start a fresh guest identity on this device
export const resetDeviceId = async (): Promise<void> => {
    await SecureStore.setItemAsync(DEVICE_ID_KEY, newRandomId());
    await SecureStore.setItemAsync(USE_STORED_ID_KEY, 'true');
};
