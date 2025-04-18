import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Register.css";
import Swal from "sweetalert2";
import { firebaseAuthService } from "../services/firebaseService";
import { doc, setDoc } from "firebase/firestore";
import { db, storage } from "../firebase/firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { TextField, Button, Grid, Paper, Typography } from "@mui/material";

const Register = () => {
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [cedula, setCedula] = useState(""); // Nuevo estado para cédula
  const [email, setEmail] = useState("");
  const [celular, setCelular] = useState("");
  const [direccion, setDireccion] = useState("");
  const [dependencia, setDependencia] = useState("");
  const [telefonoFijo, setTelefonoFijo] = useState("");
  const [fechaUltimaMesadaRecibida, setFechaUltimaMesadaRecibida] = useState("");
  const [valorUltimaMesadaRecibida, setValorUltimaMesadaRecibida] = useState("");
  const [foto, setFoto] = useState(null);
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFoto(e.target.files[0]);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      Swal.fire({
        title: "Validación",
        text: "La contraseña debe tener al menos 6 caracteres.",
        icon: "warning",
        confirmButtonText: "OK",
      });
      return;
    }

    try {
      // 1) Registrar en Firebase Auth
      const user = await firebaseAuthService.register(email, password);

      // 2) Subir la foto (opcional)
      let fotoURL = "";
      if (foto) {
        const storageRef = ref(storage, `usuarios/${user.uid}/profile.jpg`);
        await uploadBytes(storageRef, foto);
        fotoURL = await getDownloadURL(storageRef);
      }

      // 3) Guardar datos personales en la colección "usuarios"
      await setDoc(doc(db, "usuarios", user.uid), {
        nombres,
        apellidos,
        cedula, // Se incluye la cédula
        email,
        celular,
        direccion,
        dependencia,
        telefonoFijo,
        fechaUltimaMesadaRecibida,
        valorUltimaMesadaRecibida,
        foto: fotoURL,
      });

      // 4) Guardar el rol en la colección "rol"
      await setDoc(doc(db, "rol", user.uid), {
        nivel: "cliente", // Ajusta el valor del rol según necesites
      });

      Swal.fire({
        title: "Registro Exitoso",
        text: `Bienvenido, ${email}`,
        icon: "success",
        confirmButtonText: "OK",
      });

      // Deja que el listener en App.js maneje la autenticación y el rol
      navigate("/");
    } catch (error) {
      Swal.fire({
        title: "Error en el Registro",
        text: error.message,
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  return (
    <div className="register-container">
      <div className="logo-container">
        <img
          src="https://firebasestorage.googleapis.com/v0/b/pensionados-d82b2.appspot.com/o/Captura%20desde%202025-02-12%2014-38-01.png?alt=media&token=85350e0f-d5fd-45fa-a7bd-8764d34c123b"
          alt="Logo de la App"
          className="logo-image"
        />
      </div>
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        className="register-wrapper"
      >
        <Paper elevation={3} className="register-card">
          <Typography variant="h4" gutterBottom align="center">
            Registro
          </Typography>
          <form onSubmit={onSubmit} className="register-form">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nombres"
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Apellidos"
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  required
                />
              </Grid>
              {/* Campo para Cédula */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Cédula"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Celular"
                  value={celular}
                  onChange={(e) => setCelular(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Teléfono Fijo"
                  value={telefonoFijo}
                  onChange={(e) => setTelefonoFijo(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Dirección"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Dependencia"
                  value={dependencia}
                  onChange={(e) => setDependencia(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Fecha Última Mesada Recibida"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={fechaUltimaMesadaRecibida}
                  onChange={(e) => setFechaUltimaMesadaRecibida(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Valor Última Mesada Recibida"
                  type="number"
                  value={valorUltimaMesadaRecibida}
                  onChange={(e) =>
                    setValorUltimaMesadaRecibida(e.target.value)
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" component="label" className="hover-effect">
                  Cargar Foto
                  <input
                    type="file"
                    hidden
                    onChange={handleFileChange}
                    accept="image/*"
                  />
                </Button>
                {foto && <span className="file-name">{foto.name}</span>}
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Contraseña"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  helperText="Mínimo 6 caracteres"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  fullWidth
                  className="hover-effect"
                >
                  Registrarse
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" align="center">
                  ¿Ya estás registrado?{" "}
                  <Link to="/login" className="login-link">
                    Ingresa aquí
                  </Link>
                </Typography>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Grid>
    </div>
  );
};

export default Register;
