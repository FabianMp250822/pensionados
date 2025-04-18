import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  Avatar,
  TextField,
  Button,
  Grid,
  InputLabel,
  MenuItem,
  FormControl,
  Select,
} from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import Swal from 'sweetalert2';
import { firebaseFirestoreService, firebaseStorageService } from '../services/firebaseService';

const Input = styled('input')({
  display: 'none',
});

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: 150,
  height: 150,
  margin: '0 auto',
  cursor: 'pointer',
  '&:hover': {
    opacity: 0.8,
  },
}));

const Perfil = () => {
  const { userRole } = useSelector(state => state.auth);
  const currentUser = useSelector(state => state.auth.currentUser); // Asume que guardas el usuario en Redux
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    confirmarEmail: '',
    documento: '',
    pais: '',
    ciudad: '',
    profesion: '',
    cedula: '',
    foto: null,
    fotoURL: '',
  });

  useEffect(() => {
    if (currentUser) {
      loadUserProfile(currentUser.uid);
    }
  }, [currentUser]);

  const loadUserProfile = async (uid) => {
    try {
      const data = await firebaseFirestoreService.getDocument('profiles', uid);
      if (data) {
        setFormData(prevFormData => ({
          ...prevFormData,
          ...data,
          foto: null,
        }));
      }
    } catch (error) {
      console.error('Error al cargar el perfil:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === 'foto') {
      setFormData(prev => ({ ...prev, foto: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      Swal.fire('Error', 'El usuario no está autenticado.', 'error');
      return;
    }

    try {
      let photoURL = formData.fotoURL;
      if (formData.foto) {
        photoURL = await firebaseStorageService.uploadFile(`profilePhotos/${currentUser.uid}`, formData.foto);
      }

      const profileData = {
        ...formData,
        fotoURL: photoURL,
      };

      await firebaseFirestoreService.setDocument('profiles', currentUser.uid, profileData);

      Swal.fire({
        title: 'Perfil Guardado',
        text: 'Tu perfil se ha guardado exitosamente.',
        icon: 'success',
        confirmButtonText: 'OK',
      }).then(() => navigate('/envivo'));
      
    } catch (error) {
      Swal.fire('Error', 'Hubo un error al guardar tu perfil.', 'error');
      console.error('Error al guardar el perfil:', error);
    }
  };

  return (
    <Card sx={{ maxWidth: 800, margin: '0 auto', mt: 5, p: 3 }}>
      <CardHeader title="Perfil de Usuario" subheader="Aquí puedes ver y editar tu perfil" />
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <label htmlFor="foto-perfil">
                <Input accept="image/*" id="foto-perfil" type="file" name="foto" onChange={handleChange} />
                <StyledAvatar src={formData.foto ? URL.createObjectURL(formData.foto) : formData.fotoURL}>
                  {!formData.foto && !formData.fotoURL && <PhotoCamera sx={{ fontSize: 80 }} />}
                </StyledAvatar>
              </label>
            </Grid>
            <Grid item xs={12} sm={8}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField required name="nombre" label="Nombre" fullWidth value={formData.nombre} onChange={handleChange} variant="outlined" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField required name="apellido" label="Apellido" fullWidth value={formData.apellido} onChange={handleChange} variant="outlined" />
                </Grid>
                <Grid item xs={12}>
                  <TextField required name="email" label="Correo Electrónico" type="email" fullWidth value={formData.email} onChange={handleChange} variant="outlined" />
                </Grid>
                <Grid item xs={12}>
                  <TextField required name="confirmarEmail" label="Confirmar Correo" type="email" fullWidth value={formData.confirmarEmail} onChange={handleChange} variant="outlined" />
                </Grid>
                <Grid item xs={12}>
                  <TextField required name="documento" label="Documento de Identificación" fullWidth value={formData.documento} onChange={handleChange} variant="outlined" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required variant="outlined">
                    <InputLabel>País</InputLabel>
                    <Select name="pais" value={formData.pais} onChange={handleChange} label="País">
                      <MenuItem value=""><em>Seleccione un país</em></MenuItem>
                      <MenuItem value="Estados Unidos">Estados Unidos</MenuItem>
                      <MenuItem value="México">México</MenuItem>
                      <MenuItem value="Colombia">Colombia</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField name="ciudad" label="Ciudad" fullWidth value={formData.ciudad} onChange={handleChange} variant="outlined" />
                </Grid>
                <Grid item xs={12}>
                  <TextField required name="profesion" label="Profesión" fullWidth value={formData.profesion} onChange={handleChange} variant="outlined" />
                </Grid>
                <Grid item xs={12}>
                  <TextField name="cedula" label="Laboratorio Auspiciado" fullWidth value={formData.cedula} onChange={handleChange} variant="outlined" />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          <Button type="submit" variant="contained" color="primary" sx={{ mt: 3 }}>Guardar Perfil</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default Perfil;
