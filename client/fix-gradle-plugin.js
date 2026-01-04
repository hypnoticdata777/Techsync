/**
 * Fix for @react-native/gradle-plugin serviceOf error
 * This script patches the build.gradle.kts file to remove the problematic serviceOf usage
 */

const fs = require('fs');
const path = require('path');

const gradlePluginPath = path.join(
  __dirname,
  'node_modules',
  '@react-native',
  'gradle-plugin',
  'build.gradle.kts'
);

console.log('Checking for gradle-plugin file...');

if (!fs.existsSync(gradlePluginPath)) {
  console.error('❌ File not found:', gradlePluginPath);
  console.log('Make sure you have run "npm install" first');
  process.exit(1);
}

console.log('✓ Found gradle-plugin file');
console.log('Reading file...');

let content = fs.readFileSync(gradlePluginPath, 'utf8');

// Check if the file contains the problematic import
if (!content.includes('import org.gradle.configurationcache.extensions.serviceOf')) {
  console.log('✓ File already patched or does not contain the problematic code');
  process.exit(0);
}

console.log('Applying patch...');

// Remove the problematic import
content = content.replace(
  'import org.gradle.configurationcache.extensions.serviceOf',
  '// import org.gradle.configurationcache.extensions.serviceOf // Patched for compatibility'
);

// Replace serviceOf usage with gradle.sharedServices
content = content.replace(
  /serviceOf<ModuleRegistry>\(\)/g,
  'gradle.sharedServices.registrations.getByName("ModuleRegistry").service.get()'
);

// Write the patched content back
fs.writeFileSync(gradlePluginPath, content, 'utf8');

console.log('✅ Successfully patched @react-native/gradle-plugin');
console.log('You can now run: npx expo run:android');
