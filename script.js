// Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAG-bhvl4ckjlZ04U9-Au_ga3GFFE0wab4",
  authDomain: "formulario-retiro-11427.firebaseapp.com",
  projectId: "formulario-retiro-11427",
  storageBucket: "formulario-retiro-11427.appspot.com",
  messagingSenderId: "191830176442",
  appId: "1:191830176442:web:b062935f74bbb16b400883",
  measurementId: "G-CSCB1EEYNH"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Inicializar EmailJS
emailjs.init("3rtdVYTxT07AcNSQW");

document.addEventListener('DOMContentLoaded', function() {
  // Mostrar año actual en el footer
  document.getElementById('year').textContent = new Date().getFullYear();

  // Configurar campos condicionales
  setupConditionalFields();

  // Configurar navegación entre pasos
  setupFormNavigation();

  // Envío del formulario
  document.getElementById("retiroForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    try {
      // Validar todos los pasos antes de enviar
      if (!validateAllSteps()) {
        return;
      }

      // Mostrar loader
      const loader = document.createElement('div');
      loader.className = 'loader';
      this.appendChild(loader);
      loader.style.display = 'block';

      const formData = new FormData(this);
      const data = Object.fromEntries(formData.entries());

      // Guardar en Firebase
      await db.collection("checklists_retiro").add(data);
      
      // Enviar por EmailJS
      await sendEmail(data);
      
      // Mostrar modal de éxito
      showSuccessModal();
      this.reset();
      
      // Volver al primer paso
      goToStep('contacto');

    } catch (error) {
      showGlobalError("Hubo un error al enviar el formulario: " + error.message);
      console.error("Error:", error);
    } finally {
      const loader = this.querySelector('.loader');
      if (loader) loader.style.display = 'none';
    }
  });

  // Configurar evento para cerrar modal
  document.querySelector('.modal-close').addEventListener('click', function() {
    document.getElementById('successModal').classList.add('hidden');
  });

  document.querySelector('.btn-close-modal').addEventListener('click', function() {
    document.getElementById('successModal').classList.add('hidden');
  });

  // Cerrar modal al hacer clic fuera del contenido
  document.getElementById('successModal').addEventListener('click', function(e) {
    if (e.target === this) {
      this.classList.add('hidden');
    }
  });
});

// Función para mostrar el modal de éxito
function showSuccessModal() {
  const modal = document.getElementById('successModal');
  modal.classList.remove('hidden');
}

// Función para mostrar errores globales
function showGlobalError(message) {
  const errorContainer = document.getElementById('global-error') || document.createElement('div');
  errorContainer.id = 'global-error';
  errorContainer.className = 'global-error-message';
  errorContainer.textContent = message;
  
  if (!document.getElementById('global-error')) {
    document.querySelector('.form-container').prepend(errorContainer);
  }
}

// Función para limpiar errores globales
function clearGlobalError() {
  const errorContainer = document.getElementById('global-error');
  if (errorContainer) errorContainer.remove();
}

// Función para validar todos los pasos antes de enviar
function validateAllSteps() {
  const steps = ['step-contacto', 'step-retiro', 'step-accesos'];
  let allValid = true;
  
  steps.forEach(stepId => {
    if (!validateStep(stepId)) {
      if (allValid) {
        goToStep(stepId.replace('step-', ''));
        showStepErrorMessage(stepId);
      }
      allValid = false;
    }
  });
  
  return allValid;
}

// Mostrar mensaje específico según el paso con errores
function showStepErrorMessage(stepId) {
  let message = '';
  switch(stepId) {
    case 'step-contacto':
      message = 'Por favor completa correctamente los datos de contacto (faltan campos o hay correos inválidos)';
      break;
    case 'step-retiro':
      message = 'Por favor completa correctamente los detalles del retiro';
      break;
    case 'step-accesos':
      message = 'Por favor completa correctamente los requisitos de acceso';
      break;
  }
  showGlobalError(message);
}

// Función para validar un paso específico
function validateStep(stepId) {
  const step = document.getElementById(stepId);
  if (!step) return false;

  // Limpiar errores previos
  step.querySelectorAll('.error-message').forEach(el => el.remove());
  step.querySelectorAll('input, select, textarea').forEach(el => {
    el.style.borderColor = '';
  });

  let isValid = true;
  const inputs = step.querySelectorAll('[required]');

  inputs.forEach(input => {
    const value = input.value.trim();
    let error = '';
    
    // Validación para radios
    if (input.type === 'radio') {
      const radioGroup = step.querySelectorAll(`input[type="radio"][name="${input.name}"]`);
      if (!Array.from(radioGroup).some(radio => radio.checked)) {
        error = 'Debe seleccionar una opción';
      }
    } 
    // Validación para campos vacíos
    else if (!value) {
      error = 'Este campo es obligatorio';
    } 
    // Validación específica para emails
    else if (input.type === 'email' && !validateEmail(value)) {
      error = 'Ingrese un correo electrónico válido (ejemplo@dominio.com)';
    }
    // Validación para fechas
    else if (input.type === 'date' && !validateDate(value)) {
      error = 'Ingrese una fecha válida';
    }
    
    if (error) {
      isValid = false;
      showFieldError(input, error);
    }
  });

  return isValid;
}

// Validar formato de email
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Validar fecha (no puede ser anterior a hoy)
function validateDate(dateString) {
  const inputDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate >= today;
}

// Mostrar error en un campo específico
function showFieldError(input, message) {
  input.style.borderColor = '#ff4444';
  
  const errorMsg = document.createElement('div');
  errorMsg.className = 'error-message';
  errorMsg.textContent = message;
  
  // Insertar después del input o su contenedor
  if (input.type === 'radio') {
    input.closest('.status-options').after(errorMsg);
  } else {
    input.parentNode.insertBefore(errorMsg, input.nextSibling);
  }
}

// Función para enviar el correo con todos los campos
async function sendEmail(data) {
  const emailData = {
    "00 empresa": data.empresa || 'No especificado',
    "01 quien_solicita": data.nombre || 'No especificado',
    "02 direccion": data.direccion || 'No especificado',
    "03 contacto": data.nombre || 'No especificado',
    "04 correo": data.correo || 'No especificado',
    "05 telefono": data.telefono || 'No especificado',
    "06 fecha_retiro": new Date().toLocaleDateString(),
    "07 horario_retiro": data.horario_retiro === 'am' ? 'Mañana (9:00 - 12:00)' : 'Tarde (13:00 - 17:00)',
    "08 qué_retiro": data.tipo_retiro || 'No especificado',
    "09 cantidad": data.cantidad || '1',
    "10 modelos_series": data.modelos_series || 'No especificado',
    "11 accesorios": data.tiene_accesorios === 'on' ? 
                     (data.detalle_accesorios || 'Sí, pero no especificados') : 
                     'No',
    "12 estado": data.estado || 'No especificado',
    "13 embalado": data.embalado === 'si' ? 'Sí' : 
                   data.embalado === 'no' ? 'No' : 
                   data.embalado === 'parcial' ? 'Parcialmente' : 'No especificado',
    "14 mantencion": data.mantencion === 'no' ? 'No' :
                     data.mantencion === 'revision' ? 'Solo revisión' :
                     data.mantencion === 'mantencion' ? 'Revisión y mantención' : 'No especificado',
    "15 destino": data.destino === 'bodega_servicio' ? 'Backup (Bodega Servicio)' :
                 data.destino === 'bodega_almacen' ? 'Implementación futura (Bodega Almacén)' :
                 data.destino === 'scrap' ? 'Scrap (Desecho)' :
                 data.otro_destino || 'No especificado',
    "16 Observaciones": data.observaciones || 'Ninguna',
    "17 contacto_backup": data.nombre_backup ? 
                         `${data.nombre_backup} (Tel: ${data.telefono_backup || 'No'}, Email: ${data.correo_backup || 'No'})` : 
                         'No especificado',
    "18 retiro_masivo": data.retiro_masivo === 'on' ? 'Sí' : 'No',
    "19 equipos_desconectados": data.desconectados === 'on' ? 'Sí' : 'No',
    "20 equipos_apilados": data.apilados === 'on' ? 'Sí' : 'No',
    "21 requiere_epp": data.requiere_epp === 'on' ? 
                      `Sí (${data.detalle_epp || 'No especificado'})` : 
                      'No',
    "22 tipo_transporte": data.tipo_transporte || 'No especificado',
    "23 requisitos_seguridad": data.requisitos_seguridad || 'Ninguno',
    "24 estacionamiento": data.estacionamiento === 'si' ? 
                         `Sí ${data.altura_maxima ? '(Altura máx: ' + data.altura_maxima + 'm)' : ''}` : 
                         'No',
    "25 ascensor_montacarga": data.ascensor === 'si' ? 'Sí' : 'No',
    "26 distancia_maniobra": data.distancia_maniobra ? 
                            `${data.distancia_maniobra} metros` : 
                            'No especificado',
    "27 documentacion": data.documentacion_requerida || 'Ninguna'
  };

  return emailjs.send("service_7aeeyab", "template_1uoe82d", emailData);
}

// Funciones auxiliares
function setupConditionalFields() {
  // Accesorios
  document.getElementById('tiene_accesorios').addEventListener('change', function() {
    document.getElementById('accesorios_container').classList.toggle('hidden', !this.checked);
  });

  // Retiro masivo
  document.getElementById('retiro_masivo').addEventListener('change', function() {
    document.getElementById('masivo_container').classList.toggle('hidden', !this.checked);
  });

  // EPP
  document.getElementById('requiere_epp').addEventListener('change', function() {
    document.getElementById('epp_container').classList.toggle('hidden', !this.checked);
  });

  // Estacionamiento
  document.getElementById('estacionamiento').addEventListener('change', function() {
    document.getElementById('estacionamiento_info').classList.toggle('hidden', this.value !== 'si');
  });

  // Destino
  document.getElementById('destino').addEventListener('change', function() {
    document.getElementById('otro_destino_container').classList.toggle('hidden', this.value !== 'otro');
  });
}

function setupFormNavigation() {
  // Navegación entre pasos
  document.querySelectorAll('.btn-next').forEach(button => {
    button.addEventListener('click', function() {
      const currentStep = this.closest('.form-step');
      const nextStepId = this.dataset.next;
      
      if (validateStep(currentStep.id)) {
        clearGlobalError();
        goToStep(nextStepId);
      }
    });
  });
  
  // Botón anterior
  document.querySelectorAll('.btn-prev').forEach(button => {
    button.addEventListener('click', function() {
      const prevStepId = this.dataset.prev;
      clearGlobalError();
      goToStep(prevStepId);
    });
  });
}

function goToStep(stepId) {
  const fullStepId = stepId.startsWith('step-') ? stepId : `step-${stepId}`;
  
  document.querySelectorAll('.form-step').forEach(step => {
    step.classList.remove('active');
  });
  
  const stepElement = document.getElementById(fullStepId);
  if (stepElement) {
    stepElement.classList.add('active');
    updateProgressBar(stepId);
    // Scroll suave al inicio del formulario
    document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
  }
}

function updateProgressBar(activeStep) {
  const steps = {
    'contacto': 1,
    'retiro': 2,
    'accesos': 3
  };
  
  document.querySelectorAll('.progress-step').forEach(step => {
    step.classList.remove('active');
  });
  
  for (let i = 1; i <= steps[activeStep]; i++) {
    const stepName = Object.keys(steps).find(key => steps[key] === i);
    const stepElement = document.querySelector(`.progress-step[data-step="${stepName}"]`);
    if (stepElement) {
      stepElement.classList.add('active');
    }
  }
}
