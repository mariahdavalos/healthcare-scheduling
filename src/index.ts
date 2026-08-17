import * as fs from 'node:fs';
import * as path from 'node:path';
import { runAudit } from './audit';
import { renderHumanReport } from './report';

const REPO_ROOT = path.join(__dirname, '..');

function writeFile(filePath: string, contents: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

function main(): void {
  const dataDir = process.argv[2] ?? path.join(REPO_ROOT, 'data');
  const result = runAudit(dataDir);
  const humanReport = renderHumanReport(result);
  const json = JSON.stringify(result, null, 2);

  const outputs = {
    json: path.join(REPO_ROOT, 'output', 'audit-result.json'),
    markdown: path.join(REPO_ROOT, 'output', 'audit-report.md'),
    webData: path.join(REPO_ROOT, 'web', 'src', 'data', 'audit-result.json'),
  };

  writeFile(outputs.json, json);
  writeFile(outputs.markdown, humanReport);
  writeFile(outputs.webData, json);

  console.log(humanReport);
  console.log('\nWrote:');
  for (const filePath of Object.values(outputs)) {
    console.log(`  ${path.relative(process.cwd(), filePath)}`);
  }
}

try {
  main();
} catch (error) {
  console.error('Audit failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
