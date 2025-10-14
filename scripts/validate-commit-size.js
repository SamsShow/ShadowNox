#!/usr/bin/env node

/**
 * Validates that commit size doesn't exceed 500 lines
 * as per ETH Online guidelines
 */

import { execSync } from 'child_process';
import { exit } from 'process';

const MAX_LINES = 500;

try {
  // Get the diff statistics for the last commit
  const diffStat = execSync('git diff HEAD^ HEAD --shortstat', { 
    encoding: 'utf-8' 
  }).trim();
  
  if (!diffStat) {
    console.log('✅ No changes detected');
    exit(0);
  }

  // Parse the output: "X files changed, Y insertions(+), Z deletions(-)"
  const insertionsMatch = diffStat.match(/(\d+) insertion/);
  const deletionsMatch = diffStat.match(/(\d+) deletion/);
  
  const insertions = insertionsMatch ? parseInt(insertionsMatch[1]) : 0;
  const deletions = deletionsMatch ? parseInt(deletionsMatch[1]) : 0;
  
  const totalLines = insertions + deletions;
  
  console.log(`\n📊 Commit Statistics:`);
  console.log(`   Insertions: ${insertions}`);
  console.log(`   Deletions:  ${deletions}`);
  console.log(`   Total:      ${totalLines} lines`);
  console.log(`   Limit:      ${MAX_LINES} lines\n`);
  
  if (totalLines > MAX_LINES) {
    console.error(`❌ Commit too large: ${totalLines} lines (max ${MAX_LINES})`);
    console.error(`\n💡 Tips:`);
    console.error(`   - Split your changes into smaller, atomic commits`);
    console.error(`   - Use 'git add -p' to stage changes interactively`);
    console.error(`   - Focus on one feature/fix per commit`);
    console.error(`\n   ETH Online requires commits ≤ 500 lines\n`);
    exit(1);
  }
  
  console.log(`✅ Commit size is within limits\n`);
  exit(0);
  
} catch (error) {
  console.error('Error validating commit size:', error.message);
  // Don't fail on error - allow the commit
  exit(0);
}

