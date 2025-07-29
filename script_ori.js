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

    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());

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

      // Guardar en Firebase
      await db.collection("checklists_retiro").add(data);
      
      // Enviar por EmailJS
      await sendEmail(data);
      
      // Mostrar mensaje de éxito
      document.getElementById("mensajeEnviado").classList.remove("hidden");
      this.reset();
      
      // Volver al primer paso
      goToStep('contacto');
      
      // Ocultar mensaje después de 5 segundos
      setTimeout(() => {
        document.getElementById("mensajeEnviado").classList.add("hidden");
      }, 5000);

    } catch (error) {
      alert("Hubo un error al guardar: " + error);
      console.error("Error:", error);
    } finally {
      const loader = this.querySelector('.loader');
      if (loader) loader.style.display = 'none';
    }
  });
});

// Función para validar todos los pasos antes de enviar
function validateAllSteps() {
  const steps = ['step-contacto', 'step-retiro', 'step-accesos']; // Agregado prefijo step-
  let allValid = true;
  
  steps.forEach(stepId => {
    if (!validateStep(stepId)) {
      // Ir al primer paso con error
      if (allValid) {
        goToStep(stepId.replace('step-', ''));
      }
      allValid = false;
    }
  });
  
  return allValid;
}

// Función para enviar el correo con todos los campos
async function sendEmail(data) {
  // Preparar datos para EmailJS según tu estructura requerida
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
    
    // Campos adicionales para información completa
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

  // Modificar el ID del servicio de acuerdo a la configuración de EmailJS
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
        goToStep(nextStepId);
      }
    });
  });
  
  // Botón anterior
  document.querySelectorAll('.btn-prev').forEach(button => {
    button.addEventListener('click', function() {
      const prevStepId = this.dataset.prev;
      goToStep(prevStepId);
    });
  });
}

function validateStep(stepId) {
  const step = document.getElementById(stepId);
  if (!step) {
    console.error(`No se encontró el paso con ID: ${stepId}`);
    return false;
  }

  // Limpiar errores previos
  const existingErrors = step.querySelectorAll('.error-message');
  existingErrors.forEach(error => error.remove());

  // Validar campos requeridos
  const inputs = step.querySelectorAll('[required]');
  let isValid = true;

  inputs.forEach(input => {
    // Caso especial para radio buttons
    if (input.type === 'radio') {
      const radioGroupName = input.name;
      const radioGroup = step.querySelectorAll(`input[type="radio"][name="${radioGroupName}"]`);
      const isRadioChecked = Array.from(radioGroup).some(radio => radio.checked);
      
      if (!isRadioChecked && !radioGroup[0].closest('.status-options').nextElementSibling?.classList.contains('error-message')) {
        isValid = false;
        const errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.textContent = 'Debe seleccionar una opción';
        radioGroup[0].closest('.status-options').after(errorMsg);
      }
    } 
    // Para otros tipos de campos
    else if (!input.value.trim()) {
      isValid = false;
      input.style.borderColor = 'red';
      
      if (!input.nextElementSibling?.classList.contains('error-message')) {
        const errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.textContent = 'Este campo es obligatorio';
        input.after(errorMsg);
      }
    } else {
      input.style.borderColor = '#ccc';
    }
  });

  return isValid;
}

function goToStep(stepId) {
  // Asegurarse de que el ID tenga el prefijo 'step-'
  const fullStepId = stepId.startsWith('step-') ? stepId : `step-${stepId}`;
  
  document.querySelectorAll('.form-step').forEach(step => {
    step.classList.remove('active');
  });
  
  const stepElement = document.getElementById(fullStepId);
  if (!stepElement) {
    console.error(`No se encontró el paso con ID: ${fullStepId}`);
    return;
  }
  
  stepElement.classList.add('active');
  updateProgressBar(stepId);
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