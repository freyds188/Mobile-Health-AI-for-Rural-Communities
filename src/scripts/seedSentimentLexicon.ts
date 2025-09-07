/**
 * Seed a sentiment lexicon into AdvancedNLPService from sentiment_training_dataset.csv
 * The lexicon will improve analyzeSentiment by weighting words by learned polarity.
 */
import fs from 'fs';
import path from 'path';
import { advancedNLPService } from '../services/AdvancedNLPService';

interface Row { text: string; label: 'negative' | 'neutral' | 'positive'; domain: string }

function parseCSV(filePath: string): Row[] {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const header = lines[0].split(',');
  const idxText = header.indexOf('text');
  const idxLabel = header.indexOf('label');
  const idxDomain = header.indexOf('domain');
  const rows: Row[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = [] as string[];
    let cur = '';
    let inQuotes = false;
    const row = lines[i];
    for (let j = 0; j < row.length; j++) {
      const ch = row[j];
      if (ch === '"') {
        if (inQuotes && j + 1 < row.length && row[j + 1] === '"') {
          cur += '"';
          j++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        cols.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    cols.push(cur);
    const text = idxText >= 0 ? cols[idxText] : '';
    const label = (idxLabel >= 0 ? cols[idxLabel] : 'neutral') as Row['label'];
    const domain = idxDomain >= 0 ? cols[idxDomain] : 'general';
    if (text) rows.push({ text, label, domain });
  }
  return rows;
}

function tokenize(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

async function seedLexicon(): Promise<void> {
  const filePath = path.join(process.cwd(), 'sentiment_training_dataset.csv');
  const rows = parseCSV(filePath);
  if (rows.length === 0) {
    console.log('⚠️ No sentiment dataset found; run generate:sentiment-dataset first.');
    return;
  }

  const wordScores: Record<string, { pos: number; neg: number; total: number }> = {};
  for (const r of rows) {
    const tokens = tokenize(r.text);
    const weight = r.label === 'positive' ? 1 : r.label === 'negative' ? -1 : 0;
    for (const t of tokens) {
      if (!wordScores[t]) wordScores[t] = { pos: 0, neg: 0, total: 0 };
      if (weight > 0) wordScores[t].pos += 1;
      if (weight < 0) wordScores[t].neg += 1;
      wordScores[t].total += 1;
    }
  }

  // Build lexicon with polarity score in [-1, 1]
  const lexicon: Record<string, number> = {};
  for (const [word, stats] of Object.entries(wordScores)) {
    if (stats.total < 2) continue; // skip rare words
    const score = (stats.pos - stats.neg) / stats.total; // -1..1
    if (Math.abs(score) < 0.2) continue; // keep stronger signals only
    lexicon[word] = score;
  }

  // Inject into model and persist
  // @ts-ignore - augment private for seeding purpose only
  if (!(advancedNLPService as any).model) {
    // force model load
    await (advancedNLPService as any).loadModel?.();
  }
  // Store under model.wordVectors as sentimentLexicon to avoid new schema files
  // @ts-ignore - safe internal augmentation
  const model = (advancedNLPService as any).model;
  model.wordVectors = model.wordVectors || {};
  (model.wordVectors as any).sentimentLexicon = lexicon;
  if ((advancedNLPService as any).saveModel) {
    await (advancedNLPService as any).saveModel();
  }
  console.log(`✅ Seeded sentiment lexicon with ${Object.keys(lexicon).length} entries`);
}

if (require.main === module) {
  seedLexicon().catch((e) => {
    console.error('Seeding sentiment lexicon failed:', e);
    process.exit(1);
  });
}

export { seedLexicon };


