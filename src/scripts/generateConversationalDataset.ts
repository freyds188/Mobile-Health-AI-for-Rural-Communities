/**
 * Generates a conversational training dataset for the NLP model.
 * Includes user utterances, intents, entities, and expected bot advice responses.
 */
import fs from 'fs';
import path from 'path';

interface Sample {
  input: string;
  intent: string;
  entities?: string[];
  response?: string;
}

const advicePairs: Sample[] = [
  { input: 'What should I do for a headache?', intent: 'treatment_inquiry', entities: ['headache'] },
  { input: 'How can I prevent getting sick?', intent: 'general_health' },
  { input: 'I live in a rural area. Any health tips?', intent: 'preventive_care', entities: ['rural_location'] },
  { input: 'I have fever and cough. Any advice?', intent: 'treatment_inquiry', entities: ['fever', 'cough'] },
  { input: 'I feel anxious and can\'t sleep. What can I do?', intent: 'treatment_inquiry', entities: ['mental_health', 'insomnia'] },
  { input: 'Tell me about ways to stay healthy daily.', intent: 'health_inquiry' },
  { input: 'How to deal with diarrhea at home?', intent: 'treatment_inquiry', entities: ['diarrhea'] },
  { input: 'What are signs that I need urgent care?', intent: 'health_inquiry' },
];

function toCSVLine(values: string[]): string {
  return values
    .map(v => {
      const s = v ?? '';
      const needsQuotes = /[",\n]/.test(s);
      const escaped = s.replace(/"/g, '""');
      return needsQuotes ? `"${escaped}"` : escaped;
    })
    .join(',');
}

function main(): void {
  const outPath = path.join(process.cwd(), 'conversational_training_dataset.csv');
  const header = ['id', 'userId', 'timestamp', 'symptoms', 'severity', 'sleep', 'stress', 'exercise', 'diet', 'notes', 'age', 'gender', 'location', 'medical_history'];
  const lines: string[] = [];
  lines.push(header.join(','));
  const now = new Date().toISOString();

  advicePairs.forEach((s, idx) => {
    const symptomsJson = JSON.stringify(s.entities || []);
    const record = [
      String(1000 + idx),
      'conv_user',
      now,
      symptomsJson,
      '5', // neutral severity default
      '7.0',
      '5',
      '20',
      'balanced',
      s.input,
      '35',
      'female',
      'rural_area',
      'none'
    ];
    lines.push(toCSVLine(record));
  });

  fs.writeFileSync(outPath, lines.join('\n'));
  console.log(`✅ Generated conversational dataset at: ${outPath}`);
}

if (require.main === module) {
  main();
}

export { main as generateConversationalDataset };


