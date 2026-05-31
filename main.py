from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, Conv1D, BatchNormalization, Activation, Dense, Dropout, GlobalAveragePooling1D, Multiply
import os
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Kalp Sağlığı Risk Analizi API")

# CORS (Cross-Origin Resource Sharing) Ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # GitHub Pages ve diğer tüm alan adlarından gelen isteklere izin verir
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Sabitlik ayarları
np.random.seed(42)
tf.random.set_seed(42)

# Global değişkenler
web_model = None
scaler = None
X_columns = None
X_mean_values = None

def init_model():
    global web_model, scaler, X_columns, X_mean_values
    print("Sistem yükleniyor, lütfen bekleyin...")
    
    # 2. Veriyi arka planda okuyup modeli ayağa kaldırıyoruz
    base_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(base_dir, 'heart_disease_uci.csv')
    try:
        df = pd.read_csv(csv_path)
    except FileNotFoundError:
        df = pd.read_csv(os.path.join(base_dir, 'heart.csv'))

    df['target'] = df['num'].apply(lambda x: 1 if x > 0 else 0)
    df = df.drop(['id', 'dataset', 'num'], axis=1, errors='ignore')
    df_encoded = pd.get_dummies(df, drop_first=True)
    df_encoded = df_encoded.fillna(df_encoded.mean())

    X = df_encoded.drop('target', axis=1)
    y = df_encoded['target']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    # X_test_scaled = scaler.transform(X_test)
    X_columns = X.columns
    X_mean_values = X.mean()

    X_train_cnn = np.expand_dims(X_train_scaled, axis=-1)

    def build_website_model(input_shape):
        inputs = Input(shape=input_shape)
        x = Conv1D(filters=32, kernel_size=3, padding='same')(inputs)
        x = BatchNormalization()(x)
        x = Activation('relu')(x)
        x = Dropout(0.2)(x)
        
        attention_weights = Dense(32, activation='softmax')(x)
        attention_out = Multiply()([x, attention_weights])
        
        x = GlobalAveragePooling1D()(attention_out)
        x = Dense(16, activation='relu')(x)
        outputs = Dense(1, activation='sigmoid')(x)
        
        model = Model(inputs=inputs, outputs=outputs)
        model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
        return model

    web_model = build_website_model((X_train_cnn.shape[1], 1))
    web_model.fit(X_train_cnn, y_train, epochs=20, batch_size=16, verbose=0)
    print("Model eğitimi tamamlandı ve API hazır.")

init_model()

# (Statik dosyalar artık GitHub Pages'dan sunulacağı için StaticFiles kaldırıldı)

class PredictionRequest(BaseModel):
    age: float
    sex: str
    trestbps: float
    chol: float
    fbs: str
    restecg: str
    thalch: float
    exang: str
    oldpeak: float
    slope: str
    ca: float
    thal: str
    cp_type: str

@app.post("/predict")
def predict_risk(data: PredictionRequest):
    # Kullanıcının girmediği değerleri (örn: max nabız, damar sayısı vb.) ortalama değerlerle dolduruyoruz
    # Böylece scaler bunları "0" (nötr) etkiye dönüştürür ve sonucu bozmaz.
    user_row = pd.DataFrame([X_mean_values.values], columns=X_columns)
    
    user_row['age'] = data.age
    user_row['trestbps'] = data.trestbps
    user_row['chol'] = data.chol
    user_row['thalch'] = data.thalch
    user_row['oldpeak'] = data.oldpeak
    user_row['ca'] = data.ca
    
    # Cinsiyet kontrolü
    if data.sex == "Erkek (Male)":
        if 'sex_Male' in user_row.columns: user_row['sex_Male'] = 1
        
    # Egzersize bağlı anjin kontrolü
    if data.exang == "Evet (Yes)":
        if 'exang_True' in user_row.columns: user_row['exang_True'] = 1

    # Açlık kan şekeri
    if data.fbs == "Evet (>120 mg/dl)":
        if 'fbs_True' in user_row.columns: user_row['fbs_True'] = 1
        
    # Göğüs ağrısı tipi kontrolü
    if data.cp_type == "Atipik Anjin (Atypical Angina)":
        if 'cp_atypical angina' in user_row.columns: user_row['cp_atypical angina'] = 1
    elif data.cp_type == "Anjin Olmayan Ağrı (Non-anginal)":
        if 'cp_non-anginal' in user_row.columns: user_row['cp_non-anginal'] = 1
    elif data.cp_type == "Tipik Anjin (Typical Angina)":
        if 'cp_typical angina' in user_row.columns: user_row['cp_typical angina'] = 1

    # Dinlenme EKG
    if data.restecg == "Normal":
        if 'restecg_normal' in user_row.columns: user_row['restecg_normal'] = 1
    elif data.restecg == "ST-T Anormalliği":
        if 'restecg_st-t abnormality' in user_row.columns: user_row['restecg_st-t abnormality'] = 1

    # ST Segment Eğimi
    if data.slope == "Düz (Flat)":
        if 'slope_flat' in user_row.columns: user_row['slope_flat'] = 1
    elif data.slope == "Yukarı Eğimli (Upsloping)":
        if 'slope_upsloping' in user_row.columns: user_row['slope_upsloping'] = 1

    # Talasemi
    if data.thal == "Normal":
        if 'thal_normal' in user_row.columns: user_row['thal_normal'] = 1
    elif data.thal == "Geri Döndürülebilir Hata (Reversable Defect)":
        if 'thal_reversable defect' in user_row.columns: user_row['thal_reversable defect'] = 1

    user_scaled = scaler.transform(user_row)
    user_cnn = np.expand_dims(user_scaled, axis=-1)
    
    olasilik = float(web_model.predict(user_cnn, verbose=0)[0][0])
    yuzde = olasilik * 100
    
    is_high_risk = olasilik > 0.5
    
    return {
        "risk_percentage": round(yuzde, 2),
        "is_high_risk": is_high_risk,
        "message": "🚨 TAHMİN SONUCU: KALP HASTALIĞI RİSKİ YÜKSEK!" if is_high_risk else "✅ TAHMİN SONUCU: RİSK DÜŞÜK / SAĞLIKLI"
    }

@app.get("/")
def read_root():
    return {"message": "Kalp Sağlığı Arka Uç API'si Çalışıyor. Lütfen ön yüz için GitHub Pages adresine gidin."}
