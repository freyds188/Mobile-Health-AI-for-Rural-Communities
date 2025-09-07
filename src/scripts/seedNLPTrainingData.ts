/**
 * Seed NLP Training Data
 * Populates AdvancedNLPService with diverse intent/entity examples.
 */

import { advancedNLPService } from '../services/AdvancedNLPService';
import fs from 'fs';
import path from 'path';

// Minimal CSV parser for simple comma-separated lines with numeric severity hints
function simpleCSVParse(content: string): string[] {
  return content.split(/\r?\n/).filter(line => line.trim());
}

async function seedFromCSVIfExists(filePath: string, fieldMap?: { input?: string; intent?: string; entities?: string }): Promise<number> {
  try {
    if (!fs.existsSync(filePath)) return 0;
    const raw = fs.readFileSync(filePath, 'utf-8');
    const lines = simpleCSVParse(raw);
    if (lines.length < 2) return 0;
    const header = lines[0].split(',').map(h => h.trim());
    const idxInput = fieldMap?.input ? header.indexOf(fieldMap.input) : header.indexOf('notes');
    const idxSymptoms = header.indexOf('symptoms');

    let added = 0;
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      const cols = [] as string[];
      let cur = '';
      let inQuotes = false;
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

      const inputText = idxInput >= 0 ? cols[idxInput] : '';
      let entities: string[] = [];
      try {
        if (idxSymptoms >= 0) {
          entities = JSON.parse(cols[idxSymptoms] || '[]');
        }
      } catch {
        entities = [];
      }

      const normalized = inputText && inputText.length > 8 ? inputText : (entities.length > 0 ? `Symptoms: ${entities.join(', ')}` : '');
      if (!normalized) continue;

      await advancedNLPService.addTrainingExample(normalized, 'symptom_report', '', entities);
      added++;
    }
    return added;
  } catch {
    return 0;
  }
}

async function seedNLP(): Promise<void> {
  console.log('🌱 Seeding NLP training data');

  const examples: Array<{ input: string; intent: string; entities?: string[]; response?: string }> = [
    // Symptom report
    { input: 'I have a headache and feel dizzy since yesterday', intent: 'symptom_report', entities: ['headache'] },
    { input: 'My chest hurts and I cannot breathe well', intent: 'symptom_report', entities: ['chest_pain'] },
    { input: 'I am experiencing a cough and fever for a few days', intent: 'symptom_report', entities: ['cough', 'fever'] },
    { input: 'Back pain when I move, started last night', intent: 'symptom_report', entities: ['back_pain'] },
    { input: 'Severe stomach ache after eating', intent: 'symptom_report' },

    // Emergency
    { input: 'This is an emergency I have severe chest pain', intent: 'emergency', entities: ['chest_pain'] },
    { input: 'urgent I cannot breathe and I feel faint', intent: 'emergency' },

    // Duration inquiry
    { input: 'How long does a typical fever last?', intent: 'duration_inquiry' },
    { input: 'Since when should I worry about a cough?', intent: 'duration_inquiry' },

    // Severity inquiry
    { input: 'How bad is a 7 out of 10 pain level?', intent: 'severity_inquiry' },
    { input: 'On a scale of 1 to 10 how severe is this', intent: 'severity_inquiry' },

    // Treatment inquiry
    { input: 'What should I do to treat a headache?', intent: 'treatment_inquiry' },
    { input: 'Medication for cough and fever', intent: 'treatment_inquiry' },

    // Preventive care / general health
    { input: 'How to stay healthy and prevent getting sick?', intent: 'preventive_care' },
    { input: 'General health advice and wellness tips', intent: 'general_health' },

    // Greeting / goodbye
    { input: 'Hello, how are you', intent: 'greeting' },
    { input: 'Thanks bye', intent: 'goodbye' },
  ];

  for (const ex of examples) {
    await advancedNLPService.addTrainingExample(ex.input, ex.intent, ex.response || '', ex.entities || []);
  }

  // Ingest from available CSV datasets (best-effort)
  const root = process.cwd();
  const datasets = [
    path.join(root, 'training_dataset.csv'),
    path.join(root, 'enhanced_training_dataset.csv'),
    path.join(root, 'comprehensive_symptom_dataset.csv'),
    path.join(root, 'rural_health_dataset.csv'),
    path.join(root, 'mental_health_dataset.csv'),
    path.join(root, 'conversational_training_dataset.csv')
  ];

  let totalAdded = examples.length;
  for (const ds of datasets) {
    const added = await seedFromCSVIfExists(ds);
    if (added > 0) {
      console.log(`📥 Ingested ${added} examples from ${path.basename(ds)}`);
      totalAdded += added;
    }
  }

  console.log(`✅ Seeded ${totalAdded} NLP training examples (predefined + datasets)`);
}

if (require.main === module) {
  seedNLP().catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
}

export { seedNLP };


