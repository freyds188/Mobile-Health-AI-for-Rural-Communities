import { v4 as uuidv4 } from 'uuid';

export interface TokenInfo {
  token: string;
  position: number;
  partOfSpeech: string;
  lemma: string;
  sentiment: number;
}

export interface EntityInfo {
  text: string;
  type: 'SYMPTOM' | 'BODY_PART' | 'MEDICATION' | 'TIME' | 'SEVERITY' | 'EMOTION' | 'ACTIVITY';
  confidence: number;
  startIndex: number;
  endIndex: number;
  normalized: string;
}

export interface SentimentResult {
  score: number; // -1 to 1
  magnitude: number; // 0 to 1
  label: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
  confidence: number;
}

export interface IntentClassification {
  intent: string;
  confidence: number;
  parameters: { [key: string]: any };
}

export interface SymptomExtraction {
  symptoms: string[];
  severity: number;
  bodyParts: string[];
  timeline: string[];
  triggers: string[];
  alleviatingFactors: string[];
}

export interface NLPAnalysisResult {
  id: string;
  timestamp: Date;
  originalText: string;
  tokens: TokenInfo[];
  entities: EntityInfo[];
  sentiment: SentimentResult;
  intent: IntentClassification;
  symptoms: SymptomExtraction;
  confidence: number;
  language: string;
  processedText: string;
}

class AdvancedTokenizer {
  private stopWords = new Set([
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours',
    'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers',
    'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
    'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are',
    'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does',
    'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until',
    'while', 'of', 'at', 'by', 'for', 'with', 'through', 'during', 'before', 'after',
    'above', 'below', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again',
    'further', 'then', 'once'
  ]);

  private contractions: { [key: string]: string } = {
    "won't": "will not",
    "can't": "cannot",
    "n't": " not",
    "'re": " are",
    "'ve": " have",
    "'ll": " will",
    "'d": " would",
    "'m": " am"
  };

  tokenize(text: string): TokenInfo[] {
    // Normalize text
    let normalizedText = text.toLowerCase().trim();
    
    // Expand contractions
    Object.entries(this.contractions).forEach(([contraction, expansion]) => {
      const regex = new RegExp(contraction.replace("'", "\\'"), 'g');
      normalizedText = normalizedText.replace(regex, expansion);
    });

    // Split into tokens
    const tokenPattern = /\b\w+\b/g;
    const tokens: TokenInfo[] = [];
    let match;

    while ((match = tokenPattern.exec(normalizedText)) !== null) {
      const token = match[0];
      
      if (!this.stopWords.has(token) && token.length > 1) {
        tokens.push({
          token,
          position: match.index,
          partOfSpeech: this.getPartOfSpeech(token),
          lemma: this.lemmatize(token),
          sentiment: this.getTokenSentiment(token)
        });
      }
    }

    return tokens;
  }

  private getPartOfSpeech(token: string): string {
    // Simple POS tagging based on patterns and suffixes
    const verbSuffixes = ['ing', 'ed', 'er', 'est'];
    const nounSuffixes = ['tion', 'sion', 'ment', 'ness', 'ity', 'ism'];
    const adjSuffixes = ['ful', 'less', 'ous', 'ive', 'al', 'ic'];

    if (verbSuffixes.some(suffix => token.endsWith(suffix))) return 'VERB';
    if (nounSuffixes.some(suffix => token.endsWith(suffix))) return 'NOUN';
    if (adjSuffixes.some(suffix => token.endsWith(suffix))) return 'ADJ';
    
    // Default classification
    return 'NOUN';
  }

  private lemmatize(token: string): string {
    // Simple lemmatization rules
    const rules: { [key: string]: string } = {
      'running': 'run',
      'ran': 'run',
      'better': 'good',
      'worse': 'bad',
      'feet': 'foot',
      'children': 'child',
      'people': 'person',
      'aching': 'ache',
      'hurting': 'hurt',
      'feeling': 'feel',
      'headaches': 'headache',
      'pains': 'pain'
    };

    if (rules[token]) return rules[token];

    // Remove common suffixes
    if (token.endsWith('ing')) return token.slice(0, -3);
    if (token.endsWith('ed')) return token.slice(0, -2);
    if (token.endsWith('er')) return token.slice(0, -2);
    if (token.endsWith('est')) return token.slice(0, -3);
    if (token.endsWith('s') && token.length > 3) return token.slice(0, -1);

    return token;
  }

  private getTokenSentiment(token: string): number {
    const positiveWords = new Set([
      'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome',
      'better', 'improved', 'relief', 'comfortable', 'pleasant', 'happy', 'relaxed',
      'energetic', 'strong', 'healthy', 'fine', 'well'
    ]);

    const negativeWords = new Set([
      'bad', 'terrible', 'awful', 'horrible', 'disgusting', 'painful', 'hurt',
      'worse', 'worst', 'sick', 'ill', 'nauseous', 'dizzy', 'weak', 'tired',
      'exhausted', 'depressed', 'anxious', 'worried', 'stressed', 'uncomfortable',
      'severe', 'intense', 'chronic', 'persistent', 'debilitating'
    ]);

    if (positiveWords.has(token)) return 0.5;
    if (negativeWords.has(token)) return -0.5;
    return 0;
  }
}

class EntityExtractor {
  private symptomPatterns = {
    'headache': ['headache', 'head pain', 'migraine', 'head ache', 'cephalgia'],
    'fever': ['fever', 'temperature', 'hot', 'chills', 'feverish', 'pyrexia'],
    'cough': ['cough', 'coughing', 'dry cough', 'wet cough', 'hacking'],
    'fatigue': ['fatigue', 'tired', 'exhausted', 'weakness', 'lethargy', 'drowsy'],
    'nausea': ['nausea', 'sick', 'vomiting', 'queasy', 'nauseated', 'throw up'],
    'pain': ['pain', 'ache', 'sore', 'hurt', 'aching', 'painful', 'discomfort'],
    'dizziness': ['dizzy', 'lightheaded', 'vertigo', 'spinning', 'unsteady'],
    'shortness of breath': ['breath', 'breathing', 'shortness', 'wheezing', 'dyspnea'],
    'chest pain': ['chest pain', 'chest hurt', 'heart pain', 'cardiac pain'],
    'abdominal pain': ['stomach pain', 'belly ache', 'abdominal pain', 'gut pain'],
    'back pain': ['back pain', 'backache', 'spine pain', 'lower back'],
    'joint pain': ['joint pain', 'arthritis', 'knee pain', 'shoulder pain'],
    'muscle pain': ['muscle pain', 'myalgia', 'muscle ache', 'cramps'],
    'rash': ['rash', 'skin irritation', 'red spots', 'itchy skin', 'hives'],
    'insomnia': ['insomnia', 'sleep problems', 'cannot sleep', 'sleepless']
  };

  private bodyPartPatterns = {
    'head': ['head', 'skull', 'brain', 'forehead', 'temple'],
    'chest': ['chest', 'lung', 'heart', 'breast', 'ribs'],
    'abdomen': ['stomach', 'belly', 'abdomen', 'gut', 'intestine'],
    'back': ['back', 'spine', 'vertebra', 'lumbar', 'thoracic'],
    'arms': ['arm', 'shoulder', 'elbow', 'wrist', 'hand', 'finger'],
    'legs': ['leg', 'thigh', 'knee', 'calf', 'ankle', 'foot', 'toe'],
    'neck': ['neck', 'throat', 'cervical'],
    'face': ['face', 'eye', 'nose', 'mouth', 'ear', 'jaw', 'cheek']
  };

  private severityPatterns = {
    'mild': ['mild', 'slight', 'little', 'minor', 'barely', 'somewhat'],
    'moderate': ['moderate', 'medium', 'some', 'noticeable', 'manageable'],
    'severe': ['severe', 'bad', 'terrible', 'awful', 'extreme', 'intense', 'unbearable'],
    'very severe': ['excruciating', 'agonizing', 'unbearable', 'debilitating', 'crippling']
  };

  private timePatterns = {
    'duration': [
      'for (\\d+) (minutes?|hours?|days?|weeks?|months?)',
      'since (yesterday|this morning|last night|\\d+ days? ago)',
      'started (yesterday|this morning|last week)',
      'been (\\d+ days?|a week|a month)'
    ],
    'frequency': [
      'every (\\d+) (minutes?|hours?|days?)',
      '(\\d+) times? (a|per) (day|week|hour)',
      'occasionally', 'frequently', 'constantly', 'intermittently'
    ]
  };

  private emotionPatterns = {
    'anxiety': ['anxious', 'worried', 'nervous', 'stressed', 'panic', 'fear'],
    'depression': ['depressed', 'sad', 'hopeless', 'down', 'low', 'blue'],
    'frustration': ['frustrated', 'annoyed', 'irritated', 'angry', 'mad'],
    'fear': ['scared', 'afraid', 'terrified', 'frightened', 'fearful']
  };

  extractEntities(text: string): EntityInfo[] {
    const entities: EntityInfo[] = [];
    const lowerText = text.toLowerCase();

    // Extract symptoms
    Object.entries(this.symptomPatterns).forEach(([symptom, patterns]) => {
      patterns.forEach(pattern => {
        const index = lowerText.indexOf(pattern);
        if (index !== -1) {
          entities.push({
            text: pattern,
            type: 'SYMPTOM',
            confidence: 0.8,
            startIndex: index,
            endIndex: index + pattern.length,
            normalized: symptom
          });
        }
      });
    });

    // Extract body parts
    Object.entries(this.bodyPartPatterns).forEach(([bodyPart, patterns]) => {
      patterns.forEach(pattern => {
        const index = lowerText.indexOf(pattern);
        if (index !== -1) {
          entities.push({
            text: pattern,
            type: 'BODY_PART',
            confidence: 0.7,
            startIndex: index,
            endIndex: index + pattern.length,
            normalized: bodyPart
          });
        }
      });
    });

    // Extract severity indicators
    Object.entries(this.severityPatterns).forEach(([severity, patterns]) => {
      patterns.forEach(pattern => {
        const index = lowerText.indexOf(pattern);
        if (index !== -1) {
          entities.push({
            text: pattern,
            type: 'SEVERITY',
            confidence: 0.9,
            startIndex: index,
            endIndex: index + pattern.length,
            normalized: severity
          });
        }
      });
    });

    // Extract time expressions
    Object.entries(this.timePatterns).forEach(([timeType, patterns]) => {
      patterns.forEach(pattern => {
        const regex = new RegExp(pattern, 'gi');
        let match;
        while ((match = regex.exec(text)) !== null) {
          entities.push({
            text: match[0],
            type: 'TIME',
            confidence: 0.85,
            startIndex: match.index,
            endIndex: match.index + match[0].length,
            normalized: timeType
          });
        }
      });
    });

    // Extract emotions
    Object.entries(this.emotionPatterns).forEach(([emotion, patterns]) => {
      patterns.forEach(pattern => {
        const index = lowerText.indexOf(pattern);
        if (index !== -1) {
          entities.push({
            text: pattern,
            type: 'EMOTION',
            confidence: 0.75,
            startIndex: index,
            endIndex: index + pattern.length,
            normalized: emotion
          });
        }
      });
    });

    // Remove overlapping entities (keep higher confidence ones)
    return this.removeOverlappingEntities(entities);
  }

  private removeOverlappingEntities(entities: EntityInfo[]): EntityInfo[] {
    const sorted = entities.sort((a, b) => b.confidence - a.confidence);
    const filtered: EntityInfo[] = [];

    for (const entity of sorted) {
      const hasOverlap = filtered.some(existing => 
        (entity.startIndex >= existing.startIndex && entity.startIndex < existing.endIndex) ||
        (entity.endIndex > existing.startIndex && entity.endIndex <= existing.endIndex) ||
        (entity.startIndex <= existing.startIndex && entity.endIndex >= existing.endIndex)
      );

      if (!hasOverlap) {
        filtered.push(entity);
      }
    }

    return filtered.sort((a, b) => a.startIndex - b.startIndex);
  }
}

class SentimentAnalyzer {
  private sentimentLexicon: { [key: string]: number } = {
    // Very positive
    'excellent': 1.0, 'amazing': 1.0, 'fantastic': 1.0, 'wonderful': 1.0,
    'great': 0.8, 'good': 0.6, 'better': 0.5, 'fine': 0.4, 'okay': 0.2,
    'relief': 0.7, 'comfortable': 0.5, 'improved': 0.6, 'healing': 0.5,
    
    // Negative
    'terrible': -1.0, 'awful': -1.0, 'horrible': -1.0, 'excruciating': -1.0,
    'severe': -0.8, 'bad': -0.6, 'worse': -0.7, 'painful': -0.7,
    'uncomfortable': -0.5, 'sick': -0.6, 'ill': -0.6, 'tired': -0.4,
    'weak': -0.5, 'dizzy': -0.5, 'nauseous': -0.6, 'stressed': -0.5,
    'worried': -0.4, 'anxious': -0.5, 'depressed': -0.7, 'frustrated': -0.5
  };

  private intensifiers: { [key: string]: number } = {
    'very': 1.5, 'extremely': 2.0, 'really': 1.3, 'quite': 1.2,
    'somewhat': 0.8, 'slightly': 0.7, 'a bit': 0.6, 'kind of': 0.8
  };

  private negators = new Set(['not', 'no', 'never', 'hardly', 'barely', 'cannot', 'cant']);

  analyzeSentiment(text: string, tokens: TokenInfo[]): SentimentResult {
    const words = text.toLowerCase().split(/\s+/);
    let sentimentScore = 0;
    let magnitude = 0;
    let wordCount = 0;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      
      if (this.sentimentLexicon[word] !== undefined) {
        let score = this.sentimentLexicon[word];
        let multiplier = 1;

        // Check for intensifiers
        if (i > 0 && this.intensifiers[words[i - 1]]) {
          multiplier *= this.intensifiers[words[i - 1]];
        }

        // Check for negators
        if (i > 0 && this.negators.has(words[i - 1])) {
          score *= -1;
        }
        if (i > 1 && this.negators.has(words[i - 2])) {
          score *= -1;
        }

        const adjustedScore = score * multiplier;
        sentimentScore += adjustedScore;
        magnitude += Math.abs(adjustedScore);
        wordCount++;
      }
    }

    // Normalize scores
    const normalizedScore = wordCount > 0 ? sentimentScore / wordCount : 0;
    const normalizedMagnitude = wordCount > 0 ? magnitude / wordCount : 0;

    // Determine label
    let label: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
    if (normalizedScore <= -0.6) label = 'very_negative';
    else if (normalizedScore <= -0.2) label = 'negative';
    else if (normalizedScore >= 0.6) label = 'very_positive';
    else if (normalizedScore >= 0.2) label = 'positive';
    else label = 'neutral';

    // Calculate confidence based on magnitude and word count
    const confidence = Math.min(0.95, Math.max(0.1, normalizedMagnitude * (wordCount / 10)));

    return {
      score: Math.max(-1, Math.min(1, normalizedScore)),
      magnitude: Math.max(0, Math.min(1, normalizedMagnitude)),
      label,
      confidence
    };
  }
}

class IntentClassifier {
  private intentPatterns = {
    'symptom_report': [
      'i have', 'i am experiencing', 'i feel', 'i am feeling', 'my .* hurts?',
      'experiencing', 'suffering from', 'dealing with', 'been having'
    ],
    'severity_inquiry': [
      'how bad', 'how severe', 'pain level', 'on a scale', 'rate.*pain'
    ],
    'duration_inquiry': [
      'how long', 'since when', 'started when', 'began', 'duration'
    ],
    'treatment_inquiry': [
      'what should i do', 'how to treat', 'medication for', 'cure for',
      'help with', 'treatment', 'remedy'
    ],
    'general_health': [
      'how am i', 'overall health', 'general condition', 'health status'
    ],
    'emergency': [
      'emergency', 'urgent', 'serious', 'cannot breathe', 'chest pain',
      'heart attack', 'stroke', 'severe pain'
    ]
  };

  classifyIntent(text: string, entities: EntityInfo[]): IntentClassification {
    const lowerText = text.toLowerCase();
    const scores: { [intent: string]: number } = {};

    // Pattern-based classification
    Object.entries(this.intentPatterns).forEach(([intent, patterns]) => {
      let score = 0;
      patterns.forEach(pattern => {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(lowerText)) {
          score += 1;
        }
      });
      scores[intent] = score;
    });

    // Entity-based boosting
    const hasSymptoms = entities.some(e => e.type === 'SYMPTOM');
    const hasSeverity = entities.some(e => e.type === 'SEVERITY');
    const hasTime = entities.some(e => e.type === 'TIME');
    const hasEmotion = entities.some(e => e.type === 'EMOTION');

    if (hasSymptoms) {
      scores['symptom_report'] = (scores['symptom_report'] || 0) + 2;
    }
    if (hasSeverity) {
      scores['severity_inquiry'] = (scores['severity_inquiry'] || 0) + 1;
      scores['symptom_report'] = (scores['symptom_report'] || 0) + 1;
    }
    if (hasTime) {
      scores['duration_inquiry'] = (scores['duration_inquiry'] || 0) + 1;
      scores['symptom_report'] = (scores['symptom_report'] || 0) + 1;
    }

    // Emergency detection
    const emergencySymptoms = ['chest pain', 'shortness of breath', 'severe headache'];
    const hasEmergencySymptoms = entities.some(e => 
      e.type === 'SYMPTOM' && emergencySymptoms.includes(e.normalized)
    );
    if (hasEmergencySymptoms) {
      scores['emergency'] = (scores['emergency'] || 0) + 5;
    }

    // Find highest scoring intent
    const topIntent = Object.entries(scores).reduce((max, [intent, score]) => 
      score > max.score ? { intent, score } : max, { intent: 'general_health', score: 0 });

    const confidence = Math.min(0.95, Math.max(0.1, topIntent.score / 5));

    // Extract parameters based on intent
    const parameters: { [key: string]: any } = {};
    
    if (topIntent.intent === 'symptom_report') {
      parameters.symptoms = entities.filter(e => e.type === 'SYMPTOM').map(e => e.normalized);
      parameters.bodyParts = entities.filter(e => e.type === 'BODY_PART').map(e => e.normalized);
      parameters.severity = entities.find(e => e.type === 'SEVERITY')?.normalized;
    }
    
    if (hasTime) {
      parameters.timeExpression = entities.filter(e => e.type === 'TIME').map(e => e.text);
    }

    return {
      intent: topIntent.intent,
      confidence,
      parameters
    };
  }
}

class SymptomProcessor {
  extractSymptoms(text: string, entities: EntityInfo[]): SymptomExtraction {
    const symptoms = entities
      .filter(e => e.type === 'SYMPTOM')
      .map(e => e.normalized);

    const bodyParts = entities
      .filter(e => e.type === 'BODY_PART')
      .map(e => e.normalized);

    const timeline = entities
      .filter(e => e.type === 'TIME')
      .map(e => e.text);

    // Calculate severity from entities and text
    let severity = 5; // Default moderate
    const severityEntity = entities.find(e => e.type === 'SEVERITY');
    if (severityEntity) {
      switch (severityEntity.normalized) {
        case 'mild': severity = 3; break;
        case 'moderate': severity = 5; break;
        case 'severe': severity = 8; break;
        case 'very severe': severity = 10; break;
      }
    }

    // Extract triggers and alleviating factors
    const triggers = this.extractTriggers(text);
    const alleviatingFactors = this.extractAlleviatingFactors(text);

    return {
      symptoms: [...new Set(symptoms)], // Remove duplicates
      severity,
      bodyParts: [...new Set(bodyParts)],
      timeline,
      triggers,
      alleviatingFactors
    };
  }

  private extractTriggers(text: string): string[] {
    const triggerPatterns = [
      'after eating', 'when i move', 'in the morning', 'at night',
      'when i cough', 'during exercise', 'stress', 'weather change',
      'certain foods', 'bright lights', 'loud noises'
    ];

    const lowerText = text.toLowerCase();
    return triggerPatterns.filter(pattern => lowerText.includes(pattern));
  }

  private extractAlleviatingFactors(text: string): string[] {
    const alleviatingPatterns = [
      'when i rest', 'after medication', 'with heat', 'with ice',
      'lying down', 'sitting up', 'gentle massage', 'deep breathing',
      'pain reliever', 'ibuprofen', 'acetaminophen'
    ];

    const lowerText = text.toLowerCase();
    return alleviatingPatterns.filter(pattern => lowerText.includes(pattern));
  }
}

export class NLPService {
  private tokenizer = new AdvancedTokenizer();
  private entityExtractor = new EntityExtractor();
  private sentimentAnalyzer = new SentimentAnalyzer();
  private intentClassifier = new IntentClassifier();
  private symptomProcessor = new SymptomProcessor();

  async processText(text: string): Promise<NLPAnalysisResult> {
    try {
      const id = uuidv4();
      const timestamp = new Date();

      // Preprocess text
      const processedText = this.preprocessText(text);

      // Tokenization
      const tokens = this.tokenizer.tokenize(processedText);

      // Entity extraction
      const entities = this.entityExtractor.extractEntities(processedText);

      // Sentiment analysis
      const sentiment = this.sentimentAnalyzer.analyzeSentiment(processedText, tokens);

      // Intent classification
      const intent = this.intentClassifier.classifyIntent(processedText, entities);

      // Symptom extraction
      const symptoms = this.symptomProcessor.extractSymptoms(processedText, entities);

      // Language detection (simplified - assumes English)
      const language = 'en';

      // Calculate overall confidence
      const confidence = this.calculateOverallConfidence(sentiment, intent, entities);

      return {
        id,
        timestamp,
        originalText: text,
        tokens,
        entities,
        sentiment,
        intent,
        symptoms,
        confidence,
        language,
        processedText
      };

    } catch (error) {
      console.error('NLP processing failed:', error);
      throw new Error(`NLP processing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private preprocessText(text: string): string {
    // Remove extra whitespace
    let processed = text.trim().replace(/\s+/g, ' ');
    
    // Fix common typos and variations
    const corrections: { [key: string]: string } = {
      'headach': 'headache',
      'stomache': 'stomach',
      'breathe': 'breath',
      'dizzy': 'dizzy',
      'nauseus': 'nauseous',
      'exausted': 'exhausted'
    };

    Object.entries(corrections).forEach(([wrong, correct]) => {
      const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
      processed = processed.replace(regex, correct);
    });

    return processed;
  }

  private calculateOverallConfidence(
    sentiment: SentimentResult,
    intent: IntentClassification,
    entities: EntityInfo[]
  ): number {
    const sentimentWeight = 0.3;
    const intentWeight = 0.4;
    const entityWeight = 0.3;

    const avgEntityConfidence = entities.length > 0
      ? entities.reduce((sum, entity) => sum + entity.confidence, 0) / entities.length
      : 0.5;

    const overallConfidence = 
      sentiment.confidence * sentimentWeight +
      intent.confidence * intentWeight +
      avgEntityConfidence * entityWeight;

    return Math.max(0.1, Math.min(0.95, overallConfidence));
  }

  async batchProcess(texts: string[]): Promise<NLPAnalysisResult[]> {
    const results: NLPAnalysisResult[] = [];
    
    for (const text of texts) {
      try {
        const result = await this.processText(text);
        results.push(result);
      } catch (error) {
        console.error(`Failed to process text: "${text}"`, error);
      }
    }

    return results;
  }

  generateResponse(analysis: NLPAnalysisResult): string {
    const { intent, symptoms, sentiment, entities } = analysis;

    // Emergency response
    if (intent.intent === 'emergency') {
      return "I've detected that you may be experiencing a serious medical condition. Please seek immediate medical attention or call emergency services (911) if you're having chest pain, difficulty breathing, or other severe symptoms.";
    }

    // Symptom-specific responses
    if (intent.intent === 'symptom_report' && symptoms.symptoms.length > 0) {
      let response = `I understand you're experiencing ${symptoms.symptoms.join(', ')}`;
      
      if (symptoms.severity > 7) {
        response += ". This sounds quite severe. I recommend consulting with a healthcare provider as soon as possible.";
      } else if (symptoms.severity > 4) {
        response += ". This seems to be moderate in severity. Please monitor your symptoms and consider seeing a healthcare provider if they worsen.";
      } else {
        response += ". While this appears to be mild, it's still important to track these symptoms.";
      }

      if (symptoms.bodyParts.length > 0) {
        response += ` The affected areas (${symptoms.bodyParts.join(', ')}) should be monitored.`;
      }

      if (symptoms.timeline.length > 0) {
        response += ` You mentioned this has been happening ${symptoms.timeline.join(', ')}.`;
      }

      return response;
    }

    // Sentiment-based responses
    if (sentiment.label === 'very_negative' || sentiment.label === 'negative') {
      return "I can hear that you're going through a difficult time with your health. It's important to take care of yourself and consider speaking with a healthcare professional who can provide proper guidance.";
    }

    if (sentiment.label === 'positive' || sentiment.label === 'very_positive') {
      return "I'm glad to hear you're feeling better! Continue monitoring your health and maintaining the positive changes you've made.";
    }

    // Default response
    return "Thank you for sharing your health information with me. I'm here to help you track your symptoms and provide general health insights. Remember that this information should not replace professional medical advice.";
  }

  // Utility methods for extracting specific information
  extractMedications(text: string): string[] {
    const medicationPatterns = [
      'ibuprofen', 'acetaminophen', 'tylenol', 'advil', 'aspirin',
      'prescription', 'medication', 'pills', 'antibiotics', 'painkillers'
    ];

    const lowerText = text.toLowerCase();
    return medicationPatterns.filter(med => lowerText.includes(med));
  }

  extractAllergies(text: string): string[] {
    const allergyPatterns = [
      'allergic to', 'allergy', 'allergies', 'reaction to',
      'peanuts', 'shellfish', 'dairy', 'lactose', 'gluten'
    ];

    const lowerText = text.toLowerCase();
    const foundAllergies: string[] = [];

    allergyPatterns.forEach(pattern => {
      if (lowerText.includes(pattern)) {
        foundAllergies.push(pattern);
      }
    });

    return foundAllergies;
  }

  calculateTextComplexity(text: string): number {
    const words = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).length;
    const avgWordsPerSentence = words / Math.max(sentences, 1);
    
    // Complexity score based on length and structure
    return Math.min(10, words * 0.1 + avgWordsPerSentence * 0.3);
  }
}

export const nlpService = new NLPService();