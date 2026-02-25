import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { verifyMfaChallengeRequest } from "../api/auth";
import { useAuth } from "../contexts/Auth";
import "./Mfa.css";
import { useNavigate } from "react-router-dom";
import type { User } from "@tarang-and-tina/shared/dist/domain";

export default function MfaVerify({
  pendingUser,
  session,
  setMfaVisible,
  onError,
}: {
  pendingUser: User;
  session: string;
  setMfaVisible: Dispatch<SetStateAction<boolean>>;
  onError: (error: string) => void;
}) {
  const { setAuthenticated, setUser } = useAuth();
  const [mfaLoading, setMfaLoading] = useState(false);
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

  const navigate = useNavigate();

  const handleMfaVerification = async () => {
    if (mfaCode.length !== 6) return;

    setMfaLoading(true);
    try {
      await verifyMfaChallengeRequest(pendingUser.username, mfaCode, session);
      setAuthenticated(true);
      setUser(pendingUser);
      await navigate("/app");
    } catch (err: unknown) {
      onError(String(err));
    } finally {
      setMfaLoading(false);
    }
  };

  const handleClose = () => {
    setMfaCode("");
    setMfaVisible(false);
  };

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
          <h3>Two-Factor Authentication</h3>
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
