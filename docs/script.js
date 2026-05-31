const API_URL = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") 
    ? "http://localhost:8000/predict" 
    : "https://kalp-analizi-backend.onrender.com/predict"; 

// Modal Elemanları
const modalOverlay = document.getElementById('result-modal');
const modalTitle = document.getElementById('result-title');
const modalScore = document.getElementById('result-score');
const modalDesc = document.getElementById('result-desc');
const modalIconBg = document.getElementById('modal-icon-bg');
const modalIcon = document.getElementById('modal-icon');

function closeModal() {
    modalOverlay.classList.remove('active');
}

// Form Gönderimi
document.getElementById('clinical-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const btn = document.getElementById('btn-submit');
    
    // Yüklenme Animasyonu
    btn.classList.add('loading');
    btn.disabled = true;

    // 13 Parametreyi Topla
    const formData = {
        age: parseFloat(document.getElementById('age').value),
        sex: document.getElementById('sex').value,
        trestbps: parseFloat(document.getElementById('trestbps').value),
        chol: parseFloat(document.getElementById('chol').value),
        fbs: document.getElementById('fbs').value,
        cp_type: document.getElementById('cp_type').value,
        restecg: document.getElementById('restecg').value,
        thalch: parseFloat(document.getElementById('thalch').value),
        ca: parseFloat(document.getElementById('ca').value),
        exang: document.getElementById('exang').value,
        oldpeak: parseFloat(document.getElementById('oldpeak').value),
        slope: document.getElementById('slope').value,
        thal: document.getElementById('thal').value
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('API Hatası');

        const data = await response.json();

        // Sonuçları Modal'a Yazdırma
        modalScore.innerText = `${data.risk_percentage.toFixed(1)}%`;

        if (data.is_high_risk) {
            modalTitle.innerText = "Yüksek Risk Tespit Edildi";
            modalTitle.style.color = "var(--color-red)";
            modalScore.style.color = "var(--color-red)";
            modalIconBg.className = "icon-circle bg-red-light";
            modalIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />`;
            modalIcon.style.color = "var(--color-red)";
            modalDesc.innerText = "Yapay zeka analizine göre klinik değerleriniz risk eşiğinin üzerindedir. Acil olarak bir kardiyoloji uzmanına görünmeniz tavsiye edilir.";
        } else {
            modalTitle.innerText = "Bulgular Normal / Düşük Risk";
            modalTitle.style.color = "var(--color-green)";
            modalScore.style.color = "var(--color-green)";
            modalIconBg.className = "icon-circle bg-green-light";
            modalIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />`;
            modalIcon.style.color = "var(--color-green)";
            modalDesc.innerText = "Klinik bulgularınız normal sınırlar içerisindedir. Sağlıklı yaşam tarzınıza devam ediniz.";
        }

        // Modal'ı Aç (Pop-up animasyonu)
        modalOverlay.classList.add('active');

    } catch (error) {
        console.error('Error:', error);
        alert('Sunucuya bağlanılamadı. Lütfen backend API servisinin çalıştığından emin olun.');
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
});
