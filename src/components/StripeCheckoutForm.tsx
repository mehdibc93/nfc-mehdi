import { useState } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import type { Stripe } from '@stripe/stripe-js';

function PayButton({
  label,
  onSuccess,
  onError,
}: {
  label: string;
  onSuccess: () => void;
  onError: (message: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    setSubmitting(true);
    const { error } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });
    setSubmitting(false);
    if (error) {
      onError(error.message ?? 'Le paiement a échoué.');
      return;
    }
    onSuccess();
  };

  return (
    <button
      type="button"
      onClick={handleSubmit}
      disabled={!stripe || submitting}
      className="mt-4 w-full rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-5 py-[1.125rem] text-sm font-bold text-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
    >
      {submitting ? 'Paiement en cours...' : label}
    </button>
  );
}

export function StripeCheckoutForm({
  stripePromise,
  clientSecret,
  payLabel,
  onSuccess,
  onError,
}: {
  stripePromise: Promise<Stripe | null>;
  clientSecret: string;
  payLabel: string;
  onSuccess: () => void;
  onError: (message: string) => void;
}) {
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentElement />
      <PayButton label={payLabel} onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
}
