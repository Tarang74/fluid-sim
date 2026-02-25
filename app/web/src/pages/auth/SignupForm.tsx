import "./index.css";

import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import validator from "validator";
import { confirmSignupRequest, signupRequest } from "../../api/auth";

export default function SignupForm({
  onSwitch,
  message,
  setMessage,
}: {
  onSwitch: () => void;
  message: ["success" | "error", string];
  setMessage: Dispatch<SetStateAction<["success" | "error", string]>>;
}) {
  const [signupConfirmation, setSignupConfirmation] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState("");
  const confirmationCodeInputs = useRef<(HTMLInputElement | null)[]>([]);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");

  async function handleSignup() {
    if (!validator.isEmail(email)) {
      setMessage(["error", "Invalid email provided."]);
      return;
    }
    if (password !== repeatPassword) {
      setMessage(["error", "Passwords do not match."]);
      return;
    }
    if (password.length < 8) {
      setMessage(["error", "Password must be at least 8 characters long."]);
      return;
    }

    setMessage(["success", ""]);

    try {
      await signupRequest(username, email, password);
      setSignupConfirmation(true);
    } catch (err: unknown) {
      setMessage(["error", String(err)]);
    }
  }

  async function handleConfirmSignup() {
    if (confirmationCode.length !== 6) {
      setMessage(["error", "Invalid confirmation code provided."]);
      return;
    }

    setMessage(["success", ""]);

    try {
      await confirmSignupRequest(username, confirmationCode);
      setMessage(["success", `User ${username} successfully registered.`]);
      onSwitch();
    } catch (err: unknown) {
      setMessage(["error", String(err)]);
    }
  }

  return signupConfirmation ? (
    <>
      <h3 className="login-title">Enter your Confirmation Code</h3>
      <form
        className="login-form"
        method="POST"
        onSubmit={(e) => {
          e.preventDefault();
          void handleConfirmSignup();
        }}
      >
        <div className="confirmation-code-container">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <input
              key={index}
              ref={(el) => {
                confirmationCodeInputs.current[index] = el;
              }}
              className="confirmation-code-input"
              type="text"
              maxLength={1}
              value={confirmationCode[index] || ""}
              onPaste={(e) => {
                e.preventDefault();

                const digits = (e.clipboardData.getData("text") || "").replace(
                  /\D/g,
                  "",
                );
                if (!digits) return;

                const newCode = confirmationCode.split("");
                while (newCode.length < 6) newCode.push("");

                const toWrite = digits.slice(0, 6 - index);
                for (let k = 0; k < toWrite.length; k++) {
                  newCode[index + k] = toWrite[k];
                }
                setConfirmationCode(newCode.join(""));

                const next = Math.min(index + toWrite.length, 5);
                confirmationCodeInputs.current[next]?.focus();
              }}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 1 && /^\d*$/.test(value)) {
                  const newCode = confirmationCode.split("");
                  newCode[index] = value;
                  setConfirmationCode(newCode.join(""));

                  // Auto-focus next input
                  if (value && index < 5) {
                    confirmationCodeInputs.current[index + 1]?.focus();
                  }
                }
              }}
              onKeyDown={(e) => {
                // Handle backspace
                if (
                  e.key === "Backspace" &&
                  !confirmationCode[index] &&
                  index > 0
                ) {
                  confirmationCodeInputs.current[index - 1]?.focus();
                }
              }}
              required
            />
          ))}
        </div>
        <div className="messages">
          <div className={`left ${message[0]}`}>{message[1]}</div>
          <div className="right"></div>
        </div>
        <button type="submit">Confirm Account</button>
      </form>
    </>
  ) : (
    <>
      <h2 className="login-title">Create an Account</h2>
      <form
        className="login-form"
        method="POST"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSignup();
        }}
      >
        <input
          name="username"
          type="text"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
          }}
          required
          placeholder="Username"
        />
        <input
          name="email"
          type="text"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
          }}
          required
          placeholder="Email"
        />
        <input
          name="password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
          }}
          required
          placeholder="Password"
        />
        <input
          name="repeatPassword"
          type="password"
          value={repeatPassword}
          onChange={(e) => {
            setRepeatPassword(e.target.value);
          }}
          required
          placeholder="Repeat Password"
        />
        <div className="messages">
          <div className={`left ${message[0]}`}>{message[1]}</div>
          <div className="right"></div>
        </div>
        <button type="submit">Continue</button>
        <div className="login-switch">
          Already have an account?{" "}
          <span onClick={onSwitch} tabIndex={0}>
            Login.
          </span>
        </div>
      </form>
    </>
  );
}
