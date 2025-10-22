# David's Salon Mobile App

A comprehensive salon management mobile application built with React Native, Expo, TypeScript, and Firebase. This app provides a complete solution for salon owners, stylists, and clients to manage appointments, services, and business operations.

> **⚠️ SECURITY NOTICE**: Never commit your `.env` file or any files containing sensitive credentials to version control. Always use `.env.example` as a template and keep your actual credentials local.

## 🚀 Features

### For Clients
- **Dashboard**: View appointments, loyalty points, and membership status
- **Appointment Booking**: Schedule appointments with preferred stylists
- **Service Catalog**: Browse available services and products
- **Profile Management**: Update personal information and preferences
- **Notifications**: Real-time updates about appointments and promotions

### For Stylists
- **Dashboard**: View daily appointments and client information
- **Client Management**: Track client history and preferences
- **Schedule Management**: Manage availability and appointments
- **Portfolio**: Showcase work and services
- **Earnings Tracking**: Monitor performance and income

### For Salon Owners
- **Analytics**: Business insights and performance metrics
- **Staff Management**: Manage stylists and schedules
- **Inventory**: Track products and services
- **Financial Reports**: Revenue and expense tracking

## 🛠 Tech Stack

- **Frontend**: React Native with Expo SDK 54
- **Language**: TypeScript
- **State Management**: Redux Toolkit
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **Navigation**: React Navigation v7
- **UI**: Custom components with responsive design
- **Styling**: StyleSheet with Tailwind-inspired classes

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Git](https://git-scm.com/)
- [Firebase CLI](https://firebase.google.com/docs/cli) (optional)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd david-salon-mobile-expo
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Setup

1. Copy the environment template:
```bash
cp env.example .env
```

2. Configure your environment variables in `.env`:
```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id_here
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id_here

# API Configuration
EXPO_PUBLIC_API_URL=https://api.davidsalon.com

# Environment
EXPO_PUBLIC_ENVIRONMENT=development
```

### 4. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication, Firestore Database, and Storage
3. Add your web app to the Firebase project
4. Copy the configuration keys to your `.env` file
5. Set up Firestore security rules (see `firestore.rules` in the project)
6. Configure Storage rules (see `storage.rules` in the project)

### 5. Run the Application

```bash
# Start the development server
npm start
# or
yarn start

# Run on specific platform
npm run ios
npm run android
npm run web
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI components
│   ├── ErrorBoundary.tsx
│   ├── Header.tsx
│   └── ...
├── config/             # Configuration files
│   ├── firebase.ts
│   └── production.ts
├── constants/          # App constants and configuration
├── hooks/              # Custom React hooks
│   ├── firebase.ts
│   ├── redux.ts
│   └── useAuth.ts
├── navigation/         # Navigation configuration
│   ├── client/
│   ├── stylist/
│   └── ...
├── screens/            # Screen components
│   ├── client/
│   ├── stylist/
│   └── shared/
├── services/           # API and external services
│   ├── firebaseService.ts
│   └── authService.ts
├── store/              # Redux store and slices
│   ├── slices/
│   └── index.ts
├── types/              # TypeScript type definitions
│   ├── api.ts
│   ├── firebase.ts
│   └── index.ts
└── utils/              # Utility functions
```

## 🔧 Development

### Code Style

This project uses:
- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting
- **Strict TypeScript** configuration for production

### Available Scripts

```bash
# Development
npm start                 # Start Expo development server
npm run ios              # Run on iOS simulator
npm run android          # Run on Android emulator
npm run web              # Run on web browser

# Building
npm run build:ios        # Build for iOS
npm run build:android    # Build for Android
npm run build:web        # Build for web

# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage

# Linting
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
npm run type-check       # Run TypeScript type checking
```

### Git Workflow

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** and commit:
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

3. **Push your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create a Pull Request** on GitHub

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=ComponentName
```

## 📱 Building for Production

### iOS

1. Configure your Apple Developer account
2. Update `app.json` with your bundle identifier
3. Build the app:
   ```bash
   npm run build:ios
   ```

### Android

1. Generate a signed APK:
   ```bash
   npm run build:android
   ```

### Web

1. Build for web deployment:
   ```bash
   npm run build:web
   ```

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase API key | Yes |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Yes |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Yes |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | Yes |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Firebase app ID | Yes |
| `EXPO_PUBLIC_API_URL` | API base URL | Yes |
| `EXPO_PUBLIC_ENVIRONMENT` | Environment (development/production) | Yes |

## 🚨 Troubleshooting

### Common Issues

1. **Metro bundler issues**:
   ```bash
   npx expo start --clear
   ```

2. **Firebase connection issues**:
   - Check your environment variables
   - Verify Firebase project configuration
   - Check network connectivity

3. **TypeScript errors**:
   ```bash
   npm run type-check
   ```

4. **Dependency issues**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

## 📚 Documentation

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 🤝 Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Project Lead**: [Your Name]
- **Frontend Developer**: [Developer Name]
- **Backend Developer**: [Developer Name]
- **UI/UX Designer**: [Designer Name]

## 📞 Support

For support, email support@davidsalon.com or create an issue in this repository.

## 🔄 Version History

- **v1.0.0** - Initial release with basic salon management features
- **v1.1.0** - Added Firebase integration and real-time updates
- **v1.2.0** - Enhanced UI/UX and performance improvements

---

**Happy Coding! 🎉**
