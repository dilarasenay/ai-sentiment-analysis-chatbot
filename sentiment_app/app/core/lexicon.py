import csv
import unicodedata
from pathlib import Path


def norm(tok: str) -> str:
    tok = str(tok)
    tok = unicodedata.normalize("NFKC", tok)
    tok = tok.strip().lower()
    return tok


class LexiconManager:

    def __init__(self, file_path):
        self.lexicon = {}
        self.multipliers_up = {}
        self.multipliers_down = {}
        self.bigrams = {}

        self.load_lexicon(file_path)

    def load_lexicon(self, file_path):

        with open(file_path, mode='r', encoding='utf-8') as f:

            reader = csv.DictReader(f)

            for row in reader:

                word = norm(row.get('word', ''))
                score = float(row.get('score', 0))
                category = row.get('type', '')

                if not word:
                    continue

                # multiplier kelimeleri
                if category == 'multiplier_up':
                    self.multipliers_up[word] = score

                elif category == 'multiplier_down':
                    self.multipliers_down[word] = score

                # BIGRAMLAR
                elif category in ('bigram_negative', 'bigram_positive'):
                    self.bigrams[word] = score

                # normal kelimeler
                else:
                    self.lexicon[word] = score


def load_lexicon():

    base_dir = Path(__file__).resolve().parents[2]

    file_path = base_dir / "data" / "lexicon" / "sentiment_lexicon.csv"

    return LexiconManager(str(file_path))