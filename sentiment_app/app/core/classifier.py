from __future__ import annotations

import unicodedata
from typing import Dict, List, Tuple

from .preprocess import preprocess_text
from .lexicon import load_lexicon

import google.generativeai as genai

# API anahtarını buraya giriyorsun
GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE"
genai.configure(api_key=GEMINI_API_KEY)

# Hızlı ve ucuz olan flash modelini seçiyoruz
model = genai.GenerativeModel('gemini-2.5-flash')

def get_llm_sentiment(text: str) -> str:
    """
    Sadece Lexicon 'nötr' kaldığında devreye giren Gemini kurtarıcısı.
    """
    prompt = f"""
    Sen uzman bir gıda gurmesi ve duygu analistisin. 
    Aşağıdaki müşteri yorumunun duygusunu analiz et. 
    Cevabın SADECE şu üç kelimeden biri olmak ZORUNDADIR: 'positive', 'negative', veya 'neutral'.
    Açıklama yapma, nokta koyma.
    
    Müşteri Yorumu: "{text}"
    """
    
    try:
        response = model.generate_content(prompt)
        # Gelen cevabı küçük harfe çevirip etrafındaki boşlukları siliyoruz (garanti olsun diye)
        llm_karari = response.text.strip().lower()
        
        # Eğer model kafasına göre başka bir şey yazdıysa güvenliğe al
        if llm_karari in ['positive', 'negative']:
            return llm_karari
        else:
            return 'neutral'
            
    except Exception as e:
        # İnternet koparsa veya API limiti dolarsa sistem çökmesin, nötr dönsün
        print(f"Gemini API Hatası: {e}")
        return 'neutral'

print("✅ RUNNING FILE:", __file__)


def norm(tok: str) -> str:
    tok = str(tok)
    tok = unicodedata.normalize("NFKC", tok)
    tok = tok.strip().lower()
    return tok


# Negation / emphasis words
DEGIL_WORDS = {norm("değil"), norm("degil")}
HIC_ASLA_WORDS = {norm("hiç"), norm("hic"), norm("asla")}

# "ama" bağlaçları (stopword değil!)
BUT_WORDS = {norm("ama"), norm("fakat"), norm("lakin"), norm("ancak")}
BUT_WEIGHT = 1.4  # ama sonrası ağırlık (1.2–1.8 arası deneyebilirsin)

# Ek intensifier katmanı
INTENSIFIERS = {
    norm("çok"): 1.5,
    norm("cok"): 1.5,
    norm("aşırı"): 1.8,
    norm("asiri"): 1.8,
    norm("fazla"): 1.3,
    norm("oldukça"): 1.3,
    norm("oldukca"): 1.3,
    norm("pek"): 0.5,
    norm("biraz"): 0.6,
}

# Skor sınırı (UI/rapor için stabil)
SCORE_CLIP = 10.0


def calculate_score(tokens: List[str], lex_mgr) -> float:
    """
    Skor hesaplama:
    - Bigramlar öncelikli (harika_değil, fena_değil, tavsiye_etmem vb.) ve consume edilir (double-count yok).
    - "hiç/asla" negatifi güçlendirir:
        * pozitif katkıyı negatife çevirip güçlendirir
        * negatif katkıyı daha da negatif yapar
    - "ama/fakat/lakin/ancak" sonrası katkılar BUT_WEIGHT ile çarpılır.
    - "ne ... ne ..." (örn: ne iyi ne kötü) -> neutral (score=0)
    - Skor en sonda [-SCORE_CLIP, +SCORE_CLIP] aralığına kırpılır.
    """

    lexicon: Dict[str, float] = getattr(lex_mgr, "lexicon", {}) or {}
    bigram_lex: Dict[str, float] = getattr(lex_mgr, "bigrams", {}) or {}
    multipliers_up: Dict[str, float] = getattr(lex_mgr, "multipliers_up", {}) or {}
    multipliers_down: Dict[str, float] = getattr(lex_mgr, "multipliers_down", {}) or {}

    # normalize keys
    lexicon = {norm(k): float(v) for k, v in lexicon.items()}
    bigram_lex = {norm(k): float(v) for k, v in bigram_lex.items()}
    multipliers_up = {norm(k): float(v) for k, v in multipliers_up.items()}
    multipliers_down = {norm(k): float(v) for k, v in multipliers_down.items()}

    # unigram akışı
    uni = [norm(t) for t in tokens if "_" not in str(t)]

    # --- "ne ... ne ..." kalıbı (örn: ne iyi ne kötü) -> neutral ---
    if uni.count("ne") >= 2:
        has_good = "iyi" in uni
        has_bad = ("kötü" in uni) or ("kotu" in uni)
        if has_good and has_bad:
            return 0.0

    score = 0.0
    boost_next = 1.0

    hic_asla_active = False
    hic_asla_strength = 1.4  # 1.3–1.6 arası iyi

    but_active = False

    i = 0
    while i < len(uni):
        tok = uni[i]

        # BIGRAM FIRST (consume) - Fix: check before unigram multipliers
        if i + 1 < len(uni):
            bi = norm(f"{uni[i]}_{uni[i+1]}")
            bi_score = float(bigram_lex.get(bi, 0.0))
            if bi_score != 0.0:
                added = bi_score * boost_next
                boost_next = 1.0

                if hic_asla_active:
                    # pozitif -> negatif + güç, negatif -> daha negatif
                    if added > 0:
                        added = -abs(added) * hic_asla_strength
                    else:
                        added = added * hic_asla_strength
                    hic_asla_active = False

                if but_active:
                    added *= BUT_WEIGHT

                score += added
                i += 2
                continue

        # "ama/fakat" sonrası ağırlık
        if tok in BUT_WORDS:
            but_active = True
            i += 1
            continue

        # multiplier/intensifier
        if tok in multipliers_up:
            boost_next *= multipliers_up[tok]
            i += 1
            continue
        if tok in multipliers_down:
            boost_next *= multipliers_down[tok]
            i += 1
            continue
        if tok in INTENSIFIERS:
            boost_next *= INTENSIFIERS[tok]
            i += 1
            continue

        # hiç/asla => negatifi güçlendir
        if tok in HIC_ASLA_WORDS:
            hic_asla_active = True
            i += 1
            continue

        # unigram "değil" (bigram yakalanmadıysa nötr geç)
        if tok in DEGIL_WORDS:
            i += 1
            continue

        base = float(lexicon.get(tok, 0.0))
        if base != 0.0:
            added = base * boost_next
            boost_next = 1.0

            if hic_asla_active:
                if added > 0:
                    added = -abs(added) * hic_asla_strength
                else:
                    added = added * hic_asla_strength
                hic_asla_active = False

            if but_active:
                added *= BUT_WEIGHT

            score += added

        i += 1

    # score'u uçmasın diye kırp
    if SCORE_CLIP is not None:
        score = max(-SCORE_CLIP, min(SCORE_CLIP, score))

    return score


def classify(score: float, pos_threshold: float = 1.0, neg_threshold: float = -1.0) -> str:
    if score >= pos_threshold:
        return "positive"
    if score <= neg_threshold:
        return "negative"
    return "neutral"


def predict_sentiment(text: str, lex_mgr) -> Tuple[str, float, List[str]]:
    tokens = preprocess_text(text)
    score = calculate_score(tokens, lex_mgr)
    label = classify(score)
    
    # LLM Fallback: If lexicon is neutral, ask Gemini
    if label == "neutral":
        print(f"Lexicon nötr kaldı, Gemini'a soruluyor: {text}")
        llm_label = get_llm_sentiment(text)
        if llm_label != "neutral":
            label = llm_label
            # Assign a representative score for the UI if Gemini detects emotion
            score = 5.0 if label == "positive" else -5.0
            
    return label, score, tokens

def main():
    lex_mgr = load_lexicon()

    examples = [
        "Yemek çok güzel ama servis rezalet.",
        "Manzara harika değil, hiç beğenmedim.",
        "Fiyatlar oldukça yüksek ama lezzet mükemmel.",
        "İyi değil, asla tavsiye etmem.",
        "Kötü değil aslında fena değil.",
        "Ortalama, idare eder.",
        "Ne iyi ne kötü.",
        "Ne harika ne berbat.",
    ]

    for text in examples:
        label, score, tokens = predict_sentiment(text, lex_mgr)
        print("\nYorum:", text)
        print("Skor:", score)
        print("Duygu:", label)
        print("Tokens:", tokens[:30], "..." if len(tokens) > 30 else "")


if __name__ == "__main__":
    main()