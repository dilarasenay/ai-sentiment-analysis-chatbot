#Pozitif ve negatif kelime sözlüğünü yükler
import csv

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
                word = row['word'].lower()
                score = float(row['score'])
                category = row['type']
                
                if category == 'multiplier_up':
                    self.multipliers_up[word] = score
                elif category == 'multiplier_down':
                    self.multipliers_down[word] = score
                elif category == 'bigram_negative':
                    self.bigrams[word] = score
                else:
                    self.lexicon[word] = score