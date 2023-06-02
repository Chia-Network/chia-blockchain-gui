import { execSync } from 'child_process';

// Define the array of valid seeds
const validSeeds = ['seed1', 'seed2'];

// Check if the provided seed is valid
const seed = process.argv[2];
if (!validSeeds.includes(seed)) {
  console.log(`Invalid seed parameter. Please provide one of the following: ${validSeeds.join(', ')}`);
  process.exit(1);
}

console.log(`Resetting simulator data to seed: ${seed}`);

// Extract the corresponding gzip files to ~/.chia/simulator/main
try {
  execSync(`tar -xzvf "./simulator-reset-seed/${seed}/db.tar.gz" -C ~/.chia/simulator/main`);
  execSync(`tar -xzvf "./simulator-reset-seed/${seed}/wallet.tar.gz" -C ~/.chia/simulator/main`);
} catch (error) {
  console.error('An error occurred while extracting the gzip files:', error);
  process.exit(1);
}
