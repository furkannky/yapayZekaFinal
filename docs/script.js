// Backend API URL'si
const API_URL = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") 
    ? "http://localhost:8000/predict" 
    : "https://kalp-analizi-backend.onrender.com/predict"; 

// --- Mod Geçiş (Toggle) Mantığı ---
const modeSwitch = document.getElementById('mode-switch');
const patientLabel = document.getElementById('mode-patient-label');
const doctorLabel = document.getElementById('mode-doctor-label');

modeSwitch.addEventListener('change', function() {
    const isDoctor = this.checked;
    
    if (isDoctor) {
        doctorLabel.classList.add('active');
        patientLabel.classList.remove('active');
        document.body.className = 'theme-doctor'; // Karanlık Tema
    } else {
        patientLabel.classList.add('active');
        doctorLabel.classList.remove('active');
        document.body.className = 'theme-patient'; // Aydınlık Tema
    }

    // Label Güncellemeleri
    document.querySelectorAll('.dynamic-label').forEach(label => {
        label.innerHTML = isDoctor ? label.getAttribute('data-doctor') : label.getAttribute('data-patient');
    });

    // Select Option Güncellemeleri
    document.querySelectorAll('.dyn-opt').forEach(opt => {
        opt.innerHTML = isDoctor ? opt.getAttribute('data-doctor') : opt.getAttribute('data-patient');
    });
    
    // Temaya Göre İlerleme Halkası Renklerini Yeniden Çiz (Varsa)
    const pctText = document.getElementById('result-percentage').innerText;
    if(pctText !== '--%') {
        setProgress(parseFloat(pctText));
    }
});

// Sayfa yüklendiğinde varsayılan modu (Hasta Modu) aktifleştir
modeSwitch.dispatchEvent(new Event('change'));
// -----------------------------------

// --- Dairesel İlerleme Çubuğu (Circular Progress) Mantığı ---
const circle = document.getElementById('progress-circle');
const radius = circle.r.baseVal.value;
const circumference = radius * 2 * Math.PI;

circle.style.strokeDasharray = `${circumference} ${circumference}`;
circle.style.strokeDashoffset = `${circumference}`;

function setProgress(percent) {
    const offset = circumference - percent / 100 * circumference;
    circle.style.strokeDashoffset = offset;
    
    document.getElementById('result-percentage').innerText = `${percent.toFixed(1)}%`;
    
    // Temaya ve Yüzdeye Göre Gradyan Renk Değişimi
    const gradStart = document.getElementById('grad-start');
    const gradEnd = document.getElementById('grad-end');
    const isDoctor = document.body.classList.contains('theme-doctor');
    
    if (percent <= 20) {
        // Düşük Risk (Sağlıklı)
        gradStart.setAttribute('stop-color', isDoctor ? '#00f2fe' : '#34d399'); // Doctor: Cyan, Patient: Green
        gradEnd.setAttribute('stop-color', isDoctor ? '#4facfe' : '#059669');
    } else if (percent <= 50) {
        // Orta Risk
        gradStart.setAttribute('stop-color', isDoctor ? '#f9d423' : '#fbbf24'); // Yellow/Orange
        gradEnd.setAttribute('stop-color', isDoctor ? '#f83600' : '#d97706');
    } else {
        // Yüksek Risk
        gradStart.setAttribute('stop-color', isDoctor ? '#ff0844' : '#f87171'); // Doctor: Neon Red/Pink, Patient: Red
        gradEnd.setAttribute('stop-color', isDoctor ? '#ffb199' : '#dc2626');
    }
}
// --------------------------------------

// Form Gönderimi
document.getElementById('prediction-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const btn = document.querySelector('.btn-submit');
    const resultLabel = document.getElementById('result-label');
    const resultRec = document.getElementById('result-recommendation');
    
    // UI Loading State
    btn.classList.add('loading');
    btn.disabled = true;

    // Collect Data
    const formData = {
        age: parseFloat(document.getElementById('age').value),
        sex: document.querySelector('input[name="sex"]:checked').value,
        trestbps: parseFloat(document.getElementById('trestbps').value),
        chol: parseFloat(document.getElementById('chol').value),
        cp_type: document.getElementById('cp_type').value,
        exang: document.querySelector('input[name="exang"]:checked').value,
        oldpeak: parseFloat(document.getElementById('oldpeak').value)
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        // Animasyonu tetiklemek için önce 0'a çek, sonra değere ayarla
        setProgress(0);
        setTimeout(() => {
            setProgress(data.risk_percentage);
        }, 100);

        if (data.is_high_risk) {
            resultLabel.innerText = "Yüksek Risk 🚨";
            resultLabel.style.color = "#dc2626";
            resultRec.innerHTML = `<strong>Kardiyoloji uzmanına başvurun.</strong><br>Yapay zeka analizine göre değerleriniz risk eşiğinin üzerinde.`;
        } else {
            resultLabel.innerText = "Sağlıklı ✅";
            resultLabel.style.color = "#059669";
            resultRec.innerHTML = `<strong>Değerleriniz normal.</strong><br>Sağlıklı yaşam tarzınızı ve düzenli egzersizleri sürdürmeye devam edin.`;
        }

    } catch (error) {
        console.error('Error:', error);
        alert('Sunucuya bağlanılamadı. Lütfen backend servisinin çalıştığından emin olun.');
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
});
