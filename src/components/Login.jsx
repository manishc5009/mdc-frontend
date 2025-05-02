import React, { useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";
import bgImage from "../assets/bg-bg-img.png";
import "./LoginPage.css"; // Optional: Add your custom styles here

const LoginPage = ({ setUsername }) => {
  const { instance, accounts } = useMsal();
  const navigate = useNavigate();

  useEffect(() => {
    if (accounts && accounts.length > 0) {
      const { name, username } = accounts[0];
      localStorage.setItem("username", name);
      localStorage.setItem("useremail", username);
      setUsername(name);
      navigate("/");
    }
  }, [accounts, navigate, setUsername]);

  const handleLogin = () => {
    instance
      .loginPopup({
        scopes: ["user.read"],
      })
      .then((response) => {
        const { name, username } = response.account;
        localStorage.setItem("username", name);
        localStorage.setItem("useremail", username);
        setUsername(name);
        navigate("/");
      })
      .catch((error) => {
        console.error("Login error:", error);
      });
  };

  return (
    <div className="bg-white min-h-screen flex flex-col">

      <main className="main-content">
        <div className="content-wrapper">

          <div className="logo-section">
            <img src={bgImage} alt="Illustration" />
          </div>

          <form
            aria-label="Login form"
            className="login-form"
          >
          <h1 className="title">
            Welcome to MDC Application <span>👋</span>
          </h1>
          <p className="subtitle">Log in your account</p>

          <button
            type="button"
            onClick={handleLogin}
            className="ms-login-button"
            aria-label="Sign in with Microsoft"
          >
            <i className="fab fa-microsoft"></i>
            <span>Sign in With Microsoft</span>
          </button>
        </form>

        </div>
      </main>
    </div>
  );
};

export default LoginPage;
