import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./Login.css";

const Password: React.FC = () => {
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [shakeCard, setShakeCard] = useState(false);
    const navigate = useNavigate();

    const username = sessionStorage.getItem("loginUser") || "";

    // Redirect to login if user didn't enter the username first
    useEffect(() => {
        if (username !== "user_cantine") {
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

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();

        if (password === "cantine@123") {
            // Store login session
            sessionStorage.setItem("isLoggedIn", "true");
            
            // Success Toast
            Toast.fire({
                icon: "success",
                title: "Welcome! Logged in successfully"
            });

            // Redirect to dashboard (root path)
            navigate("/", { replace: true });
        } else {
            // Trigger card shake animation
            setShakeCard(true);
            setTimeout(() => setShakeCard(false), 500);

            // Display beautiful SweetAlert2 Toast error
            Toast.fire({
                icon: "error",
                title: "Please check your Password"
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
