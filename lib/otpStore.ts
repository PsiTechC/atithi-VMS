interface OTPData {
  otp: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
}

class OTPStore {
  private store: Map<string, OTPData>;

  constructor() {
    this.store = new Map();
  }

  // Generate 6-digit OTP
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Store OTP with 5-minute expiry
  setOTP(phoneNumber: string, otp: string): void {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    this.store.set(phoneNumber, {
      otp,
      expiresAt,
      attempts: 0,
      createdAt: new Date()
    });
  }

  // Verify OTP
  verifyOTP(phoneNumber: string, otp: string): { success: boolean; message: string } {
    const data = this.store.get(phoneNumber);

    if (!data) {
      return { success: false, message: "No OTP found. Please request a new one." };
    }

    if (new Date() > data.expiresAt) {
      this.store.delete(phoneNumber);
      return { success: false, message: "OTP expired. Please request a new one." };
    }

    if (data.attempts >= 3) {
      this.store.delete(phoneNumber);
      return { success: false, message: "Too many failed attempts. Please request a new OTP." };
    }

    if (data.otp !== otp) {
      data.attempts++;
      return { success: false, message: `Invalid OTP. ${3 - data.attempts} attempts remaining.` };
    }

    // Success - clear OTP
    this.store.delete(phoneNumber);
    return { success: true, message: "OTP verified successfully!" };
  }

  // Check if OTP was recently sent (rate limiting)
  canSendOTP(phoneNumber: string): { canSend: boolean; message: string } {
    const data = this.store.get(phoneNumber);

    if (!data) {
      return { canSend: true, message: "" };
    }

    const timeSinceCreated = Date.now() - data.createdAt.getTime();
    const waitTime = 60000; // 1 minute

    if (timeSinceCreated < waitTime) {
      const remainingSeconds = Math.ceil((waitTime - timeSinceCreated) / 1000);
      return {
        canSend: false,
        message: `Please wait ${remainingSeconds} seconds before requesting a new OTP.`
      };
    }

    return { canSend: true, message: "" };
  }

  // Cleanup expired OTPs (run periodically)
  cleanup(): void {
    const now = new Date();
    for (const [phone, data] of this.store.entries()) {
      if (now > data.expiresAt) {
        this.store.delete(phone);
      }
    }
  }
}

// Singleton instance
export const otpStore = new OTPStore();

// Cleanup every 5 minutes
setInterval(() => otpStore.cleanup(), 5 * 60 * 1000);
