import CustomTipContent from '@/components/CommonComponents/CustomTipContent';
import { Colors } from '@/constants/theme';

export default function CustomerCustomTip() {
    return (
        <CustomTipContent
            continueRoute="/customer/orders-details/my-orders"
            skipRoute="/customer/(tabs)/search"
            primaryColor={Colors.BRAND_PRIMARY_LIGHT}
        />
    );
}