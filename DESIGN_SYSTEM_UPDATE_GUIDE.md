# Design System Update Guide

## ✅ Completed Screens
1. ✅ `src/screens/stylist/StylistProfileScreen.tsx` - Fully updated
2. ✅ `src/screens/client/ProfileScreen.tsx` - Fully updated

## 📋 Screens Pending Update

### How to Update Each Screen:

1. **Add imports:**
```typescript
import { APP_CONFIG, FONTS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants';
```

2. **Replace hardcoded values with constants:**

**Font Sizes:**
- `fontSize: 24` → `fontSize: TYPOGRAPHY.h1`
- `fontSize: 20` → `fontSize: TYPOGRAPHY.h2`
- `fontSize: 18` → `fontSize: TYPOGRAPHY.h3`
- `fontSize: 16` → `fontSize: TYPOGRAPHY.h4`
- `fontSize: 15` → `fontSize: TYPOGRAPHY.body`
- `fontSize: 14` → `fontSize: TYPOGRAPHY.bodySmall`
- `fontSize: 12` → `fontSize: TYPOGRAPHY.label`
- `fontSize: 11` → `fontSize: TYPOGRAPHY.caption`
- `fontSize: 10` → `fontSize: TYPOGRAPHY.tiny`

**Spacing:**
- `padding: 4` or `margin: 4` → `SPACING.xs`
- `padding: 8` or `margin: 8` → `SPACING.sm`
- `padding: 12` or `margin: 12` → `SPACING.md`
- `padding: 16` or `margin: 16` → `SPACING.lg`
- `padding: 20` or `margin: 20` → `SPACING.xl`
- `padding: 24` or `margin: 24` → `SPACING.xxl`

**Border Radius:**
- `borderRadius: 8` → `borderRadius: RADIUS.sm`
- `borderRadius: 12` → `borderRadius: RADIUS.md`
- `borderRadius: 16` → `borderRadius: RADIUS.lg`
- `borderRadius: 20` → `borderRadius: RADIUS.xl`

**Remove Platform-specific font sizes:**
```typescript
// Before:
fontSize: Platform.OS === 'web' ? 18 : Platform.OS === 'android' ? 16 : 14

// After:
fontSize: TYPOGRAPHY.h3
```

## 🎯 Remaining Screens to Update:

### Client Screens:
- [ ] `src/screens/client/AppointmentsScreen.tsx`
- [ ] `src/screens/client/BookingSummaryScreen.tsx`
- [ ] `src/screens/client/BranchSelectionScreen.tsx`
- [ ] `src/screens/client/DashboardScreen.tsx`
- [ ] `src/screens/client/DateTimeSelectionScreen.tsx`
- [ ] `src/screens/client/NotificationsScreen.tsx`
- [ ] `src/screens/client/ProductsScreen.tsx`
- [ ] `src/screens/client/RewardsScreen.tsx`
- [ ] `src/screens/client/ServiceStylistSelectionScreen.tsx`

### Stylist Screens:
- [ ] `src/screens/stylist/StylistAppointmentsScreen.tsx`
- [ ] `src/screens/stylist/StylistClientDetailsScreen.tsx`
- [ ] `src/screens/stylist/StylistClientsScreen.tsx`
- [ ] `src/screens/stylist/StylistDashboardScreen.tsx`
- [ ] `src/screens/stylist/StylistNotificationsScreen.tsx`
- [ ] `src/screens/stylist/StylistPortfolioScreen.tsx`
- [ ] `src/screens/stylist/StylistScheduleScreen.tsx`

### Shared Screens:
- [ ] `src/screens/shared/LoginPageScreen.tsx`
- [ ] `src/screens/shared/OnboardingScreen.tsx`
- [ ] `src/screens/shared/SettingsScreen.tsx`

## 🎨 Design System Constants

### Typography Scale:
```typescript
TYPOGRAPHY = {
  h1: 24,        // Large headings
  h2: 20,        // Section headings
  h3: 18,        // Subsection headings
  h4: 16,        // Card titles
  body: 15,      // Body text, buttons
  bodySmall: 14, // Small body text
  label: 12,     // Labels, captions
  caption: 11,   // Small labels
  tiny: 10,      // Tiny text
}
```

### Spacing Scale:
```typescript
SPACING = {
  xs: 4,    // Tiny gaps
  sm: 8,    // Small spacing
  md: 12,   // Medium spacing
  lg: 16,   // Large spacing
  xl: 20,   // Extra large
  xxl: 24,  // Double extra large
}
```

### Border Radius:
```typescript
RADIUS = {
  sm: 8,     // Small radius
  md: 12,    // Medium radius (cards)
  lg: 16,    // Large radius (badges)
  xl: 20,    // Extra large
  full: 9999,// Circles
}
```

## ✨ Benefits:
- ✅ Consistent design across all screens
- ✅ Easy to update globally
- ✅ No more platform-specific conditionals
- ✅ Cleaner, more maintainable code
- ✅ Professional, polished UI

## 📝 Example Update:

**Before:**
```typescript
const styles = StyleSheet.create({
  title: {
    fontSize: Platform.OS === 'web' ? 20 : 18,
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
});
```

**After:**
```typescript
const styles = StyleSheet.create({
  title: {
    fontSize: TYPOGRAPHY.h2,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.md,
  },
});
```

---

**Status:** 2 of 21 screens updated (9.5% complete)
**Next Priority:** Update Dashboard screens and Login screen
