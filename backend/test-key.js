// Test script to verify Firebase private key format
const fs = require('fs');

console.log('🔍 Testing Firebase Private Key Format...\n');

// Test 1: Check if environment variables are loaded
console.log('📋 Environment Variables:');
console.log(
  'FIREBASE_PROJECT_ID:',
  process.env.FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing'
);
console.log(
  'FIREBASE_CLIENT_EMAIL:',
  process.env.FIREBASE_CLIENT_EMAIL ? '✅ Set' : '❌ Missing'
);
console.log(
  'FIREBASE_PRIVATE_KEY:',
  process.env.FIREBASE_PRIVATE_KEY ? '✅ Set' : '❌ Missing'
);

if (process.env.FIREBASE_PRIVATE_KEY) {
  console.log('\n🔑 Private Key Analysis:');
  const key = process.env.FIREBASE_PRIVATE_KEY;

  // Check key structure
  console.log('Length:', key.length);
  console.log('Contains BEGIN:', key.includes('-----BEGIN PRIVATE KEY-----'));
  console.log('Contains END:', key.includes('-----END PRIVATE KEY-----'));
  console.log('Contains \\n:', key.includes('\\n'));
  console.log('Contains actual newlines:', key.includes('\n'));

  // Show first and last lines
  const lines = key.split('\\n');
  console.log('\n📝 Key Structure:');
  console.log('First line:', lines[0]);
  console.log('Last line:', lines[lines.length - 1]);

  // Test if it can be parsed
  try {
    const parsedKey = key.replace(/\\n/g, '\n');
    console.log('\n✅ Key can be parsed successfully');
    console.log('Parsed length:', parsedKey.length);
  } catch (error) {
    console.log('\n❌ Key parsing failed:', error.message);
  }
}

console.log('\n💡 Tips:');
console.log('1. Make sure your private key uses \\n for newlines');
console.log('2. The key should start with "-----BEGIN PRIVATE KEY-----"');
console.log('3. The key should end with "-----END PRIVATE KEY-----"');
console.log('4. Copy the exact format from your Firebase service account JSON');
