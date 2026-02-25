import { useState, useCallback, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { setupMfaRequest, verifyMfaRequest } from "../api/auth";
import { useAuth } from "../contexts/Auth";
import "./Mfa.css";

export default function MfaSetup({
  onClose,
  onSuccess,
  onError,
}: {
  onClose: () => void;
  onSuccess: () => Promise<void>;
  onError: (error: string) => void;
}) {
  const { user } = useAuth();
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaSecret, setMfaSecret] = useState("");
  const [mfaQrCodeImage, setMfaQrCodeImage] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const mfaRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (mfaRef.current) {
      mfaRef.current.focus();
    }
    return () => {
      mfaRef.current = null;
    };
  }, []);

  const handleMfaSetup = useCallback(async () => {
    if (!user) return;

    setMfaLoading(true);
    try {
      const response = await setupMfaRequest(user.username);

      if (!response.secretCode || !response.qrCodeUrl) {
        throw new Error("Invalid response from MFA setup API");
      }

      setMfaSecret(response.secretCode);

      // Generate QR code image from URL
      try {
        const qrCodeImageData = await QRCode.toDataURL(response.qrCodeUrl, {
          width: 250,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });
        setMfaQrCodeImage(qrCodeImageData);
      } catch (qrError: unknown) {
        console.error("Failed to generate QR code image:", qrError);
        setMfaQrCodeImage("");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      onError(`Failed to setup MFA: ${errorMessage}`);
    } finally {
      setMfaLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleMfaVerification = async () => {
    if (!user || mfaCode.length !== 6) return;

    setMfaLoading(true);
    try {
      // MFA setup verification
      const setupResponse = await verifyMfaRequest(user.username, mfaCode);

      if (setupResponse.success) {
        setMfaCode("");
        setMfaSecret("");
        setMfaQrCodeImage("");
        await onSuccess();
      } else {
        onError("Invalid MFA code. Please try again.");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      onError(errorMessage);
    } finally {
      setMfaLoading(false);
    }
  };

  const handleClose = () => {
    setMfaCode("");
    onClose();
  };

  useEffect(() => {
    if (user?.username) {
      void handleMfaSetup();
    }
  }, [user?.username, handleMfaSetup]);

  return (
    <div
      className="mfa-popup-overlay"
      onClick={() => {
        handleClose();
      }}
    >
      <div
        className="mfa-popup-modal"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="mfa-popup-header">
          <h3>Setup Two-Factor Authentication</h3>
          <button
            type="button"
            className="mfa-popup-close"
            onClick={() => {
              handleClose();
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="mfa-popup-content">
          <div className="mfa-qr-section">
            <p>Scan this QR code with your authenticator app:</p>
            <div className="mfa-qr-code">
              {mfaQrCodeImage ? (
                <img src={mfaQrCodeImage} alt="MFA QR Code" />
              ) : (
                <div className="mfa-qr-placeholder">
                  <p>Generating QR code...</p>
                </div>
              )}
            </div>
            <div className="mfa-secret">
              <label>Or enter this secret manually:</label>
              <input
                type="text"
                value={mfaSecret}
                readOnly
                className="mfa-secret-input"
              />
            </div>
          </div>

          <form
            className="mfa-verify-section"
            method="POST"
            onSubmit={(e) => {
              e.preventDefault();

              void handleMfaVerification();
            }}
          >
            <label htmlFor="mfa-code">
              Enter the 6-digit code from your authenticator:
            </label>
            <input
              ref={mfaRef}
              type="text"
              id="mfa-code"
              value={mfaCode}
              onChange={(e) => {
                setMfaCode(e.target.value.replace(/\D/g, ""));
              }}
              maxLength={6}
              className="mfa-code-input"
            />
            <div className="mfa-setup-buttons">
              <button
                type="submit"
                disabled={mfaLoading || mfaCode.length !== 6}
                className="mfa-verify-btn"
              >
                {mfaLoading ? "Verifying..." : "Verify"}
              </button>
              <button
                type="button"
                onClick={() => {
                  handleClose();
                }}
                className="mfa-cancel-btn"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
