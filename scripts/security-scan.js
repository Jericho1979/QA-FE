/**
 * Security Check Script
 * 
 * This script scans the codebase for insecure API calls and non-centralized configuration.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
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
    suggestion: 'Use apiRequest or migrateToSecureApiCall'
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
  },
  {
    name: 'apiService.apiRequest usage',
    regex: /apiService\.apiRequest/g,
    severity: 'medium',
    suggestion: 'Use apiRequest directly'
  }
];

// File extensions to scan
const EXTENSIONS_TO_SCAN = ['.js', '.jsx', '.ts', '.tsx'];

// Directories to skip
const DIRS_TO_SKIP = ['node_modules', 'build', 'dist', '.git', 'scripts'];

// Function to scan a file for patterns
function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const results = [];
    
    for (const pattern of PATTERNS) {
      const matches = findLineNumbers(content, pattern.regex);
      
      if (matches.length > 0) {
        results.push({
          pattern: pattern.name,
          severity: pattern.severity,
          suggestion: pattern.suggestion,
          matches: matches
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error(`Error scanning file ${filePath}:`, error);
    return [];
  }
}

// Function to find line numbers for matches
function findLineNumbers(content, regex) {
  const lines = content.split('\n');
  const results = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (regex.test(line)) {
      // Reset regex lastIndex (needed because we're using the global flag)
      regex.lastIndex = 0;
      results.push({
        line: i + 1,
        content: line.trim()
      });
    }
  }
  
  return results;
}

// Function to scan a directory recursively
function scanDirectory(dirPath) {
  let results = {};
  
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    // Skip ignored directories
    if (DIRS_TO_SKIP.includes(item)) {
      continue;
    }
    
    const itemPath = path.join(dirPath, item);
    const stats = fs.statSync(itemPath);
    
    if (stats.isDirectory()) {
      // Recursively scan subdirectories
      const subResults = scanDirectory(itemPath);
      results = { ...results, ...subResults };
    } else if (stats.isFile()) {
      // Check if file has an extension we want to scan
      const ext = path.extname(itemPath);
      if (EXTENSIONS_TO_SCAN.includes(ext)) {
        const fileResults = scanFile(itemPath);
        if (fileResults.length > 0) {
          results[itemPath] = fileResults;
        }
      }
    }
  }
  
  return results;
}

// Main function
function main() {
  console.log('Scanning codebase for security issues...');
  
  const startTime = Date.now();
  // Get the project root directory (two levels up from the script)
  const scriptDir = path.dirname(__filename);
  const workingDir = path.resolve(scriptDir, '..');
  const srcDir = path.join(workingDir, 'src');
  
  // Check if src directory exists
  if (!fs.existsSync(srcDir)) {
    console.error(`Source directory not found: ${srcDir}`);
    console.error(`Script directory: ${scriptDir}`);
    console.error(`Working directory: ${workingDir}`);
    console.error('Please run this script from the project root directory.');
    return;
  }
  
  // Scan src directory
  console.log(`Scanning directory: ${srcDir}`);
  const results = scanDirectory(srcDir);
  const endTime = Date.now();
  
  // Count total issues
  let totalIssues = 0;
  let highSeverityCount = 0;
  let mediumSeverityCount = 0;
  
  for (const filePath in results) {
    const fileIssues = results[filePath];
    for (const issue of fileIssues) {
      totalIssues += issue.matches.length;
      if (issue.severity === 'high') {
        highSeverityCount += issue.matches.length;
      } else if (issue.severity === 'medium') {
        mediumSeverityCount += issue.matches.length;
      }
    }
  }
  
  // Print summary
  console.log('\n===== SECURITY SCAN SUMMARY =====');
  console.log(`Scan completed in ${(endTime - startTime) / 1000}s`);
  console.log(`Total files scanned: ${Object.keys(results).length}`);
  console.log(`Total issues found: ${totalIssues}`);
  console.log(`High severity issues: ${highSeverityCount}`);
  console.log(`Medium severity issues: ${mediumSeverityCount}`);
  
  // Print detailed results
  if (totalIssues > 0) {
    console.log('\n===== DETAILED RESULTS =====');
    
    for (const filePath in results) {
      const fileIssues = results[filePath];
      if (fileIssues.length === 0) continue;
      
      const relativePath = path.relative(workingDir, filePath);
      console.log(`\nFile: ${relativePath}`);
      
      for (const issue of fileIssues) {
        console.log(`  [${issue.severity.toUpperCase()}] ${issue.pattern}`);
        console.log(`  Suggestion: ${issue.suggestion}`);
        
        for (const match of issue.matches) {
          console.log(`    Line ${match.line}: ${match.content}`);
        }
        console.log('');
      }
    }
  } else {
    console.log('\nNo security issues found. Great job!');
  }
}

// Run the script
main().catch(err => {
  console.error('Error running security scan:', err);
  process.exit(1);
}); 