"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError(
        "Enter your admin email and password."
      );
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post(
        "/auth/login",
        {
          email: email.trim(),
          password,
        }
      );

      if (data.data.user.role !== "ADMIN") {
        setError(
          "This account does not have admin access."
        );
        return;
      }

      document.cookie =
        `adminToken=${data.data.accessToken}; path=/; max-age=900; SameSite=Lax`;

      router.replace("/dashboard");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-visual">
        <div className="sidebar-brand">
          <div className="brand-mark">
            RG
          </div>

          <div>
            <div className="brand-name">
              Road<span>Guard</span>
            </div>

            <div className="brand-caption">
              COMMAND CENTER
            </div>
          </div>
        </div>

        <div className="login-copy">
          <span className="login-kicker">
            EMERGENCY MOBILITY / CONTROL
          </span>

          <h1>
            Move help.
            <br />

            <span
              style={{
                color:
                  "rgb(var(--accent))",
              }}
            >
              When it matters.
            </span>
          </h1>

          <p>
            One intelligent console for roadside
            incidents, mechanic verification,
            pricing and customer support.
          </p>

          <div className="route-line" />
        </div>

        <div className="login-meta">
          SECURE ADMIN CONSOLE · JWT AUTHENTICATION ·
          24/7 DISPATCH
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <span className="login-kicker">
            ADMIN ACCESS
          </span>

          <h2>
            Welcome back
          </h2>

          <p className="subtitle">
            Sign in to enter the RoadGuard
            operations center.
          </p>

          <form
            onSubmit={handleLogin}
            className="login-form"
          >
            {error && (
              <div
                className="login-error"
                role="alert"
              >
                ⚠ {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">
                Admin email
              </label>

              <input
                id="email"
                className="field"
                type="email"
                autoComplete="email"
                placeholder="admin@roadguard.app"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                Password
              </label>

              <input
                id="password"
                className="field"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
              />
            </div>

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading
                ? "Authenticating..."
                : "Enter Command Center →"}
            </button>
          </form>

          <div className="demo-note">
            <strong>
              Local development:
            </strong>{" "}
            use the ADMIN account created by your
            backend Prisma seed.
          </div>
        </div>
      </section>
    </main>
  );
}