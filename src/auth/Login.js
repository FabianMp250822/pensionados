import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";
import Swal from "sweetalert2";
import { firebaseAuthService } from "../services/firebaseService";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();

    try {
      const user = await firebaseAuthService.login(email, password);
      
      Swal.fire({
        title: "Login Exitoso",
        text: `Bienvenido, ${email}`,
        icon: "success",
        confirmButtonText: "OK",
      });

      // Si el usuario es administrador, se redirige a "/consultas"
      if (user.role === "administrador") {
        navigate("/consultas");
      } else {
        // Para otros roles redirige al home o se puede ajustar según se requiera
        navigate("/");
      }
    } catch (error) {
      const message =
        error.code === "auth/user-not-found"
          ? "El usuario no está registrado. Por favor verifica tus credenciales."
          : error.message;

      Swal.fire({
        title: "Error en el Login",
        text: message,
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  return (
    <div className="login-wrapper">
      <div className="card-container">
        <img
          src="https://firebasestorage.googleapis.com/v0/b/pensionados-d82b2.appspot.com/o/Captura%20desde%202025-02-12%2014-38-01.png?alt=media&token=85350e0f-d5fd-45fa-a7bd-8764d34c123b"
          alt="Logo"
          className="login-logo"
        />

        <div className="login-card">
          <h2>Login</h2>
          <form onSubmit={onSubmit}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">LOGIN</button>
          </form>

          <p className="instructions">
            Si no tienes cuenta,{" "}
            <Link to="/register" className="register-link">
              Regístrate aquí
            </Link>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
