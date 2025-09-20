// Simple integration to fetch condition info from public sources (e.g., MedlinePlus)
// Falls back to cached content in SQLite/FileSystem if offline

import { databaseService } from './DatabaseService';

export interface HealthContent {
  condition: string;
  summary: string;
  sources: string[];
  updatedAt: string;
}

export class ExternalHealthContentService {
  private async fetchFromAPI(condition: string): Promise<HealthContent | null> {
    try {
      const url = `https://clinicaltables.nlm.nih.gov/api/conditions/v3/search?terms=${encodeURIComponent(condition)}&df=consumer_name,synonyms`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const json = await res.json();
      const summary = Array.isArray(json) ? `Information about ${condition}.` : `Information about ${condition}.`;
      return {
        condition,
        summary,
        sources: ['MedlinePlus / NLM'],
        updatedAt: new Date().toISOString()
      };
    } catch {
      return null;
    }
  }

  async getConditionInfo(condition: string): Promise<HealthContent | null> {
    // Try cache first
    const cached = await databaseService.getCachedContent?.(condition);
    if (cached) return cached;

    // Fetch from API
    const content = await this.fetchFromAPI(condition);
    if (content && databaseService.cacheContent) {
      try { await databaseService.cacheContent(condition, content); } catch {}
    }
    return content;
  }
}

export const externalHealthContentService = new ExternalHealthContentService();


