/**
 * NLP Model Training Script
 * Trains the AdvancedNLPService Naive Bayes intent classifier using accumulated training data.
 */

import { advancedNLPService } from '../services/AdvancedNLPService';

async function runNLPTraining(): Promise<void> {
  console.log('🧠 Starting NLP Model Training');
  console.log('==============================');

  try {
    // Train with existing accumulated data
    const result = await advancedNLPService.trainModel();

    if (!result.success) {
      console.log('⚠️ No NLP training data available. Add examples via the app or ChatbotTrainingService.');
      return;
    }

    console.log('\n📊 TRAINING RESULTS');
    console.log('===================');
    console.log(`Version: ${result.modelVersion}`);
    console.log(`Accuracy: ${(result.accuracy * 100).toFixed(2)}%`);
    console.log(`New Intents: ${result.newIntents}`);
    console.log(`New Entities: ${result.newEntities}`);
    console.log(`Training Time: ${result.trainingTime}ms`);

    // Quick smoke test
    const samples = [
      'I have chest pain and cannot breathe',
      'I feel headache since yesterday',
      'What can I do to prevent getting sick?',
      'Thanks bye',
    ];
    console.log('\n🧪 SMOKE TESTS');
    for (const s of samples) {
      const res = await advancedNLPService.processMessage(s);
      console.log(`- "${s}" -> intent=${res.intent}, conf=${res.confidence.toFixed(2)}`);
    }

    console.log('\n✅ NLP training completed successfully!');
  } catch (error) {
    console.error('❌ NLP training failed:', error);
  }
}

// Run if invoked directly
if (require.main === module) {
  runNLPTraining();
}

export { runNLPTraining };


