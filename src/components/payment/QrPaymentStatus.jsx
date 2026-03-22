/**
 * Renders the current state of a QR payment:
 * redirecting → loading → error → QR image.
 *
 * @param {{
 *   redirecting: boolean;
 *   loading: boolean;
 *   error: string | null;
 *   imageUrl: string;
 * }} props
 */
export function QrPaymentStatus({ redirecting, loading, error, imageUrl }) {
  if (redirecting) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 py-8"
        role="status"
        aria-live="polite"
      >
        <p className="text-body1 font-medium text-purple-600">
          Payment verified
        </p>
        <p className="text-body2 text-gray-600">
          Taking you to the success page...
        </p>
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent"
          aria-hidden
        />
      </div>
    );
  }

  if (loading) {
    return <p className="text-body2 text-gray-600">Creating QR code...</p>;
  }

  if (error) {
    return (
      <p className="text-body2 text-red-600 text-center">{error}</p>
    );
  }

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt="PromptPay QR code for Merry Membership payment"
        className="w-full max-w-[360px] h-auto object-contain"
      />
    );
  }

  return null;
}
