# Firebase Deployment Script
# Run this script to deploy Firestore indexes and Cloud Functions

Write-Host "🚀 Firebase Deployment Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if Firebase CLI is installed
Write-Host "Checking Firebase CLI..." -ForegroundColor Yellow
$firebaseInstalled = Get-Command firebase -ErrorAction SilentlyContinue

if (-not $firebaseInstalled) {
    Write-Host "❌ Firebase CLI not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Firebase CLI first:" -ForegroundColor Yellow
    Write-Host "  npm install -g firebase-tools" -ForegroundColor White
    Write-Host ""
    Write-Host "Or use npx (no installation required):" -ForegroundColor Yellow
    Write-Host "  npx firebase-tools deploy --only firestore:indexes" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✅ Firebase CLI found: $($firebaseInstalled.Version)" -ForegroundColor Green
Write-Host ""

# Check if logged in
Write-Host "Checking Firebase authentication..." -ForegroundColor Yellow
$loginCheck = firebase projects:list 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in to Firebase!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please login first:" -ForegroundColor Yellow
    Write-Host "  firebase login" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✅ Authenticated" -ForegroundColor Green
Write-Host ""

# Deploy Firestore indexes
Write-Host "📊 Deploying Firestore indexes..." -ForegroundColor Cyan
firebase deploy --only firestore:indexes

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Firestore indexes deployed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to deploy Firestore indexes" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Ask if user wants to deploy rules
$deployRules = Read-Host "Deploy Firestore rules? (y/n)"
if ($deployRules -eq 'y' -or $deployRules -eq 'Y') {
    Write-Host "🔒 Deploying Firestore rules..." -ForegroundColor Cyan
    firebase deploy --only firestore:rules
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Firestore rules deployed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to deploy Firestore rules" -ForegroundColor Red
    }
    Write-Host ""
}

# Ask if user wants to deploy functions
$deployFunctions = Read-Host "Deploy Cloud Functions? (y/n)"
if ($deployFunctions -eq 'y' -or $deployFunctions -eq 'Y') {
    Write-Host "⚡ Deploying Cloud Functions..." -ForegroundColor Cyan
    Write-Host "Note: This requires Firebase Blaze (pay-as-you-go) plan" -ForegroundColor Yellow
    Write-Host ""
    
    firebase deploy --only functions
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Cloud Functions deployed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to deploy Cloud Functions" -ForegroundColor Red
        Write-Host "This might be because you're on the Spark (free) plan" -ForegroundColor Yellow
    }
    Write-Host ""
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Check Firebase Console for index status" -ForegroundColor White
Write-Host "   https://console.firebase.google.com/project/david-salon-fff6d/firestore/indexes" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Wait 5-15 minutes for indexes to build" -ForegroundColor White
Write-Host ""
Write-Host "3. Test the app - notifications should load faster!" -ForegroundColor White
Write-Host ""
