export interface AdviceContext {
  intent: string;
  entities: string[];
  severity?: number | null;
  durationText?: string | null;
}

export interface GeneratedAdvice {
  text: string;
}

export class AdviceService {
  generateAdvice(ctx: AdviceContext): GeneratedAdvice {
    const entities = new Set((ctx.entities || []).map(e => e.toLowerCase()));
    const lines: string[] = [];

    // Safety-first escalation
    if (entities.has('chest_pain') || entities.has('shortness_of_breath')) {
      lines.push('🚨 Warning: Chest pain or breathing difficulty can be serious. Seek urgent medical care.');
    }

    // Tailored by symptom entities
    if (entities.has('headache')) {
      lines.push('Headache self-care: Hydration, rest in a dark room, simple pain relief if safe, avoid triggers.');
      lines.push('See a clinician if severe (>7/10), new neurologic signs, fever, or persistent >24–48h.');
    }
    if (entities.has('fever')) {
      lines.push('Fever care: Fluids, light clothing, rest. Consider paracetamol/acetaminophen if appropriate.');
      lines.push('Seek care if >3 days, very high fever, confusion, chest pain, severe dehydration.');
    }
    if (entities.has('diarrhea')) {
      lines.push('Diarrhea care: Oral rehydration solution, clean boiled water, avoid greasy foods.');
      lines.push('Seek care if blood in stool, severe dehydration, fever, or lasts >3 days.');
    }
    if (entities.has('back_pain')) {
      lines.push('Back pain care: Relative rest, gentle movement, heat/ice, proper lifting technique.');
      lines.push('Seek care if trauma, weakness, numbness, incontinence, or severe persistent pain.');
    }
    if (entities.has('mental_health')) {
      lines.push('Mental health support: 4-7-8 breathing, 5-4-3-2-1 grounding, regular sleep, light activity, talk to a trusted person.');
      lines.push('Seek urgent help for thoughts of self-harm or if symptoms severely impair daily life.');
    }

    // General health / preventive advice
    if (ctx.intent === 'general_health' || ctx.intent === 'preventive_care' || ctx.intent === 'health_inquiry') {
      lines.push('Daily prevention: Balanced diet, clean water, hand hygiene, 7–9h sleep, regular physical activity.');
      lines.push('Plan care access: Know nearest clinic/worker, keep emergency contacts, and basic first-aid supplies.');
    }

    // Severity and duration tailoring
    if (ctx.severity && ctx.severity >= 8) {
      lines.push('Given high severity, prioritize in-person evaluation as soon as feasible.');
    }
    if (ctx.durationText && /week|weeks|month/i.test(ctx.durationText)) {
      lines.push('Long duration suggests evaluation to rule out underlying conditions.');
    }

    // Medication safety disclaimer
    lines.push('Medication safety: Use only as directed and check for allergies or interactions.');

    // Final safety disclaimer
    lines.push('This advice is general and not a diagnosis. Seek professional care if symptoms worsen or you are concerned.');

    return { text: lines.join('\n') };
  }
}

export const adviceService = new AdviceService();


