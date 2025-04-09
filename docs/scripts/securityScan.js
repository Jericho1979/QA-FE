/**
 * Security Check Script
 * 
 * This script scans the codebase for insecure API calls and non-centralized configuration.
 * Run it with: node scripts/securityScan.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Patterns to search for
const PATTERNS = [
  {
    name: 'Hardcoded API URL',
    regex: /(['"`])https?:\/\/localhost:[0-9]+\/api\//g,
    severity: 'high',
    suggestion: 'Replace with config.API_URL'
  },
  {
    name: 'Token from localStorage',
    regex: /localStorage\.getItem\(['"`]token['"`]\)/g,
    severity: 'high',
    suggestion: 'Remove and use cookie-based auth'
  },
  {
    name: 'Direct fetch call',
    regex: /fetch\(['"`]https?:\/\/localhost:[0-9]+\/api\//g,
    severity: 'medium',
    suggestion: 'Use apiService.apiRequest or migrateToSecureApiCall'
  },
  {
    name: 'Bearer token in headers',
    regex: /'Authorization':\s*['"]\s*Bearer\s+/g,
    severity: 'high',
    suggestion: 'Remove and use cookie-based auth'
  },
  {
    name: 'User info from localStorage',
    regex: /localStorage\.getItem\(['"`](userEmail|userName|userType)['"`]\)/g,
    severity: 'medium',
    suggestion: 'Use authService.getCurrentUser()'
  }
];

// File extensions to scan
const EXTENSIONS_TO_SCAN = ['.js', '.jsx', '.ts', '.tsx'];

// Directories to skip
const DIRS_TO_SKIP = ['node_modules', 'build', 'dist', '.git', 'scripts'];

// Function to scan a file
async function scanFile(filePath) {
  try {
    const content = await fs.promises.readFile(filePath, 'utf8');
    const issues = [];

    PATTERNS.forEach(pattern => {
      const matches = content.match(pattern.regex);
      if (matches) {
        const uniqueMatches = [...new Set(matches)];
        issues.push({
          pattern: pattern.name,
          count: uniqueMatches.length,
          severity: pattern.severity,
          suggestion: pattern.suggestion,
          matches: uniqueMatches,
          lineNumbers: findLineNumbers(content, pattern.regex)
        });
      }
    });

    return issues.length > 0 ? { filePath, issues } : null;
  } catch (error) {
    console.error(`Error scanning file ${filePath}:`, error);
    return null;
  }
}

// Function to find line numbers of regex matches
function findLineNumbers(content, regex) {
  const lines = content.split('\n');
  const lineNumbers = [];

  lines.forEach((line, index) => {
    if (regex.test(line)) {
      lineNumbers.push(index + 1);
    }
    // Reset the regex lastIndex property
    regex.lastIndex = 0;
  });

  return lineNumbers;
}

// Function to scan a directory recursively
async function scanDirectory(dirPath) {
  try {
    const entries = await fs.promises.readdir(dirPath);
    let results = [];

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry);
      
      if (DIRS_TO_SKIP.includes(entry)) {
        continue;
      }

      const fileStat = await fs.promises.stat(fullPath);
      
      if (fileStat.isDirectory()) {
        const subResults = await scanDirectory(fullPath);
        results = results.concat(subResults);
      } else {
        const ext = path.extname(fullPath);
        if (EXTENSIONS_TO_SCAN.includes(ext)) {
          const fileIssues = await scanFile(fullPath);
          if (fileIssues) {
            results.push(fileIssues);
          }
        }
      }
    }

    return results;
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error);
    return [];
  }
}

// Check if the src directory exists, or create fallback directory to scan
async function getDirectoryToScan() {
  const rootDir = path.join(__dirname, '..');
  const srcDir = path.join(rootDir, 'src');
  
  try {
    await fs.promises.access(srcDir, fs.constants.F_OK);
    return srcDir;
  } catch (error) {
    // If src doesn't exist, check if there's a RHET-Zoom-Archive directory to scan
    try {
      const nestedDir = path.join(rootDir, 'RHET-Zoom-Archive With Neon2Backtrack', 'RHET-Zoom-Archive With Neon', 'RHET-Zoom-Archive-main', 'RHET-Zoom-Archive-main', 'RHET-Zoom-Archive-main', 'project1', 'src');
      await fs.promises.access(nestedDir, fs.constants.F_OK);
      console.log(`No src directory found in root. Using ${path.relative(rootDir, nestedDir)} instead.`);
      return nestedDir;
    } catch (error) {
      // If neither exists, just scan the root directory
      console.log('No src directory found. Scanning entire project (excluding node_modules, etc.)');
      return rootDir;
    }
  }
}

// Main function
async function main() {
  console.log('Security check starting...');
  console.log('Scanning for insecure API calls and non-centralized configuration...\n');

  const dirToScan = await getDirectoryToScan();
  const results = await scanDirectory(dirToScan);

  // Generate report
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;

  console.log('--------------------------------------');
  console.log('SECURITY CHECK REPORT');
  console.log('--------------------------------------\n');

  results.forEach(result => {
    const { filePath, issues } = result;
    const relPath = path.relative(path.join(__dirname, '..'), filePath);

    console.log(`\x1b[1mFile: ${relPath}\x1b[0m`);
    
    issues.forEach(issue => {
      if (issue.severity === 'high') highCount += issue.count;
      if (issue.severity === 'medium') mediumCount += issue.count;
      if (issue.severity === 'low') lowCount += issue.count;

      const severityColor = 
        issue.severity === 'high' ? '\x1b[31m' :
        issue.severity === 'medium' ? '\x1b[33m' : '\x1b[32m';

      console.log(`  ${severityColor}[${issue.severity.toUpperCase()}]\x1b[0m ${issue.pattern} (${issue.count} occurrences)`);
      console.log(`  \x1b[90mSuggestion: ${issue.suggestion}\x1b[0m`);
      
      if (issue.lineNumbers.length > 0) {
        console.log(`  \x1b[90mLine numbers: ${issue.lineNumbers.join(', ')}\x1b[0m`);
      }
      
      console.log('');
    });
  });

  // Summary
  console.log('--------------------------------------');
  console.log('SUMMARY');
  console.log('--------------------------------------');
  console.log(`Total files with issues: ${results.length}`);
  console.log(`High severity issues: \x1b[31m${highCount}\x1b[0m`);
  console.log(`Medium severity issues: \x1b[33m${mediumCount}\x1b[0m`);
  console.log(`Low severity issues: \x1b[32m${lowCount}\x1b[0m`);
  console.log('\n');

  if (results.length > 0) {
    console.log('\x1b[1mNext steps:\x1b[0m');
    console.log('1. Review the identified issues and prioritize them by severity');
    console.log('2. Use the migrateToSecureApiCall function for quick fixes');
    console.log('3. For a more thorough approach, refactor to use apiRequest');
    console.log('4. See SECURITY_UPDATES.md for detailed instructions');
  } else {
    console.log('\x1b[32mNo security issues found. Good job!\x1b[0m');
  }
}

main().catch(error => {
  console.error('Error running security check:', error);
  process.exit(1);
}); 