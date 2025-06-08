// Simple password fallback
export const biometricPrompt = async () => {
  if (window.PublicKeyCredential) {
    // Here, you would implement WebAuthn for a real fingerprint prompt
    // For demo, we'll fallback to a prompt
    // TODO: Implement WebAuthn (complex; needs backend for registration/challenge)
    // Fallback:
    return window.confirm("Authenticate to unlock this chat.");
  }
  // Fallback
  return window.confirm("Authenticate to unlock this chat.");
};