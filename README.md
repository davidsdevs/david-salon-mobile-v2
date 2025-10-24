# 💇 David's Salon Mobile App

A modern, feature-rich mobile application for David's Salon, built with React Native and Expo. This app provides a seamless experience for both clients and stylists to manage appointments, view schedules, and access salon services.

## 📱 Features

### For Clients
- **Easy Booking** - Book appointments with your favorite stylists
- **Real-Time Updates** - Get instant notifications about appointment status
- **Service Browser** - Explore available salon services
- **Rewards Program** - Track points and redeem rewards
- **Appointment History** - View past and upcoming appointments

### For Stylists
- **Dashboard** - Overview of today's appointments and statistics
- **Real-Time Schedule** - View appointments with live updates
- **Schedule Views** - Daily, weekly, and monthly calendar views
- **Multi-Branch Support** - See appointments across different branches
- **Client Management** - Access client history and preferences
- **Portfolio** - Showcase your work with photo galleries
- **Notifications** - Stay updated on new bookings and changes

## 🚀 Tech Stack

- **Framework:** React Native with Expo SDK 54
- **Language:** TypeScript
- **Backend:** Firebase (Firestore, Authentication, Storage)
- **State Management:** Redux Toolkit
- **Navigation:** React Navigation v6
- **UI Components:** Custom components with Ionicons
- **Real-Time Updates:** Firebase onSnapshot listeners

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Git

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/davidsdevs/david-salon-mobile-v2.git
   cd david-salon-mobile-v2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Firestore, Authentication, and Storage
   - Copy your Firebase config to `src/config/firebase.ts`

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on your device**
   - Scan the QR code with Expo Go app (iOS/Android)
   - Or press `a` for Android emulator
   - Or press `i` for iOS simulator

## 📁 Project Structure

```
david-salon-mobile-expo/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── stylist/        # Stylist-specific components
│   │   └── ...
│   ├── screens/            # App screens
│   │   ├── client/         # Client-side screens
│   │   ├── stylist/        # Stylist-side screens
│   │   └── shared/         # Shared screens
│   ├── navigation/         # Navigation configuration
│   │   ├── client/         # Client navigation
│   │   └── stylist/        # Stylist navigation
│   ├── services/           # API and Firebase services
│   ├── store/              # Redux store and slices
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   ├── constants/          # App constants and config
│   └── config/             # Firebase and app configuration
├── assets/                 # Images, fonts, and static files
├── docs/                   # Documentation files
└── app.json               # Expo configuration
```

## 🔥 Key Features Implementation

### Real-Time Updates
All major screens use Firebase's `onSnapshot` for live data synchronization:
- Appointments automatically update when status changes
- Schedule reflects new bookings instantly
- Notifications appear in real-time
- Client lists update with new appointments

### Multi-Branch Support
Stylists can work across multiple branches:
- Schedule shows appointments from all branches
- Filter by specific branch
- Branch information displayed on each appointment
- Support for "borrowed" stylists between branches

### Responsive Design
- Optimized for mobile devices (iOS & Android)
- Web support with responsive layouts
- Tablet-friendly interface
- Adaptive navigation for different screen sizes

## 🎨 Styling

The app uses a custom design system with:
- **Primary Color:** `#160B53` (Deep Purple)
- **Typography:** Poppins font family
- **Components:** Custom styled components for consistency
- **Icons:** Ionicons from Expo vector-icons

## 🔐 Authentication

- Firebase Authentication for secure login
- Role-based access (Client/Stylist)
- Redux for auth state management
- Persistent sessions with AsyncStorage

## 📊 Database Structure

### Collections
- **users** - User profiles (clients and stylists)
- **appointments** - Booking records
- **services** - Available salon services
- **branches** - Salon branch locations
- **notifications** - User notifications
- **portfolio** - Stylist work galleries

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Type checking
npx tsc --noEmit
```

## 📦 Building for Production

### Android
```bash
eas build --platform android
```

### iOS
```bash
eas build --platform ios
```

### Web
```bash
npm run build:web
```

## 🚧 Known Issues

- Push notifications only work in development/production builds (not in Expo Go)
- Some TypeScript strict mode warnings (non-breaking)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is proprietary and confidential. All rights reserved by David's Salon.

## 👥 Team

- **Development Team:** davidsdevs
- **Project Type:** Mobile Application (React Native)

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team

## 🎯 Roadmap

### Upcoming Features
- [ ] Payment integration
- [ ] Push notification improvements
- [ ] Advanced analytics dashboard
- [ ] Client feedback system
- [ ] Stylist performance metrics
- [ ] Loyalty program enhancements

## 📚 Documentation

Additional documentation can be found in the `/docs` folder:
- Email setup guides
- Notification integration
- Login module documentation
- Navigation fixes and updates

## 🙏 Acknowledgments

- React Native community
- Expo team
- Firebase
- All contributors and testers

---

**Version:** 1.0.0  
**Last Updated:** October 2025  
**Status:** Active Development

Made with ❤️ by the David's Salon Development Team
