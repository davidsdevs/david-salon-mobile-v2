# Stylist Global Components Guide

## Overview
This guide documents all reusable components for the stylist interface to ensure consistency across all screens.

---

## 📦 **Available Components**

### **1. StylistButton**
Standardized button component with multiple variants.

#### **Props:**
```typescript
interface StylistButtonProps {
  title: string;              // Button text
  onPress: () => void;        // Click handler
  variant?: 'primary' | 'outline' | 'secondary';  // Button style
  icon?: string;              // Ionicons name
  iconSize?: number;          // Icon size (default: 16)
  disabled?: boolean;         // Disabled state
  style?: ViewStyle;          // Additional styles
}
```

#### **Usage:**
```tsx
import { StylistButton } from '../../components/stylist';

// Primary button
<StylistButton 
  title="Update Availability" 
  onPress={handleUpdate}
  variant="primary"
  icon="time-outline"
/>

// Outline button
<StylistButton 
  title="View" 
  onPress={handleView}
  variant="outline"
  icon="funnel-outline"
/>

// Secondary button
<StylistButton 
  title="Cancel" 
  onPress={handleCancel}
  variant="secondary"
/>
```

#### **Variants:**
- **primary**: Navy background (#160B53), white text
- **outline**: White background, navy border, navy text
- **secondary**: Light gray background (#F3F4F6), navy text

---

### **2. StylistSearchBar**
Standardized search input with icon.

#### **Props:**
```typescript
interface StylistSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;       // Default: "Search..."
}
```

#### **Usage:**
```tsx
import { StylistSearchBar } from '../../components/stylist';

<StylistSearchBar
  value={searchQuery}
  onChangeText={setSearchQuery}
  placeholder="Search Clients"
/>
```

---

### **3. StylistFilterTab**
Filter tab button with color variants for different types.

#### **Props:**
```typescript
interface StylistFilterTabProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  variant?: 'default' | 'new-client' | 'regular' | 'transfer';
}
```

#### **Usage:**
```tsx
import { StylistFilterTab } from '../../components/stylist';

<StylistFilterTab
  label="X - New Client"
  isActive={selectedFilter === 'X - New Client'}
  onPress={() => setSelectedFilter('X - New Client')}
  variant="new-client"
/>
```

#### **Variants:**
- **default**: Gray background
- **new-client**: Yellow background (#FEF3C7)
- **regular**: Pink background (#FCE7F3)
- **transfer**: Cyan background (#CCFBF1)

---

### **4. StylistCard**
Standardized card container with consistent shadow and styling.

#### **Props:**
```typescript
interface StylistCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}
```

#### **Usage:**
```tsx
import { StylistCard } from '../../components/stylist';

<StylistCard>
  <Text>Card Content</Text>
</StylistCard>
```

#### **Features:**
- White background
- 12px border radius
- Consistent shadow (web: stronger, mobile: lighter)
- 16px padding
- 12px bottom margin

---

### **5. StylistBadge**
Status and type badges with predefined color schemes.

#### **Props:**
```typescript
interface StylistBadgeProps {
  label: string;
  variant?: 'new-client' | 'regular' | 'transfer' | 'confirmed' | 'pending' | 'cancelled' | 'default';
  size?: 'small' | 'medium';
}
```

#### **Usage:**
```tsx
import { StylistBadge } from '../../components/stylist';

// Client type badge
<StylistBadge 
  label="X - New Client" 
  variant="new-client"
  size="small"
/>

// Status badge
<StylistBadge 
  label="confirmed" 
  variant="confirmed"
  size="medium"
/>
```

#### **Variants:**
| Variant | Background | Text Color | Use Case |
|---------|-----------|------------|----------|
| new-client | Yellow (#FEF3C7) | Brown (#92400E) | New clients |
| regular | Pink (#FCE7F3) | Red (#9F1239) | Regular clients |
| transfer | Cyan (#CCFBF1) | Teal (#115E59) | Transfer clients |
| confirmed | Green (#D1FAE5) | Dark Green (#065F46) | Confirmed status |
| pending | Yellow (#FEF3C7) | Brown (#92400E) | Pending status |
| cancelled | Red (#FEE2E2) | Dark Red (#991B1B) | Cancelled status |
| default | Gray (#F3F4F6) | Dark Gray (#374151) | Generic |

---

### **6. StylistPageTitle**
Standardized page title component.

#### **Props:**
```typescript
interface StylistPageTitleProps {
  title: string;
  style?: TextStyle;
}
```

#### **Usage:**
```tsx
import { StylistPageTitle } from '../../components/stylist';

<StylistPageTitle title="Client Management" />
```

#### **Features:**
- Font size: 25px (web), 18px (mobile)
- Color: Navy (#160B53)
- Font: Poppins Bold
- Bottom margin: 8px

---

### **7. StylistSection**
Standardized section wrapper with consistent spacing.

#### **Props:**
```typescript
interface StylistSectionProps {
  children: React.ReactNode;
  isTitle?: boolean;          // Use true for first section with title
  style?: ViewStyle;
}
```

#### **Usage:**
```tsx
import { StylistSection } from '../../components/stylist';

// Title section (more top padding)
<StylistSection isTitle>
  <StylistPageTitle title="Appointments" />
</StylistSection>

// Regular section
<StylistSection>
  <Text>Content</Text>
</StylistSection>
```

#### **Spacing:**
| Type | Android Top | iOS Top | Bottom Margin |
|------|-------------|---------|---------------|
| Title Section | 24px | 20px | 12px (mobile), 20px (web) |
| Regular Section | 16px | 12px | 12px (mobile), 20px (web) |

---

## 🎨 **Complete Example**

Here's how to use all components together:

```tsx
import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import {
  StylistSection,
  StylistPageTitle,
  StylistButton,
  StylistSearchBar,
  StylistFilterTab,
  StylistCard,
  StylistBadge,
} from '../../components/stylist';

export default function ExampleScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

  return (
    <ScrollView>
      {/* Title Section */}
      <StylistSection isTitle>
        <StylistPageTitle title="Example Page" />
      </StylistSection>

      {/* Search and Filters */}
      <StylistSection>
        <StylistSearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search..."
        />
        
        <StylistFilterTab
          label="All"
          isActive={selectedFilter === 'All'}
          onPress={() => setSelectedFilter('All')}
        />
      </StylistSection>

      {/* Content */}
      <StylistSection>
        <StylistCard>
          <StylistBadge label="New Client" variant="new-client" />
        </StylistCard>
      </StylistSection>

      {/* Actions */}
      <StylistSection>
        <StylistButton
          title="Save Changes"
          onPress={() => console.log('Save')}
          variant="primary"
          icon="checkmark-circle-outline"
        />
      </StylistSection>
    </ScrollView>
  );
}
```

---

## 📋 **Migration Checklist**

When updating existing screens to use global components:

- [ ] Replace custom buttons with `<StylistButton>`
- [ ] Replace search inputs with `<StylistSearchBar>`
- [ ] Replace filter tabs with `<StylistFilterTab>`
- [ ] Wrap content in `<StylistCard>` instead of custom View
- [ ] Replace status/type badges with `<StylistBadge>`
- [ ] Replace page titles with `<StylistPageTitle>`
- [ ] Wrap sections in `<StylistSection>`
- [ ] Remove duplicate style definitions
- [ ] Test on iOS, Android, and Web

---

## 🎯 **Benefits**

1. **Consistency**: All UI elements look and behave the same
2. **Maintainability**: Update once, applies everywhere
3. **Reduced Code**: Less duplication across screens
4. **Type Safety**: TypeScript props prevent errors
5. **Accessibility**: Consistent touch targets and contrast
6. **Performance**: Optimized components with proper memoization

---

## 🚀 **Best Practices**

1. **Always use global components** instead of creating custom ones
2. **Don't override styles** unless absolutely necessary
3. **Use the correct variant** for the use case
4. **Keep component props simple** - don't add unnecessary complexity
5. **Report issues** if a component doesn't meet your needs (we'll update the global component)

---

## 📝 **Component Locations**

```
src/
  components/
    stylist/
      StylistButton.tsx
      StylistSearchBar.tsx
      StylistFilterTab.tsx
      StylistCard.tsx
      StylistBadge.tsx
      StylistPageTitle.tsx
      StylistSection.tsx
      index.ts              // Export all components
```

---

## 🔄 **Updates**

**Last Updated**: October 15, 2025  
**Version**: 1.0.0

For questions or component requests, contact the development team.
