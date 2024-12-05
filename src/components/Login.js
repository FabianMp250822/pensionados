import React, { useState } from "react";
import "./Login.css";
import Swal from "sweetalert2"; // Para mostrar alertas
import { firebaseAuthService } from "../services/firebaseService"; // Importamos el servicio de autenticación

const Login = ({ handleLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Función para manejar el login con email y contraseña
  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      // Intentamos iniciar sesión
      const user = await firebaseAuthService.login(email, password);
      Swal.fire({
        title: "Login Exitoso",
        text: `Bienvenido, ${user.email}`, // Mostramos el email del usuario autenticado
        icon: "success",
        confirmButtonText: "OK",
      });
      handleLogin(); // Actualizamos el estado de autenticación en la app principal
    } catch (error) {
      // Si el usuario no está registrado o ocurre un error
      if (error.code === "auth/user-not-found") {
        Swal.fire({
          title: "Error en el Login",
          text: "El usuario no está registrado. Por favor verifica tus credenciales.",
          icon: "error",
          confirmButtonText: "OK",
        });
      } else {
        Swal.fire({
          title: "Error en el Login",
          text: error.message,
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    }
  };

  // Función para manejar el login con Google
  const handleGoogleLogin = async () => {
    try {
      const user = await firebaseAuthService.loginWithGoogle(); // Llamamos al servicio de autenticación con Google
      Swal.fire({
        title: "Login con Google Exitoso",
        text: `Bienvenido, ${user.displayName}`, // Mostramos el nombre del usuario autenticado
        icon: "success",
        confirmButtonText: "OK",
      });
      handleLogin(); // Actualizamos el estado de autenticación en la app principal
    } catch (error) {
      Swal.fire({
        title: "Error en el Login con Google",
        text: error.message, // Mensaje de error desde Firebase
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  return (
    <div className="login-wrapper">
      <div className="card-container">
        {/* Logo en la parte superior */}
        <img
          src="https://i.ibb.co/GF3Dkfq/Captura-desde-2024-10-10-12-21-05.png"
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
            Si no tienes cuenta, contacta al administrador.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
