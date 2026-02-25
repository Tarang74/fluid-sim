import "./index.css";

import { useState } from "react";

import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import Loading from "../loader";
import { useAuth } from "../../contexts/Auth";

export default function Auth() {
  const { loading } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState<["success" | "error", string]>(() => [
    "success",
    "",
  ]);

  return (
    <main className="login-main">
      <section className="login-container">
        {mode === "login" ? (
          <LoginForm
            message={message}
            setMessage={setMessage}
            onSwitch={() => {
              setMode("signup");
            }}
          />
        ) : (
          <SignupForm
            message={message}
            setMessage={setMessage}
            onSwitch={() => {
              setMode("login");
            }}
          />
        )}
      </section>
      <Loading loading={loading} />
    </main>
  );
}
