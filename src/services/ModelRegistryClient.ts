// Lightweight client for fetching model manifests and artifacts from a remote registry
// Works without a dedicated backend by serving static JSON files from any HTTPS host

let FileSystem: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  FileSystem = require('expo-file-system');
} catch {
  FileSystem = null;
}

export interface ModelManifest {
  modelId: string;
  version: string;
  timestamp: string;
  performance?: { f1Score: number; accuracy: number };
  clusters?: number;
  files: {
    nlpModel?: string; // URL to nlp-model.json
    deployedModel?: string; // URL to deployed model JSON (risk clusters)
  };
}

export class ModelRegistryClient {
  constructor(private readonly manifestUrl: string) {}

  async fetchManifest(): Promise<ModelManifest | null> {
    try {
      const res = await fetch(this.manifestUrl);
      if (!res.ok) return null;
      const json = (await res.json()) as ModelManifest;
      return json;
    } catch {
      return null;
    }
  }

  async downloadFile(url: string, localName: string): Promise<string | null> {
    if (!FileSystem) return null;
    try {
      const dir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
      const fileUri = `${dir}${localName}`;
      const result = await FileSystem.downloadAsync(url, fileUri);
      return result?.uri || null;
    } catch {
      return null;
    }
  }
}

export default ModelRegistryClient;


