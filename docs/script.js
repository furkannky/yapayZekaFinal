// Backend API URL'si
const API_URL = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") 
    ? "http://localhost:8000/predict" 
    : "https://kalp-analizi-backend.onrender.com/predict"; 

// Form Gönderimi
document.getElementById('clinical-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const btn = document.getElementById('btn-submit');
    const resultScore = document.getElementById('result-score');
    const resultTitle = document.getElementById('result-title');
    const resultDesc = document.getElementById('result-desc');
    const resultBanner = document.getElementById('result-banner');
    
    // UI Loading State
    btn.classList.add('loading');
    btn.disabled = true;

    // Collect 13 Parameters
    const formData = {
        age: parseFloat(document.getElementById('age').value),
        sex: document.getElementById('sex').value,
        trestbps: parseFloat(document.getElementById('trestbps').value),
        chol: parseFloat(document.getElementById('chol').value),
        fbs: document.querySelector('input[name="fbs"]:checked').value,
        cp_type: document.getElementById('cp_type').value,
        restecg: document.getElementById('restecg').value,
        thalch: parseFloat(document.getElementById('thalch').value),
        ca: parseFloat(document.getElementById('ca').value),
        exang: document.querySelector('input[name="exang"]:checked').value,
        oldpeak: parseFloat(document.getElementById('oldpeak').value),
        slope: document.getElementById('slope').value,
        thal: document.getElementById('thal').value
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error('API Hatası');
        }

        const data = await response.json();

        // Sonuçları Ekrana Yazdırma (Ciddi / Kurumsal Tarz)
        resultScore.innerText = `${data.risk_percentage.toFixed(1)}%`;

        if (data.is_high_risk) {
            resultTitle.innerText = "Yüksek Kardiyovasküler Risk Tespit Edildi";
            resultTitle.style.color = "var(--danger-color)";
            resultScore.style.color = "var(--danger-color)";
            resultBanner.style.borderLeftColor = "var(--danger-color)";
            resultDesc.innerText = "Model analizi sonucunda klinik bulgular risk eşiğinin (50%) üzerindedir. Acil kardiyolojik tetkik önerilir.";
        } else {
            resultTitle.innerText = "Düşük Risk / Normal Bulgular";
            resultTitle.style.color = "var(--success-color)";
            resultScore.style.color = "var(--success-color)";
            resultBanner.style.borderLeftColor = "var(--success-color)";
            resultDesc.innerText = "Klinik bulgular normal sınırlar içerisindedir. Rutin kontrollere devam edilmesi önerilir.";
        }

    } catch (error) {
        console.error('Error:', error);
        alert('Sunucuya bağlanılamadı. Lütfen backend servisinin çalıştığından emin olun.');
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
});
