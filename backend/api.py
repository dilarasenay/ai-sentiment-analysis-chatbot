import sys
import os
from flask import Flask, request, jsonify
from flask_cors import CORS

# Add the parent directory and sentiment_app to sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.append(BASE_DIR)
sys.path.append(os.path.join(BASE_DIR, "sentiment_app"))

from app.core.classifier import predict_sentiment
from app.core.lexicon import load_lexicon

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load lexicon once at startup
lex_mgr = load_lexicon()

def get_sentiment_breakdown(text, lex_mgr):
    from app.core.preprocess import preprocess_text
    from app.core.classifier import norm, BUT_WORDS, BUT_WEIGHT, HIC_ASLA_WORDS, INTENSIFIERS
    
    tokens = preprocess_text(text)
    lexicon = {norm(k): float(v) for k, v in getattr(lex_mgr, "lexicon", {}).items()}
    bigram_lex = {norm(k): float(v) for k, v in getattr(lex_mgr, "bigrams", {}).items()}
    multipliers_up = {norm(k): float(v) for k, v in getattr(lex_mgr, "multipliers_up", {}).items()}
    multipliers_down = {norm(k): float(v) for k, v in getattr(lex_mgr, "multipliers_down", {}).items()}
    
    uni = [norm(t) for t in tokens if "_" not in str(t)]
    breakdown = []
    
    score = 0.0
    boost_next = 1.0
    hic_asla_active = False
    hic_asla_strength = 1.4
    but_active = False
    
    i = 0
    while i < len(uni):
        tok = uni[i]
        item = {"token": tok, "contribution": 0, "type": "neutral", "rule": None}
        
        # Bigram check FIRST
        found_bigram = False
        if i + 1 < len(uni):
            bi = norm(f"{uni[i]}_{uni[i+1]}")
            if bi in bigram_lex:
                base = bigram_lex[bi]
                added = base * boost_next
                if hic_asla_active:
                    added = -abs(added) * hic_asla_strength if added > 0 else added * hic_asla_strength
                if but_active: added *= BUT_WEIGHT
                
                breakdown.append({
                    "token": bi,
                    "contribution": round(added, 2),
                    "type": "positive" if added > 0 else "negative",
                    "rule": "Bigram"
                })
                score += added
                boost_next = 1.0
                hic_asla_active = False
                i += 2
                found_bigram = True
                continue
        
        if tok in BUT_WORDS:
            but_active = True
            item["type"] = "rule"
            item["rule"] = f"Ama/Fakat (Ağırlık: {BUT_WEIGHT})"
            breakdown.append(item)
            i += 1
            continue
            
        if tok in multipliers_up or tok in multipliers_down or tok in INTENSIFIERS:
            val = multipliers_up.get(tok) or multipliers_down.get(tok) or INTENSIFIERS.get(tok)
            boost_next *= val
            item["type"] = "multiplier"
            item["rule"] = f"Vurgu (x{val})"
            breakdown.append(item)
            i += 1
            continue
            
        if tok in HIC_ASLA_WORDS:
            hic_asla_active = True
            item["type"] = "rule"
            item["rule"] = "Negatif Güçlendirici (Hiç/Asla)"
            breakdown.append(item)
            i += 1
            continue
            
        base = lexicon.get(tok, 0.0)
        if base != 0.0:
            added = base * boost_next
            if hic_asla_active:
                added = -abs(added) * hic_asla_strength if added > 0 else added * hic_asla_strength
            if but_active: added *= BUT_WEIGHT
            
            item["contribution"] = round(added, 2)
            item["type"] = "positive" if added > 0 else "negative"
            score += added
            boost_next = 1.0
            hic_asla_active = False
        
        breakdown.append(item)
        i += 1
            
    return breakdown

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    if not data or "text" not in data:
        return jsonify({"error": "No text provided"}), 400
    
    text = data["text"]
    label, score, tokens = predict_sentiment(text, lex_mgr)
    breakdown = get_sentiment_breakdown(text, lex_mgr)
    
    return jsonify({
        "text": text,
        "sentiment": label,
        "score": score,
        "tokens": tokens,
        "breakdown": breakdown
    })

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(port=5000, debug=False)
