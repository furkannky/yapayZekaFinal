// Backend API URL'si - Canlıda ve lokalde dinamik çalışır
const API_URL = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") 
    ? "http://localhost:8000/predict" 
    : "https://kalp-analizi-backend.onrender.com/predict"; // Render URL'sini buraya yazın

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

    document.querySelectorAll('.dynamic-label').forEach(label => {
        const hasInfo = label.classList.contains('has-tooltip');
        label.innerHTML = isDoctor ? label.getAttribute('data-doctor') : label.getAttribute('data-patient') + (hasInfo && !isDoctor ? ' ℹ️' : '');
    });

    document.querySelectorAll('.dyn-opt').forEach(opt => {
        opt.innerHTML = isDoctor ? opt.getAttribute('data-doctor') : opt.getAttribute('data-patient');
    });
});

// Sayfa yüklendiğinde varsayılan modu (Hasta Modu) aktifleştir
modeSwitch.dispatchEvent(new Event('change'));
// -----------------------------------

document.getElementById('prediction-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const btn = document.querySelector('.btn-primary');
    const resultBox = document.getElementById('result-box');
    
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

        // Animate result out before showing new
        resultBox.style.opacity = '0';
        resultBox.style.transform = 'scale(0.95)';

        setTimeout(() => {
            resultBox.classList.remove('placeholder', 'success', 'danger');
            
            if (data.is_high_risk) {
                resultBox.classList.add('danger');
                resultBox.innerHTML = `
                    <div class="result-icon">🚨</div>
                    <div class="result-title">YÜKSEK RİSK</div>
                    <div class="risk-score">%${data.risk_percentage}</div>
                    <div class="recommendation">
                        <strong>Yapay Zeka Risk Skoru Yüksek!</strong><br><br>
                        En yakın zamanda bir kardiyoloji uzmanına başvurulması tavsiye edilir. Lütfen ihmal etmeyin.
                    </div>
                `;
            } else {
                resultBox.classList.add('success');
                resultBox.innerHTML = `
                    <div class="result-icon">✅</div>
                    <div class="result-title">DÜŞÜK RİSK / SAĞLIKLI</div>
                    <div class="risk-score">%${data.risk_percentage}</div>
                    <div class="recommendation">
                        <strong>Yapay Zeka Risk Skoru Düşük.</strong><br><br>
                        Sağlıklı yaşam tarzınızı ve düzenli egzersizleri sürdürmeye devam edin.
                    </div>
                `;
            }

            // Animate result in
            requestAnimationFrame(() => {
                resultBox.style.opacity = '1';
                resultBox.style.transform = 'scale(1)';
            });

        }, 300); // Wait for fade out

    } catch (error) {
        console.error('Error:', error);
        alert('Sunucuya bağlanılamadı. Lütfen backend servisinin çalıştığından emin olun.');
    } finally {
        // Reset UI Loading State
        btn.classList.remove('loading');
        btn.disabled = false;
    }
});
