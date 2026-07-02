import Razorpay from "razorpay";

let razorpay: Razorpay | null = null;

export function getRazorpay(): Razorpay | null {
  // Only initialize if both keys are provided
  if (!razorpay) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Return null if keys are missing (fallback to developer mode)
    if (!keyId || !keySecret) {
      console.warn("⚠️  Razorpay keys not configured. Using developer simulator mode.");
      return null;
    }

    razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  return razorpay;
}

export default getRazorpay;
