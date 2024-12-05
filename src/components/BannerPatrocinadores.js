import React from 'react';
import './CarruselPatrocinadores.css';

const CarruselPatrocinadores = () => {
  // Lista de URLs de los logos de los patrocinadores
  const logos = [
    'https://via.placeholder.com/200x100.png?text=Logo1',
    'https://via.placeholder.com/200x100.png?text=Logo2',
    'https://via.placeholder.com/200x100.png?text=Logo3',
    'https://via.placeholder.com/200x100.png?text=Logo4',
    'https://via.placeholder.com/200x100.png?text=Logo5',
  ];

  return (
    <div className="carrusel-container">
      <div className="carrusel">
        {/* Clonamos los logos dos veces para lograr el efecto de infinito */}
        {[...logos, ...logos].map((logo, index) => (
          <div className="carrusel-item" key={index}>
            <img src={logo} alt={`Patrocinador ${index + 1}`} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CarruselPatrocinadores;
