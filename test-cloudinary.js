/**
 * Cloudinary Configuration Test
 * 
 * Run this to verify your Cloudinary setup:
 * node test-cloudinary.js
 */

// Load environment variables
require('dotenv').config();

const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_API_KEY = process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY;

console.log('\n🔍 Checking Cloudinary Configuration...\n');

let hasErrors = false;

// Check Cloud Name
if (!CLOUDINARY_CLOUD_NAME || CLOUDINARY_CLOUD_NAME === 'your_cloud_name_here') {
  console.log('❌ EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME is missing or not set');
  console.log('   → Get it from: https://console.cloudinary.com/');
  hasErrors = true;
} else {
  console.log('✅ Cloud Name:', CLOUDINARY_CLOUD_NAME);
}

// Check Upload Preset
if (!CLOUDINARY_UPLOAD_PRESET || CLOUDINARY_UPLOAD_PRESET === 'your_upload_preset_here') {
  console.log('❌ EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET is missing or not set');
  console.log('   → Create one at: https://console.cloudinary.com/settings/upload');
  console.log('   → Make sure it\'s set to "Unsigned"');
  hasErrors = true;
} else {
  console.log('✅ Upload Preset:', CLOUDINARY_UPLOAD_PRESET);
}

// Check API Key
if (!CLOUDINARY_API_KEY || CLOUDINARY_API_KEY === 'your_api_key_here') {
  console.log('❌ EXPO_PUBLIC_CLOUDINARY_API_KEY is missing or not set');
  console.log('   → Get it from: https://console.cloudinary.com/');
  hasErrors = true;
} else {
  console.log('✅ API Key:', CLOUDINARY_API_KEY);
}

console.log('\n' + '='.repeat(50));

if (hasErrors) {
  console.log('\n⚠️  Please update your .env file with the correct values\n');
  process.exit(1);
} else {
  console.log('\n🎉 Cloudinary configuration looks good!\n');
  console.log('📤 Upload URL will be:');
  console.log(`   https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload\n`);
  console.log('🖼️  Image URLs will be:');
  console.log(`   https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/...\n`);
  console.log('✨ You\'re ready to upload images!\n');
}
