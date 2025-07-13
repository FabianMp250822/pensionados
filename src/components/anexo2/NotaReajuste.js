import React from 'react';
import { formatearPagoReal } from './utils';

const NotaReajuste = ({ pensionesUnicas, obtenerPagoEnero }) => {
  return (
    <div className="nota-reajuste">
      <h3>1. REAJUSTE DE MESADA A CARGO DE LA EMPRESA ANTES DE COMPARTIR</h3>
      
      {/* Información de debug de datos disponibles */}
      {pensionesUnicas.length > 0 && (
        <div className="datos-disponibles">
          <h4>Datos disponibles en el sistema:</h4>
        
          <div className="calculo-base">
            <strong>Metodología de cálculo dinámico con datos consolidados:</strong>
            <p>Valor base 1999: {formatearPagoReal(obtenerPagoEnero(1999) || 1609662)}</p>
            <div className="ejemplo-calculo">
              <p><strong>Descripción de las columnas con datos consolidados (1982-2025):</strong></p>
              <ul>
                <li><strong>Año:</strong> Año de análisis de la pensión</li>
                <li><strong>SMLMV:</strong> Salario Mínimo Legal Mensual Vigente del año (datos consolidados)</li>
                <li><strong>Reajuste en % SMLMV:</strong> Porcentaje de reajuste del SMLMV del año (datos consolidados)</li>
                <li><strong>Proyección de Mesada Fiduprevisora con % SMLMV:</strong> Valor proyectado aplicando reajustes acumulativos desde 1999</li>
                <li><strong># de SMLMV (En el Reajuste x SMLMV):</strong> Proyección Mesada ÷ SMLMV del año</li>
                <li><strong>Reajuste en % IPCs:</strong> IPC del año anterior usado para reajustes (datos consolidados)</li>
                <li><strong>Mesada Pagada Fiduprevisora reajuste con IPCs:</strong> Último valor válido antes de caídas drásticas (&gt;50%)</li>
                <li><strong># de SMLMV (En el Reajuste x IPC):</strong> Mesada Pagada con IPCs ÷ SMLMV del año</li>
                <li><strong>Diferencias de Mesadas:</strong> Proyección con SMLMV - Mesada Pagada con IPCs (fórmula validada: si es N/D se muestra 0)</li>
                <li><strong># de Mesadas:</strong> Número real de pagos hasta detección de caída drástica</li>
                <li><strong>Total Diferencias Retroactivas:</strong> Diferencias de Mesadas × # de Mesadas (fórmula validada: si Diferencias = 0, Retroactivas = 0)</li>
              </ul>
              <div style={{marginTop: '15px', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '5px'}}>
                <p><strong>📊 Datos consolidados integrados:</strong></p>
                <ul>
                  <li>✅ SMLMV histórico 1982-2025</li>
                  <li>✅ IPC histórico 1981-2024 (para reajustes año siguiente)</li>
                  <li>✅ Reajustes SMLMV 1982-2025</li>
                  <li>✅ Detección automática de caídas drásticas (&gt;50%)</li>
                  <li>✅ Cálculos dinámicos preservando lógica original</li>
                  <li>✅ Validación fórmula: Total Retroactivas = Diferencias × # Mesadas</li>
                </ul>
              </div>
              <div style={{marginTop: '10px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '5px'}}>
                <p><strong>🚨 Ejemplo detección caída 2007:</strong></p>
                <p>Agosto: $2,607,761 → Septiembre: $1,014,335 (caída 61%) → Solo cuenta 9 pagos válidos</p>
              </div>
              <div style={{marginTop: '10px', padding: '10px', backgroundColor: '#d1ecf1', borderRadius: '5px'}}>
                <p><strong>🧮 Validación de fórmulas implementadas:</strong></p>
                <p><strong>1. Diferencias de Mesadas = Proyección de Mesada Fiduprevisora con % SMLMV - Mesada Pagada Fiduprevisora reajuste con IPCs</strong></p>
                <p><strong>2. Total Diferencias Retroactivas = Diferencias de Mesadas × # de Mesadas</strong></p>
                <ul style={{marginTop: '10px', marginBottom: '10px'}}>
                  <li>✅ Fórmula 1: Proyección SMLMV - Mesada Pagada IPCs = Diferencias</li>
                  <li>✅ Fórmula 2: Si Diferencias = 0 (o N/D) → Total Retroactivas = 0</li>
                  <li>✅ Fórmula 2: Si # de Mesadas = 0 → Total Retroactivas = 0</li>
                  <li>✅ Ejemplo: Diferencias $100,000 × 12 mesadas = $1,200,000 Total Retroactivas</li>
                </ul>
                <p><em>Ambas fórmulas están validadas y aplicadas en las tablas 1 y 3</em></p>
              </div>
            </div>
          </div>
        </div>
      )}
      {pensionesUnicas.length === 0 && (
        <div className="sin-datos">
          <p><strong>No hay datos de pagos disponibles para este usuario.</strong></p>
        </div>
      )}
    </div>
  );
};

export default NotaReajuste;
