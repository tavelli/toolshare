import React, {useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {useAuth} from "../../contexts/AuthContext";
import {supabase} from "../../lib/supabase";
import styles from "./Auth.module.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState("");

  const {signIn} = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const {error} = await signIn(email, password);
    if (error) {
      setError(error.message);
    } else {
      navigate("/dashboard");
    }
    setLoading(false);
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetSent(false);
    if (!resetEmail) {
      setResetError("Please enter your email.");
      return;
    }
    const {error} = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: window.location.origin + "/reset-password",
    });
    if (error) {
      setResetError(error.message);
    } else {
      setResetSent(true);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className="container">
        <div className={styles.authContainer}>
          <div className={styles.authCard}>
            <h1 className={styles.title}>Sign in to your account</h1>

            <form onSubmit={handleSubmit} className={styles.form}>
              {error && <div className={styles.error}>{error}</div>}
              <div className={styles.field}>
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
            <div style={{marginTop: 16}}>
              <details>
                <summary style={{cursor: "pointer", fontWeight: 500}}>
                  Forgot password?
                </summary>
                <form
                  onSubmit={handlePasswordReset}
                  style={{
                    marginTop: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    style={{
                      padding: 10,
                      borderRadius: 6,
                      border: "1px solid #ddd",
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      background: "#f96302",
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      padding: "10px 0",
                      fontWeight: 500,
                    }}
                  >
                    Send reset link
                  </button>
                  {resetError && (
                    <div className={styles.error}>{resetError}</div>
                  )}
                  {resetSent && (
                    <div style={{color: "#10B981", fontWeight: 500}}>
                      Reset link sent! Check your email.
                    </div>
                  )}
                </form>
              </details>
            </div>
            <p className={styles.switchAuth}>
              Don't have an account? <Link to="/register">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
