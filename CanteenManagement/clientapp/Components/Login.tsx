import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./Login.css";

const Login: React.FC = () => {
    const [username, setUsername] = useState("");
    const [shakeCard, setShakeCard] = useState(false);
    const navigate = useNavigate();

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

    const handleContinue = (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedUser = username.trim();

        if (trimmedUser === "user_cantine") {
            // Store username temporarily in sessionStorage
            sessionStorage.setItem("loginUser", trimmedUser);
            navigate("/password");
        } else {
            // Trigger card shake animation
            setShakeCard(true);
            setTimeout(() => setShakeCard(false), 500);

            // Display beautiful SweetAlert2 Toast error
            Toast.fire({
                icon: "error",
                title: "Please check user login"
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
                    <h2 className="portal-title">Canteen Management</h2>
                    <p className="portal-subtitle">Welcome back! Please sign in to continue</p>
                </div>

                <form onSubmit={handleContinue} className="w-100 mt-2">
                    <div className="custom-input-group">
                        <input
                            type="text"
                            id="username"
                            className="custom-form-input"
                            placeholder=" "
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoFocus
                            autoComplete="off"
                        />
                        <i className="bi bi-person-fill input-icon-left"></i>
                        <label htmlFor="username">Username / Login ID</label>
                    </div>

                    <button type="submit" className="glow-btn">
                        <span>Continue</span>
                        <i className="bi bi-arrow-right"></i>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
