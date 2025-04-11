import React from 'react';
import { Card, CardContent, CardHeader, Typography, Avatar } from '@mui/material';

const TarjetaSuperior = ({ usuario }) => {
  return (
    <Card sx={{ minHeight: 200 }}>
      <CardHeader title="Perfil de Cliente" />
      <CardContent>
        {/* Encabezado con foto y nombres */}
        <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
          <Avatar
            src={usuario.foto}
            sx={{ width: 100, height: 100, marginBottom: 2 }}
          />
          <Typography variant="h6" align="center" gutterBottom>
            {usuario.nombres} {usuario.apellidos}
          </Typography>
        </div>

        {/* Campos de información */}
        <Typography variant="body1">
          <strong>Email:</strong> {usuario.email}
        </Typography>
        <Typography variant="body1">
          <strong>Cédula:</strong> {usuario.cedula}
        </Typography>
        <Typography variant="body1">
          <strong>Celular:</strong> {usuario.celular}
        </Typography>
        <Typography variant="body1">
          <strong>Teléfono Fijo:</strong> {usuario.telefonoFijo}
        </Typography>
        <Typography variant="body1">
          <strong>Dirección:</strong> {usuario.direccion}
        </Typography>
        <Typography variant="body1">
          <strong>Dependencia:</strong> {usuario.dependencia}
        </Typography>
        <Typography variant="body1">
          <strong>Fecha Última Mesada Recibida:</strong>{' '}
          {usuario.fechaUltimaMesadaRecibida}
        </Typography>
        <Typography variant="body1">
          <strong>Valor Última Mesada Recibida:</strong>{' '}
          {usuario.valorUltimaMesadaRecibida}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default TarjetaSuperior;
