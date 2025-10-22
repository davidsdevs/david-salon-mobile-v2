# Stylist UI Consistency Guidelines

## Overview
This document outlines the UI/UX standards for all stylist-facing screens in the David's Salon mobile app to ensure consistency across the platform.

---

## 🎨 **Design System**

### **Colors**
All stylist screens use the following color palette:

```typescript
Primary: #160B53 (Navy Blue)
Secondary: #2D1B69 (Medium Navy)
Accent: #4A2C8A (Light Navy)

Background: #F5F5F5 (Mobile), #F9FAFB (Web)
Surface: #FFFFFF (White)

Text Primary: #160B53
Text Secondary: #6B7280
Text Tertiary: #9CA3AF
```

### **Client Type Badge Colors**
```typescript
X - New Client: Yellow (#FEF3C7 bg, #92400E text, #FDE68A border)
R - Regular: Pink (#FCE7F3 bg, #9F1239 text, #FBCFE8 border)
TR - Transfer: Cyan (#CCFBF1 bg, #115E59 text, #99F6E4 border)
```

### **Status Colors**
```typescript
Confirmed: #4CAF50 (Green)
Pending: #FF9800 (Orange)
Cancelled: #F44336 (Red)
```

---

## 📐 **Spacing Standards**

### **Section Spacing**
- **Horizontal Padding**: 0px (web), 16px (mobile)
- **Top Padding**: 0px (web), 20px (Android), 10px (iOS)
- **Bottom Margin**: 24px (web), 20px (mobile)

### **Card Spacing**
- **Padding**: 16px
- **Margin Bottom**: 12px
- **Border Radius**: 12px

### **Element Gaps**
- **Small Gap**: 4px
- **Default Gap**: 8px
- **Large Gap**: 16px

---

## 🔤 **Typography Standards**

### **Page Titles**
```typescript
Font Size: 25px (web), 18px (iOS), 16px (Android)
Color: #160B53
Font Family: Poppins Bold
Margin Bottom: 16px (web), 12px (mobile)
```

### **Section Titles**
```typescript
Font Size: 16px (web), 15px (iOS), 14px (Android)
Color: #160B53
Font Family: Poppins SemiBold
```

### **Card Titles**
```typescript
Font Size: 16px (web), 15px (mobile)
Color: #160B53
Font Family: Poppins SemiBold
```

### **Body Text**
```typescript
Font Size: 14px (web), 13px (mobile)
Color: #6B7280
Font Family: Poppins Regular
```

### **Small Text**
```typescript
Font Size: 13px (web), 12px (mobile)
Color: #9CA3AF
Font Family: Poppins Regular
```

---

## 🃏 **Card Styles**

### **Standard Card**
```typescript
{
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  padding: 16,
  marginBottom: 12,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 3, // Android
}
```

### **Web Card** (Enhanced Shadow)
```typescript
{
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 15,
}
```

---

## 🔘 **Button Styles**

### **Primary Button**
```typescript
{
  backgroundColor: '#160B53',
  paddingHorizontal: 20px (web), 16px (mobile),
  paddingVertical: 10px (web), 8px (mobile),
  borderRadius: 8,
}
Text: #FFFFFF, 13px (web), 12px (mobile), Poppins SemiBold
```

### **Outline Button**
```typescript
{
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: '#160B53',
  paddingHorizontal: 20px (web), 16px (mobile),
  paddingVertical: 10px (web), 8px (mobile),
  borderRadius: 8,
}
Text: #160B53, 13px (web), 12px (mobile), Poppins SemiBold
```

---

## 📱 **Screen Structure**

### **Standard Screen Layout**
```tsx
<ScreenWrapper title="Screen Title">
  <ScrollView>
    {/* Page Title Section */}
    <View style={styles.section}>
      <Text style={styles.pageTitle}>Page Title</Text>
    </View>

    {/* Search/Filter Section (if applicable) */}
    <View style={styles.section}>
      <SearchBar />
      <FilterTabs />
    </View>

    {/* Content Section */}
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Section Title</Text>
      {/* Cards or content */}
    </View>
  </ScrollView>
</ScreenWrapper>
```

---

## 🎯 **Component Standards**

### **Client Type Badge**
```tsx
<View style={[
  styles.clientTypeBadge,
  { 
    backgroundColor: badgeColors.bg,
    borderColor: badgeColors.border 
  }
]}>
  <Text style={[
    styles.clientTypeText,
    { color: badgeColors.text }
  ]}>
    {clientType}
  </Text>
</View>
```

### **Status Badge**
```tsx
<View style={[
  styles.statusBadge,
  { backgroundColor: getStatusColor(status) }
]}>
  <Text style={styles.statusText}>{status}</Text>
</View>
```

### **Avatar Placeholder**
```tsx
<View style={styles.clientAvatar}>
  <Ionicons name="person" size={32} color="#999" />
</View>
```

---

## 📋 **Screen-Specific Guidelines**

### **1. Appointments (StylistScheduleScreen)**
- **Title**: "Appointments" (header), "Appointment Management" (page)
- **Filter**: Dropdown on the right, aligned with "Upcoming Appointment"
- **Cards**: Show client name, service, time, duration, price, status
- **No booking button** for stylists

### **2. Clients (StylistClientsScreen)**
- **Title**: "Clients" (header), "Client Management" (page)
- **Search**: Full-width on mobile, right-aligned on web
- **Filters**: Horizontal tabs with color-coded badges
- **Cards**: Avatar, name with badge, service details, notes, "View Profile" button

### **3. Dashboard (StylistDashboardScreen)**
- **Title**: "Dashboard"
- **Stats**: Today's appointments, earnings summary
- **Cards**: Appointment cards with client info
- **Quick actions**: View schedule, view clients

### **4. Earnings (StylistEarningsScreen)**
- **Title**: "Earnings"
- **Summary**: Total earnings, tips, commissions
- **Breakdown**: Daily/weekly/monthly earnings
- **Charts**: Visual representation of earnings

### **5. Profile (StylistProfileScreen)**
- **Title**: "Profile"
- **Avatar**: Large circular avatar
- **Info**: Name, email, membership level
- **Options**: Settings, notifications, help, logout

---

## 🔧 **Implementation**

### **Import Shared Styles**
```typescript
import {
  STYLIST_COLORS,
  STYLIST_SPACING,
  STYLIST_TYPOGRAPHY,
  STYLIST_SHADOWS,
  STYLIST_BUTTONS,
  createCardStyle,
  createSectionStyle,
  getClientTypeBadgeColors,
  getStatusColor,
} from '../../constants/stylistStyles';
```

### **Use Shared Styles**
```typescript
const styles = StyleSheet.create({
  section: createSectionStyle(),
  card: createCardStyle(),
  pageTitle: STYLIST_TYPOGRAPHY.pageTitle,
  primaryButton: STYLIST_BUTTONS.primary,
  // ... other styles
});
```

---

## ✅ **Checklist for New Screens**

- [ ] Use `ScreenWrapper` for consistent header
- [ ] Apply standard section spacing
- [ ] Use shared color constants
- [ ] Apply consistent typography
- [ ] Use standard card styles with proper shadows
- [ ] Implement responsive design (mobile vs web)
- [ ] Use shared button styles
- [ ] Add proper loading states
- [ ] Handle empty states
- [ ] Test on iOS, Android, and Web

---

## 🚫 **Common Mistakes to Avoid**

1. **Inconsistent spacing**: Always use `STYLIST_SPACING` constants
2. **Hardcoded colors**: Use `STYLIST_COLORS` instead
3. **Different font sizes**: Stick to `STYLIST_TYPOGRAPHY` standards
4. **Missing shadows**: Cards should always have shadows
5. **Platform-specific issues**: Test on all platforms
6. **Inconsistent button styles**: Use `STYLIST_BUTTONS`
7. **Wrong badge colors**: Use `getClientTypeBadgeColors()` helper

---

## 📝 **Notes**

- All measurements are in pixels unless specified
- Always test responsive behavior on different screen sizes
- Maintain accessibility standards (contrast ratios, touch targets)
- Keep animations subtle and consistent (if added)
- Document any deviations from these guidelines

---

## 🔄 **Updates**

**Last Updated**: October 15, 2025
**Version**: 1.0.0

For questions or suggestions, contact the development team.
