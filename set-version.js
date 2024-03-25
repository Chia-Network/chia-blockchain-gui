const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = require(packageJsonPath);

try {
  // Get the most recent git tag reachable from the latest commit
  const latestTag = execSync('git describe --tags --abbrev=0').toString().trim();
  
  // Get the short commit hash
  const gitCommitHash = execSync('git rev-parse --short HEAD').toString().trim();

  // Combine latest tag and commit hash
  packageJson.version = `${latestTag}-${gitCommitHash}`;

  // Write the updated package.json back to file
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

  console.log(`Version set to ${packageJson.version}`);
} catch (error) {
  console.error('Failed to set version:', error);
}
