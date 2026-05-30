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
    } else {
        patientLabel.classList.add('active');
        doctorLabel.classList.remove('active');
    }

    // Label Güncellemeleri
    document.querySelectorAll('.dynamic-label').forEach(label => {
        const hasInfo = label.classList.contains('has-tooltip');
        label.innerHTML = isDoctor ? label.getAttribute('data-doctor') : label.getAttribute('data-patient') + (hasInfo && !isDoctor ? ' ℹ️' : '');
    });

    // Select Option Güncellemeleri
    document.querySelectorAll('.dyn-opt').forEach(opt => {
        opt.innerHTML = isDoctor ? opt.getAttribute('data-doctor') : opt.getAttribute('data-patient');
    });
});

// Sayfa yüklendiğinde varsayılan modu (Hasta Modu) aktifleştir
modeSwitch.dispatchEvent(new Event('change'));
// -----------------------------------

// --- Akordeon Mantığı ---
document.querySelectorAll('.accordion-header').forEach(button => {
    button.addEventListener('click', () => {
        const accordionItem = button.parentElement;
        const content = button.nextElementSibling;
        
        // Diğerlerini kapat (Opsiyonel)
        document.querySelectorAll('.accordion-item').forEach(item => {
            if(item !== accordionItem) {
                item.classList.remove('active');
                item.querySelector('.accordion-content').style.maxHeight = null;
            }
        });

        accordionItem.classList.toggle('active');
        if (accordionItem.classList.contains('active')) {
            content.style.maxHeight = content.scrollHeight + "px";
        } else {
            content.style.maxHeight = null;
        }
    });
});
// ------------------------

// --- Hız Göstergesi (Gauge) Mantığı ---
function setGaugeValue(percentage) {
    const gaugeFill = document.getElementById('gauge-fill');
    const gaugeText = document.getElementById('gauge-text');
    
    // 0 ile 0.5 turn arası dönüş
    const turn = percentage / 200; 
    gaugeFill.style.transform = `rotate(${turn}turn)`;
    gaugeText.innerText = `${percentage.toFixed(1)}%`;

    // Renk Ayarı
    if (percentage <= 20) {
        gaugeFill.style.backgroundColor = 'var(--success)';
        gaugeText.style.color = 'var(--success)';
    } else if (percentage <= 50) {
        gaugeFill.style.backgroundColor = 'var(--warning)';
        gaugeText.style.color = 'var(--warning)';
    } else {
        gaugeFill.style.backgroundColor = 'var(--danger)';
        gaugeText.style.color = 'var(--danger)';
    }
}
// --------------------------------------

// Form Gönderimi
document.getElementById('prediction-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const btn = document.querySelector('.btn-primary');
    const resultBox = document.getElementById('result-box');
    const resultTitle = document.getElementById('result-title');
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

        // UI Güncelleme
        resultBox.classList.remove('placeholder');
        
        // Animasyonu tetiklemek için önce 0'a çek, sonra değere ayarla
        setGaugeValue(0);
        setTimeout(() => {
            setGaugeValue(data.risk_percentage);
        }, 100);

        if (data.is_high_risk) {
            resultTitle.innerText = "YÜKSEK RİSK";
            resultTitle.className = "result-title danger-text";
            resultRec.innerHTML = `<strong>Yapay Zeka Risk Skoru Yüksek!</strong><br>En yakın zamanda bir kardiyoloji uzmanına başvurulması tavsiye edilir. Lütfen ihmal etmeyin.`;
        } else {
            resultTitle.innerText = "DÜŞÜK RİSK / SAĞLIKLI";
            resultTitle.className = "result-title success-text";
            resultRec.innerHTML = `<strong>Yapay Zeka Risk Skoru Düşük.</strong><br>Sağlıklı yaşam tarzınızı ve düzenli egzersizleri sürdürmeye devam edin.`;
        }

    } catch (error) {
        console.error('Error:', error);
        alert('Sunucuya bağlanılamadı. Lütfen backend servisinin çalıştığından emin olun.');
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
});
