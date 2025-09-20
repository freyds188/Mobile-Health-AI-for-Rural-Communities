import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export class ExportService {
  async exportCSV(filename: string, rows: Array<Record<string, any>>): Promise<string> {
    const headers = Array.from(new Set(rows.flatMap(r => Object.keys(r))));
    const csv = [headers.join(',')]
      .concat(rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(',')))
      .join('\n');
    const uri = `${FileSystem.documentDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });
    return uri;
  }

  async shareFile(uri: string): Promise<void> {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri);
    }
  }
}

export const exportService = new ExportService();


