// ==============================
// Lógica de formulario por pasos
// ==============================

// Inicialización Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAG-bhvl4ckjlZ04U9-Au_ga3GFFE0wab4",
  authDomain: "formulario-retiro-11427.firebaseapp.com",
  projectId: "formulario-retiro-11427",
  storageBucket: "formulario-retiro-11427.firebasestorage.app",
  messagingSenderId: "191830176442",
  appId: "1:191830176442:web:b062935f74bbb16b400883",
  measurementId: "G-CSCB1EEYNH"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

emailjs.init("3rtdVYTxT07AcNSQW"); // Inicializa EmailJS

// ==============================
// Control de pasos del formulario
// ==============================
const form = document.getElementById("multiStepForm");
const steps = document.querySelectorAll(".form-step");
const nextBtn = document.getElementById("nextBtn");
const prevBtn = document.getElementById("prevBtn");
const submitBtn = document.getElementById("submitBtn");
const progressText = document.getElementById("progress-text");
const progressFill = document.querySelector(".progress-fill");
const mensajeEnviado = document.getElementById("mensajeEnviado");

let currentStep = 0;

function showStep(index) {
  steps.forEach((step, i) => {
    step.classList.toggle("hidden", i !== index);
  });

  prevBtn.classList.toggle("hidden", index === 0);
  nextBtn.classList.toggle("hidden", index === steps.length - 1);
  submitBtn.classList.toggle("hidden", index !== steps.length - 1);

  // Actualiza barra de progreso
  const porcentaje = ((index + 1) / steps.length) * 100;
  progressText.textContent = `Paso ${index + 1} de ${steps.length}`;
  progressFill.style.width = `${porcentaje}%`;
}

nextBtn.addEventListener("click", () => {
  const currentInputs = steps[currentStep].querySelectorAll("input, select, textarea");
  let allValid = true;
  currentInputs.forEach((input) => {
    if (!input.checkValidity()) {
      input.reportValidity();
      allValid = false;
    }
  });

  if (allValid && currentStep < steps.length - 1) {
    currentStep++;
    showStep(currentStep);
  }
});

prevBtn.addEventListener("click", () => {
  if (currentStep > 0) {
    currentStep--;
    showStep(currentStep);
  }
});

// ==============================
// Envío de datos a Firebase y EmailJS
// ==============================
form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  try {
    await db.collection("checklists_retiro").add(data);
    mensajeEnviado.classList.remove("hidden");
    form.reset();
    currentStep = 0;
    showStep(currentStep);

    // Envío a EmailJS
    emailjs.send("service_8hx368a", "template_1uoe82d", {
      "00 empresa": data["00. empresa"],
      "01 quien_solicita": data["01. quien_solicita"],
      "02 direccion": data["02. direccion"],
      "03 contacto": data["03. contacto"],
      "04 correo": data["04. correo"],
      "05 telefono": data["05. telefono"],
      "06 fecha_retiro": data["06. fecha_retiro"],
      "07 horario_retiro": data["07. horario_retiro"],
      "08 qué_retiro": data["08. qué_retiro"],
      "09 cantidad": data["09. cantidad"],
      "10 modelos_series": data["10. modelos_series"],
      "11 accesorios": data["11. accesorios"],
      "12 estado": data["12. estado"],
      "13 embalado": data["13. embalado"],
      "14 mantencion": data["14. mantencion"],
      "15 destino": data["15. destino"],
      "16 Observaciones": data["16. Observaciones"]
    });
  } catch (error) {
    alert("Hubo un error al guardar: " + error);
  }
});

// Mostrar el primer paso al cargar
showStep(currentStep);

// Actualiza el año en el footer
document.addEventListener("DOMContentLoaded", function () {
  const yearSpan = document.getElementById("year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
});
