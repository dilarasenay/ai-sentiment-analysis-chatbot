import pandas as pd
import re
from collections import Counter
import os   

#CSV dosyasını okutuyoruz
base_dir = os.path.dirname(os.path.abspath(__file__))
data_path = os.path.join(base_dir, "../../data/raw/food_reviews.csv")
df= pd.read_csv(data_path)

#Stopword'leri tanımlayarak yorumlardan temizliyoruz
stopwords = set(["ve", "veya", "ile", "için", "çünkü", "ama", "fakat", "lakin", "da", "de", "mi", "mu"])

#Fonksiyon tanımlayarak yorumları temizliyoruz
def clean_text(text):
    #Yorumları küçük harfe çeviriyoruz
    text = text.replace('I', 'ı') #Türkçe karakterler için düzeltme yapıyoruz
    text = text.replace('İ', 'i')
    text = text.lower() 

    #Yorumlardaki tekrar eden harfleri temizliyoruz
    text = re.sub(r'(.)\1+', r'\1\1', text)

    #Gürültü karakterlerini temizliyoruz
    text = re.sub(r'[^a-zçğıöşü\s]', ' ', text)

    #Çok boşluk kaldı onları tek boşluk yapıyoruz
    text = text.strip() 

    #Metni kelime listesine çeviriyoruz
    text = text.split()

    #Stopword'leri temizliyoruz
    text = [word for word in text if word not in stopwords]

    #Kelimelerin Bigram olması gerekiyor
    #Bigramların listesini oluşturuyoruz
    ikili_kelimeler = []
    #Yorumdaki kelimeleri bigramlara çeviriyoruz
    for i in range(len(text) - 1):
        ikili = text[i] + "_" + text[i+1]
        ikili_kelimeler.append(ikili)

    text = text + ikili_kelimeler

    return text

#Yorumları temizleyerek yeni bir sütun oluşturuyoruz
df['Cleaned_Sentence'] = df['Sentence'].apply(clean_text)




#Burayla Isı Haritası yapabiliriz.
#Hangi kelimeden kaç tane olduğunu sayarak bir sözlük oluşturuyoruz
tum_kelimeler = []
for liste in df['Cleaned_Sentence']:
    tum_kelimeler.extend(liste)

#En çok geçen 50 kelime
kelime_sayici = Counter(tum_kelimeler)
en_cok_gecenler = kelime_sayici.most_common(50)
#Kontrol
for kelime, sayi in en_cok_gecenler:
    print(f"{kelime}: {sayi}")


#Aspect Analizi
aspect_analizi = {}
unique_aspectler = df['Aspect'].unique()

for aspect in unique_aspectler:
    aspect_kelimeleri = []
    aspect_df = df[df['Aspect'] == aspect]
    
    for liste in aspect_df['Cleaned_Sentence']:
        aspect_kelimeleri.extend(liste)
    
    aspect_sayici = Counter(aspect_kelimeleri)
    aspect_analizi[aspect] = aspect_sayici.most_common(15)



print(df[['Sentence', 'Cleaned_Sentence']].head())

df['Final_Cleaned_Text'] = df['Cleaned_Sentence'].apply(lambda x: " ".join(x))
output_path = os.path.join(base_dir, "../../data/processed/cleaned_food_reviews.csv")
df.to_csv(output_path, index=False)
