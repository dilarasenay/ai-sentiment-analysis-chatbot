import pandas as pd
import re
from collections import Counter
import os


# ⚠️ "ama/fakat/lakin" stopword OLMASIN: bağlaç kuralı için lazım olabilir
STOPWORDS = set([
    "ve", "veya", "ile", "için", "çünkü",
    "da", "de", "mi", "mu"
])

# İstersen bigram üretimini buradan aç/kapa
GENERATE_BIGRAMS = True


def clean_text(text):
    text = str(text)

    # Türkçe I/İ normalizasyonu
    text = text.replace("I", "ı").replace("İ", "i").lower()

    # uzayan harfleri kısalt (çooooook -> çook)
    text = re.sub(r"(.)\1+", r"\1\1", text)

    # harf dışı karakterleri boşluğa çevir (Türkçe karakterler dahil)
    text = re.sub(r"[^a-zçğıöşü\s]", " ", text)

    # fazla boşlukları toparla
    text = re.sub(r"\s+", " ", text).strip()

    tokens = text.split()
    tokens = [w for w in tokens if w not in STOPWORDS]

    if GENERATE_BIGRAMS and len(tokens) >= 2:
        bigrams = [f"{tokens[i]}_{tokens[i+1]}" for i in range(len(tokens) - 1)]
        return tokens + bigrams

    return tokens


def preprocess_text(text: str):
    """Classifier'ın kullanacağı: text -> token list"""
    return clean_text(text)


def main():
    # CSV dosyasını okutuyoruz
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(base_dir, "../../data/raw/food_reviews.csv")
    df = pd.read_csv(data_path)

    # Yorumları temizleyerek yeni bir sütun oluşturuyoruz
    df["Cleaned_Sentence"] = df["Sentence"].apply(clean_text)

    # En çok geçen 50 token (opsiyonel analiz)
    tum_kelimeler = []
    for lst in df["Cleaned_Sentence"]:
        tum_kelimeler.extend(lst)

    kelime_sayici = Counter(tum_kelimeler)
    en_cok_gecenler = kelime_sayici.most_common(50)

    print("\n--- En çok geçen 50 token ---")
    for kelime, sayi in en_cok_gecenler:
        print(f"{kelime}: {sayi}")

    # Aspect analizi (Aspect kolonu varsa)
    if "Aspect" in df.columns:
        aspect_analizi = {}
        unique_aspectler = df["Aspect"].dropna().unique()

        for aspect in unique_aspectler:
            aspect_kelimeleri = []
            aspect_df = df[df["Aspect"] == aspect]

            for lst in aspect_df["Cleaned_Sentence"]:
                aspect_kelimeleri.extend(lst)

            aspect_sayici = Counter(aspect_kelimeleri)
            aspect_analizi[aspect] = aspect_sayici.most_common(15)

        print("\n--- Aspect analizi (ilk 3 aspect) ---")
        for k in list(aspect_analizi.keys())[:3]:
            print(k, "->", aspect_analizi[k])

    print("\n--- Örnek (ilk 5 satır) ---")
    print(df[["Sentence", "Cleaned_Sentence"]].head())

    # Kaydetme
    df["Final_Cleaned_Text"] = df["Cleaned_Sentence"].apply(lambda x: " ".join(x))
    output_path = os.path.join(base_dir, "../../data/processed/cleaned_food_reviews.csv")
    df.to_csv(output_path, index=False)

    print(f"\n✅ Temizlenmiş veri kaydedildi: {output_path}")


if __name__ == "__main__":
    main()