/**
 * Generate a labeled sentiment dataset tailored for health, rural, and mental health contexts.
 * Output CSV schema: text,label,domain
 * - label in {negative, neutral, positive}
 * - domain in {general, rural, mental}
 */
import fs from 'fs';
import path from 'path';

type SentimentLabel = 'negative' | 'neutral' | 'positive';
type Domain = 'general' | 'rural' | 'mental';

interface Sample {
  text: string;
  label: SentimentLabel;
  domain: Domain;
}

function toCSVLine(values: string[]): string {
  return values
    .map((v) => {
      const s = v ?? '';
      const needsQuotes = /[",\n]/.test(s);
      const escaped = s.replace(/"/g, '""');
      return needsQuotes ? `"${escaped}"` : escaped;
    })
    .join(',');
}

function buildDataset(): Sample[] {
  const general: Sample[] = [
    { text: 'I feel terrible and the pain is getting worse', label: 'negative', domain: 'general' },
    { text: 'My headache is really bad and I am scared', label: 'negative', domain: 'general' },
    { text: 'I am worried about these symptoms', label: 'negative', domain: 'general' },
    { text: 'It is manageable but still uncomfortable', label: 'neutral', domain: 'general' },
    { text: 'Symptoms are okay today and a bit improved', label: 'positive', domain: 'general' },
    { text: 'Feeling better after some rest', label: 'positive', domain: 'general' },
  ];

  const rural: Sample[] = [
    { text: 'We are far from a clinic and I am anxious', label: 'negative', domain: 'rural' },
    { text: 'No transport and the pain is severe', label: 'negative', domain: 'rural' },
    { text: 'It is tough but we can manage until morning', label: 'neutral', domain: 'rural' },
    { text: 'Neighbors can help and I feel calmer now', label: 'positive', domain: 'rural' },
    { text: 'Mobile clinic visit gave me hope', label: 'positive', domain: 'rural' },
  ];

  const mental: Sample[] = [
    { text: 'I feel hopeless and panic at night', label: 'negative', domain: 'mental' },
    { text: 'I am anxious and cannot sleep', label: 'negative', domain: 'mental' },
    { text: 'Some days are hard, some are okay', label: 'neutral', domain: 'mental' },
    { text: 'Breathing exercises help and I feel better', label: 'positive', domain: 'mental' },
    { text: 'I am calmer after grounding techniques', label: 'positive', domain: 'mental' },
  ];

  // Expand with templated variants to reach ~150 samples
  const amplifications: string[] = [
    'very', 'really', 'extremely', 'slightly', 'somewhat'
  ];

  function amplify(samples: Sample[], label: SentimentLabel, domain: Domain, base: string, word: string): Sample[] {
    return samples.map((s) => ({
      text: `${base} ${word} ${s.text}`.trim(),
      label,
      domain,
    }));
  }

  let dataset: Sample[] = [...general, ...rural, ...mental];
  for (const amp of amplifications) {
    dataset = dataset.concat(amplify(general, 'negative', 'general', 'I feel', amp));
    dataset = dataset.concat(amplify(rural, 'negative', 'rural', 'It is', amp));
    dataset = dataset.concat(amplify(mental, 'negative', 'mental', 'I am', amp));
  }

  // Shuffle for variety
  dataset.sort(() => Math.random() - 0.5);
  return dataset;
}

function main(): void {
  const outPath = path.join(process.cwd(), 'datasets/sentiment_training_dataset.csv');
  const header = ['text', 'label', 'domain'];
  const rows: string[] = [header.join(',')];
  const data = buildDataset();
  data.forEach((s) => rows.push(toCSVLine([s.text, s.label, s.domain])));
  fs.writeFileSync(outPath, rows.join('\n'));
  console.log(`✅ Generated sentiment dataset with ${data.length} samples at: ${outPath}`);
}

if (require.main === module) {
  main();
}

export { main as generateSentimentDataset };


