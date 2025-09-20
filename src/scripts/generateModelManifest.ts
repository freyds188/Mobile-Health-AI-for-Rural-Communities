import fs from 'fs';
import path from 'path';

function main(): void {
  const root = process.cwd();
  const deployedConfigPath = path.join(root, 'deployed-model-config.json');
  if (!fs.existsSync(deployedConfigPath)) {
    console.error('deployed-model-config.json not found');
    process.exit(1);
  }
  const deployed = JSON.parse(fs.readFileSync(deployedConfigPath, 'utf-8'));

  const manifest = {
    modelId: deployed.modelId,
    version: deployed.version || '1.0.0',
    timestamp: deployed.timestamp,
    performance: deployed.performance,
    clusters: deployed.clusters,
    files: {
      // These URLs assume GitHub Pages hosting on <owner>.github.io/<repo>/
      // Adjust baseUrl from ENV for other hosts/CDN
      nlpModel: process.env.MODEL_BASE_URL
        ? `${process.env.MODEL_BASE_URL}/nlp-model.json`
        : 'nlp-model.json',
      deployedModel: process.env.MODEL_BASE_URL
        ? `${process.env.MODEL_BASE_URL}/deployed-model-config.json`
        : 'deployed-model-config.json',
    },
  };

  const outDir = path.join(root, 'public');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  fs.copyFileSync(path.join(root, 'nlp-model.json'), path.join(outDir, 'nlp-model.json'));
  fs.copyFileSync(path.join(root, 'deployed-model-config.json'), path.join(outDir, 'deployed-model-config.json'));
  fs.writeFileSync(path.join(outDir, 'model-manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('✅ Generated public/model-manifest.json');
}

if (require.main === module) {
  main();
}


