from __future__ import annotations

import unicodedata
from typing import Dict, List, Tuple

from .preprocess import preprocess_text
from .lexicon import load_lexicon

print("✅ RUNNING FILE:", __file__)


def norm(tok: str) -> str:
    tok = str(tok)
    tok = unicodedata.normalize("NFKC", tok)
    tok = tok.strip().lower()
    return tok


DEGIL_WORDS = {norm("değil"), norm("degil")}
HIC_ASLA_WORDS = {norm("hiç"), norm("hic"), norm("asla")}

BUT_WORDS = {norm("ama"), norm("fakat"), norm("lakin"), norm("ancak")}
BUT_WEIGHT = 1.1

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

SCORE_CLIP = 10.0


def apply_rules(
    value: float,
    boost_next: float,
    hic_asla_active: bool,
    hic_asla_strength: float,
    but_active: bool,
) -> Tuple[float, float, bool]:
    value *= boost_next
    boost_next = 1.0

    if hic_asla_active:
        if value > 0:
            value = -abs(value) * hic_asla_strength
        else:
            value *= hic_asla_strength
        hic_asla_active = False

    if but_active:
        value *= BUT_WEIGHT

    return value, boost_next, hic_asla_active


def calculate_score(tokens: List[str], lex_mgr) -> float:
    lexicon: Dict[str, float] = getattr(lex_mgr, "lexicon", {}) or {}
    bigram_lex: Dict[str, float] = getattr(lex_mgr, "bigrams", {}) or {}
    multipliers_up: Dict[str, float] = getattr(lex_mgr, "multipliers_up", {}) or {}
    multipliers_down: Dict[str, float] = getattr(lex_mgr, "multipliers_down", {}) or {}

    lexicon = {norm(k): float(v) for k, v in lexicon.items()}
    bigram_lex = {norm(k): float(v) for k, v in bigram_lex.items()}
    multipliers_up = {norm(k): float(v) for k, v in multipliers_up.items()}
    multipliers_down = {norm(k): float(v) for k, v in multipliers_down.items()}

    uni = [norm(t) for t in tokens if "_" not in str(t)]

    if uni.count("ne") >= 2:
        has_good = any(x in uni for x in ["iyi", "güzel", "guzel", "harika", "mükemmel", "mukemmel"])
        has_bad = any(x in uni for x in ["kötü", "kotu", "berbat", "rezalet", "fena"])
        if has_good and has_bad:
            return 0.0

    score = 0.0
    boost_next = 1.0
    hic_asla_active = False
    hic_asla_strength = 1.4
    but_active = False

    i = 0
    while i < len(uni):
        tok = uni[i]

        if tok in BUT_WORDS:
            but_active = True
            i += 1
            continue

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

        if tok in HIC_ASLA_WORDS:
            hic_asla_active = True
            i += 1
            continue

        # 1) ÖNCE negation pattern: kelime + değil
        if i + 1 < len(uni) and uni[i + 1] in DEGIL_WORDS:
            phrase = norm(f"{tok}_değil")

            if phrase in bigram_lex:
                added = bigram_lex[phrase]
            else:
                base = float(lexicon.get(tok, 0.0))
                if base > 0:
                    added = -abs(base)
                elif base < 0:
                    added = abs(base) * 0.5
                else:
                    added = 0.0

            added, boost_next, hic_asla_active = apply_rules(
                added, boost_next, hic_asla_active, hic_asla_strength, but_active
            )

            score += added
            i += 2
            continue

        # 2) Sonra normal özel bigram
        if i + 1 < len(uni):
            bi = norm(f"{uni[i]}_{uni[i + 1]}")
            if bi in bigram_lex:
                added = bigram_lex[bi]
                added, boost_next, hic_asla_active = apply_rules(
                    added, boost_next, hic_asla_active, hic_asla_strength, but_active
                )
                score += added
                i += 2
                continue

        # 3) Sonra unigram
        base = float(lexicon.get(tok, 0.0))
        if base != 0.0:
            added, boost_next, hic_asla_active = apply_rules(
                base, boost_next, hic_asla_active, hic_asla_strength, but_active
            )
            score += added

        i += 1

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
    return label, score, tokens


def main():
    lex_mgr = load_lexicon()

    print("DEBUG güzel_değil:", lex_mgr.bigrams.get("güzel_değil"))
    print("DEBUG iyi_değil:", lex_mgr.bigrams.get("iyi_değil"))
    print("DEBUG kötü_değil:", lex_mgr.bigrams.get("kötü_değil"))
    print("DEBUG fena_değil:", lex_mgr.bigrams.get("fena_değil"))

    examples = [
        "Yemek çok güzel ama servis rezalet.",
        "Manzara harika değil, hiç beğenmedim.",
        "Fiyatlar oldukça yüksek ama lezzet mükemmel.",
        "İyi değil, asla tavsiye etmem.",
        "Kötü değil aslında fena değil.",
        "Güzel değil.",
        "Güzel değildi.",
        "Harika değil.",
        "Kötü değil.",
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