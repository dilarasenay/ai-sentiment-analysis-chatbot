import sys
import os

# Add relevant paths
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "sentiment_app")))

try:
    from app.core.classifier import predict_sentiment
    from app.core.lexicon import load_lexicon
    
    lex_mgr = load_lexicon()
    print("Lexicon loaded.")
    
    test_cases = [
        ("Yemek harika!", "positive"), # Lexicon should catch this
        ("Servis berbattı.", "negative"), # Lexicon should catch this
        ("Midem bulandı, zehirlendik.", "negative"), # Gemini should catch this (lexicon might miss 'zehirlendik' depending on the recent update)
    ]
    
    for text, expected in test_cases:
        label, score, tokens = predict_sentiment(text, lex_mgr)
        print(f"\nText: {text}")
        print(f"Duygu (Label): {label}")
        print(f"Skor (Score): {score}")
        if label == expected or (expected == "negative" and label == "negative"):
            print("✅ TEST PASSED")
        else:
            print(f"❌ TEST FAILED (Expected: {expected}, Got: {label})")
            
except Exception as e:
    print(f"Error occurred: {e}")
    import traceback
    traceback.print_exc()
