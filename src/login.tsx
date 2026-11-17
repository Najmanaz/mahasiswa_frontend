import { useState } from "react";
import type { FormEvent } from "react";
import "./Login.css";

const LOGIN_URL = "http://localhost:3000/api/v1/users/login";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);

      const response = await fetch(LOGIN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Email atau password salah");
      }

      // Ambil token dari response server
      const token = result.token ?? result.data?.token;
      const user = result.data;

      if (!token) {
        throw new Error("Token login tidak ditemukan dari server");
      }

      if (!user?.role) {
        throw new Error("Role pengguna tidak ditemukan");
      }

      // Simpan informasi login ke Session Storage
      sessionStorage.setItem("token", token);
      sessionStorage.setItem("role", user.role);

      if (user.nama_mahasiswa) {
        sessionStorage.setItem("nama_mahasiswa", user.nama_mahasiswa);
      }

      if (user.uuid) {
        sessionStorage.setItem("uuid", user.uuid);
      }

      // Masuk ke aplikasi
      window.location.href = "/";

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat login"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-decoration login-decoration-one" />
      <div className="login-decoration login-decoration-two" />

      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">S</div>
          <span>SchoolData</span>
        </div>

        <div className="login-heading">
          <p className="login-eyebrow">STUDENT MANAGEMENT SYSTEM</p>
          <h1>Selamat Datang!</h1>
          <p>Silakan masuk untuk mengakses sistem SchoolData.</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="login-field">
            <label htmlFor="email">Username</label>
            <input
              id="email"
              type="email"
              placeholder="Masukkan email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <div className="password-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />

              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Sembunyikan" : "Lihat"}
              </button>
            </div>
          </div>

          {error && <div className="login-error">{error}</div>}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? "Memproses..." : "Login"}
          </button>
        </form>

        <div className="login-footer">
          © 2026 SchoolData Management System
        </div>
      </div>
    </div>
  );
}

export default Login;
