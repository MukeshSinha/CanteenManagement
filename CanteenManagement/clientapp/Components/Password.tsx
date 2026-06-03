import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./Login.css";
import { apiFetch } from "../src/utils/api";

const Password: React.FC = () => {
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [shakeCard, setShakeCard] = useState(false);
    const navigate = useNavigate();

    const username = sessionStorage.getItem("loginUser") || "";

    // Redirect to login if user didn't enter the username first
    useEffect(() => {
        if (!username) {
            navigate("/login", { replace: true });
        }
    }, [username, navigate]);

    // SweetAlert2 Toast configuration
    const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: "#0f172a",
        color: "#f8fafc",
        didOpen: (toast) => {
            toast.addEventListener("mouseenter", Swal.stopTimer);
            toast.addEventListener("mouseleave", Swal.resumeTimer);
        }
    });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!password.trim()) return;

        try {
            const res = await apiFetch("Login/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userName: username, password: password })
            });

            const data = typeof res === "string" ? JSON.parse(res) : res;

            if (data?.statusCode === 1) {
                // Store login session
                sessionStorage.setItem("isLoggedIn", "true");
                
                // Hardcode role value in TSX page based on username
                if (username === "admin") {
                    sessionStorage.setItem("userRole", "1");
                    Toast.fire({
                        icon: "success",
                        title: "Welcome Admin! Logged in successfully"
                    });
                    navigate("/admin-dashboard", { replace: true });
                } else {
                    sessionStorage.setItem("userRole", "2");
                    Toast.fire({
                        icon: "success",
                        title: "Welcome! Logged in successfully"
                    });
                    navigate("/user-dashboard", { replace: true });
                }
            } else {
                // Trigger card shake animation
                setShakeCard(true);
                setTimeout(() => setShakeCard(false), 500);

                // Display beautiful SweetAlert2 Toast error
                Toast.fire({
                    icon: "error",
                    title: data?.message || "Please check your Password"
                });
            }
        } catch (err) {
            console.error(err);
            setShakeCard(true);
            setTimeout(() => setShakeCard(false), 500);
            Toast.fire({
                icon: "error",
                title: "Failed to connect to server"
            });
        }
    };

    return (
        <div className="login-page-container">
            <div className={`glass-login-card d-flex flex-column ${shakeCard ? "card-shake" : ""}`}>
                <div className="portal-brand">
                    <div className="brand-icon-box">
                        <i className="bi bi-cup-hot-fill"></i>
                    </div>
                    <h2 className="portal-title">Enter Password</h2>
                    <p className="portal-subtitle">Provide your credentials to access the portal</p>
                </div>

                {/* User Pill showing who is logging in */}
                <div className="user-pill">
                    <div className="user-pill-avatar">U</div>
                    <span>{username}</span>
                </div>

                <form onSubmit={handleLogin} className="w-100 mt-1">
                    <div className="custom-input-group">
                        <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            className="custom-form-input"
                            placeholder=" "
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoFocus
                        />
                        <i className="bi bi-shield-lock-fill input-icon-left"></i>
                        <label htmlFor="password">Password</label>
                        
                        <button
                            type="button"
                            className="password-toggle-btn"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                        </button>
                    </div>

                    <button type="submit" className="glow-btn">
                        <span>Sign In</span>
                        <i className="bi bi-box-arrow-in-right"></i>
                    </button>
                </form>

                <div 
                    className="back-link align-self-center"
                    onClick={() => navigate("/login")}
                >
                    <i className="bi bi-chevron-left"></i>
                    <span>Sign in with a different user</span>
                </div>
            </div>
        </div>
    );
};

export default Password;
