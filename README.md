# 🤖 AI Sentiment Analysis Chatbot

Kullanıcı yorumlarını pozitif, negatif veya nötr olarak sınıflandıran Python uygulaması.

---

### :white_check_mark: Yapılması Gerekenler

- [x] **Metin ön işleme:** Ham metin verilerinin temizlenmesi ve analize hazır hale getirilmesi.
- [x] **Duygu sözlüğü oluşturma:** Kelimelerin duygu değerlerini içeren kapsamlı bir sözlük yapısı.
- [x] **Sınıflandırma mantığı:** Kural tabanlı ve sözlük destekli duygu analizi algoritması.
- [x] **Test ve değerlendirme:** Sistemin doğruluğunu ölçmek için kapsamlı test süreçleri.

---

### :groups: Ekip ve Sorumluluklar

#### **Eren** — *NLP & Preprocessing Sorumlusu*
- **Görevler:** Küçük harfe çevirme, noktalama temizleme, stopword çıkarma (Türkçe), Tokenization.
- **Odak:** Fonksiyonları modüler yazma ve test metinleri hazırlama.
- **Teslimler:** `preprocessing.py`, Temizlenmiş örnek veri çıktısı.

#### **Batuhan** — *Duygu Sözlüğü & Skorlama Sorumlusu*
- **Görevler:** Pozitif/Negatif kelime listeleri, skor bazlı dictionary yapısı.
- **İyileştirme:** Yoğunluk kelimeleri (çok, aşırı vs.) entegrasyonu.
- **Teslimler:** `sentiment_lexicon.py`, CSV formatında duygu sözlüğü dosyası.

#### **Dilara** — *Sınıflandırma Mantığı & Model Sorumlusu*
- **Görevler:** Skor toplama algoritması, Pozitif/Negatif/Nötr karar mekanizması.
- **Bonus:** Basit accuracy hesaplama ve ML versiyon ekleme opsiyonu.
- **Teslimler:** `classifier.py`, Test sonuç çıktıları.

#### **Ahmet** — *Test & Evaluation Sorumlusu*
- **Görevler:** 50–100 test yorumu oluşturma, manuel etiketleme.
- **Analiz:** Accuracy hesaplama, Confusion matrix, hata analizi.
- **Teslimler:** `evaluation.py`, Sonuç raporu.

#### **Sude** — *Arayüz & Chatbot Entegrasyon Sorumlusu*
- **Görevler:** Streamlit/CLI arayüzü, kullanıcıdan input alma, sonuç gösterimi.
- **Final:** UI düzenleme ve README yönetimi.
- **Teslimler:** `app.py`, Çalışır demo.

---

### :clipboard: Görevler & Tahmini Süreler

1. **Metin Ön İşleme** (:stopwatch: ~6h)
2. **Duygu Sözlüğü** (:stopwatch: ~6h)
3. **Sınıflandırma Mantığı** (:stopwatch: ~8h)
4. **Test & Değerlendirme** (:stopwatch: ~4h)
5. **Kullanıcı Girdi Arayüzü** (:stopwatch: ~12h)

---

### 🚀 Teknoloji Yığını

#### **Backend**
- **Dil:** Python | **Framework:** Flask
- **NLP:** NLTK, Pandas, Numpy
- **Test:** Pytest, Scikit-learn (eval)

#### **Frontend**
- **Framework:** Next.js (React) | **Styling:** Tailwind CSS
- **Icons:** Lucide-React | **Charts:** Recharts

---

### :pushpin: Proje Bilgileri
- **Zorluk:** Beginner | **Tema:** :robot_face: AI Chatbot

---

### 🛠️ Kurulum ve Çalıştırma

#### 1. Backend Hazırlığı
```bash
cd sentiment_app
pip install -r requirements.txt
python -m flask run
```

#### 2. Frontend Hazırlığı
```bash
cd frontend
npm install
npm run dev
```

---

*Bu proje, doğal dil işleme temellerini öğrenmek ve uygulamak amacıyla geliştirilmiştir.*
