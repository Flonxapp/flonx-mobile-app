import { PaymentIntent, useStripe } from '@stripe/stripe-react-native';

export type ServerPaymentResult =
    | { status: 'succeeded' | 'processing' }
    | { status: 'failed'; message: string };

// A saved card is charged on the server. The bank may still ask for 3D
// Secure, so the app checks the PaymentIntent, completes the authentication
// if needed, and reports the real outcome (never assume success).
export const useConfirmServerPayment = () => {
    const { retrievePaymentIntent, handleNextAction } = useStripe();

    return async (clientSecret: string): Promise<ServerPaymentResult> => {
        const retrieved = await retrievePaymentIntent(clientSecret);
        let paymentIntent = retrieved.paymentIntent;
        let error: { message?: string } | undefined = retrieved.error;

        if (!error && paymentIntent?.status === PaymentIntent.Status.RequiresAction) {
            const next = await handleNextAction(clientSecret, 'flonx://stripe-redirect');
            paymentIntent = next.paymentIntent;
            error = next.error;
        }

        if (error || !paymentIntent) {
            return {
                status: 'failed',
                message: error?.message || 'Payment could not be confirmed.',
            };
        }
        switch (paymentIntent.status) {
            case PaymentIntent.Status.Succeeded:
                return { status: 'succeeded' };
            case PaymentIntent.Status.Processing:
                return { status: 'processing' };
            default:
                return {
                    status: 'failed',
                    message: 'Your card was declined or needs a different payment method.',
                };
        }
    };
};
