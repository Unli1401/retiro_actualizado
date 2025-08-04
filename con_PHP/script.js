// Configuración Firebase (igual que antes)
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

// =============================================
// Funciones principales (modificadas para PHP)
// =============================================
document.addEventListener('DOMContentLoaded', function() {
  // Mostrar año actual
  document.getElementById('year').textContent = new Date().getFullYear();

  // Configurar campos condicionales
  setupConditionalFields();

  // Configurar navegación entre pasos
  setupFormNavigation();

  // Envío del formulario (ahora con Fetch a PHP)
  document.getElementById("retiroForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    try {
      // Validar todos los pasos
      if (!validateAllSteps()) return;

      // Mostrar loader
      const loader = document.createElement('div');
      loader.className = 'loader';
      this.appendChild(loader);
      loader.style.display = 'block';

      // Obtener datos del formulario
      const formData = new FormData(this);
      const data = Object.fromEntries(formData.entries());

      // 1. Guardar en Firebase (igual que antes)
      await db.collection("checklists_retiro").add(data);
      
      // 2. Enviar por PHP (reemplazo de EmailJS)
      const response = await fetch('enviar_formulario.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Error al enviar');

      // Éxito: mostrar modal y resetear
      showSuccessModal();
      this.reset();
      goToStep('contacto');

    } catch (error) {
      showGlobalError("Error: " + error.message);
      console.error("Error detallado:", error);
    } finally {
      const loader = this.querySelector('.loader');
      if (loader) loader.remove();
    }
  });

  // Cerrar modal (igual que antes)
  document.querySelector('.modal-close, .btn-close-modal').addEventListener('click', function() {
    document.getElementById('successModal').classList.add('hidden');
  });
});

// =============================================
// Funciones auxiliares (se mantienen igual)
// =============================================
function showSuccessModal() {
  document.getElementById('successModal').classList.remove('hidden');
}

function showGlobalError(message) {
  const errorContainer = document.getElementById('global-error') || document.createElement('div');
  errorContainer.id = 'global-error';
  errorContainer.className = 'global-error-message';
  errorContainer.textContent = message;
  
  if (!document.getElementById('global-error')) {
    document.querySelector('.form-container').prepend(errorContainer);
  }
}

function clearGlobalError() {
  const errorContainer = document.getElementById('global-error');
  if (errorContainer) errorContainer.remove();
}

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

function showStepErrorMessage(stepId) {
  const messages = {
    'step-contacto': 'Por favor completa los datos de contacto (faltan campos o correos inválidos)',
    'step-retiro': 'Completa los detalles del retiro',
    'step-accesos': 'Completa los requisitos de acceso'
  };
  showGlobalError(messages[stepId] || 'Hay errores en el formulario');
}

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
    
    if (input.type === 'radio') {
      const radioGroup = document.querySelectorAll(`input[type="radio"][name="${input.name}"]`);
      if (!Array.from(radioGroup).some(radio => radio.checked)) {
        error = 'Debe seleccionar una opción';
      }
    } else if (!value) {
      error = 'Este campo es obligatorio';
    } else if (input.type === 'email' && !validateEmail(value)) {
      error = 'Ingrese un correo válido (ejemplo@dominio.com)';
    } else if (input.type === 'date' && !validateDate(value)) {
      error = 'Ingrese una fecha válida';
    }
    
    if (error) {
      isValid = false;
      showFieldError(input, error);
    }
  });

  return isValid;
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validateDate(dateString) {
  const inputDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate >= today;
}

function showFieldError(input, message) {
  input.style.borderColor = '#ff4444';
  const errorMsg = document.createElement('div');
  errorMsg.className = 'error-message';
  errorMsg.textContent = message;
  input.parentNode.insertBefore(errorMsg, input.nextSibling);
}

function setupConditionalFields() {
  // Toggle para accesorios
  document.getElementById('tiene_accesorios').addEventListener('change', function() {
    document.getElementById('accesorios_container').classList.toggle('hidden', !this.checked);
  });

  // Toggle para retiro masivo
  document.getElementById('retiro_masivo').addEventListener('change', function() {
    document.getElementById('masivo_container').classList.toggle('hidden', !this.checked);
  });

  // Toggle para EPP
  document.getElementById('requiere_epp').addEventListener('change', function() {
    document.getElementById('epp_container').classList.toggle('hidden', !this.checked);
  });

  // Toggle para estacionamiento
  document.getElementById('estacionamiento').addEventListener('change', function() {
    document.getElementById('estacionamiento_info').classList.toggle('hidden', this.value !== 'si');
  });

  // Toggle para destino
  document.getElementById('destino').addEventListener('change', function() {
    document.getElementById('otro_destino_container').classList.toggle('hidden', this.value !== 'otro');
  });
}

function setupFormNavigation() {
  // Botones "Siguiente"
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
  
  // Botones "Anterior"
  document.querySelectorAll('.btn-prev').forEach(button => {
    button.addEventListener('click', function() {
      clearGlobalError();
      goToStep(this.dataset.prev);
    });
  });
}

function goToStep(stepId) {
  const fullStepId = `step-${stepId}`;
  document.querySelectorAll('.form-step').forEach(step => {
    step.classList.remove('active');
  });
  
  const stepElement = document.getElementById(fullStepId);
  if (stepElement) {
    stepElement.classList.add('active');
    updateProgressBar(stepId);
    document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
  }
}

function updateProgressBar(activeStep) {
  const steps = { 'contacto': 1, 'retiro': 2, 'accesos': 3 };
  document.querySelectorAll('.progress-step').forEach(step => {
    step.classList.remove('active');
  });
  
  for (let i = 1; i <= steps[activeStep]; i++) {
    const stepName = Object.keys(steps).find(key => steps[key] === i);
    document.querySelector(`.progress-step[data-step="${stepName}"]`)?.classList.add('active');
  }
}