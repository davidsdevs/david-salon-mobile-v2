# Pagination Implementation Guide

## ✅ Completed
- **StylistAppointmentsScreen** - Pagination added with inline styles
- **StylistPagination Component** - Reusable component created

## 📋 To Apply Pagination

### 1. Import the component and add state:
```typescript
import { StylistPagination } from '../../components/stylist';

// Add pagination state
const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 5;

// Reset to page 1 when filters change
useEffect(() => {
  setCurrentPage(1);
}, [selectedFilter, searchQuery]);
```

### 2. Add pagination logic:
```typescript
// After filtering your data
const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
const startIndex = (currentPage - 1) * itemsPerPage;
const endIndex = startIndex + itemsPerPage;
const paginatedItems = filteredItems.slice(startIndex, endIndex);

const handleNextPage = () => {
  if (currentPage < totalPages) {
    setCurrentPage(currentPage + 1);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  }
};

const handlePrevPage = () => {
  if (currentPage > 1) {
    setCurrentPage(currentPage - 1);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  }
};
```

### 3. Replace `.map()` with paginated data:
```typescript
// Before:
{filteredItems.map((item) => ...)}

// After:
{paginatedItems.map((item) => ...)}
```

### 4. Add pagination component:
```typescript
<StylistPagination
  currentPage={currentPage}
  totalPages={totalPages}
  totalItems={filteredItems.length}
  itemsPerPage={itemsPerPage}
  onNextPage={handleNextPage}
  onPrevPage={handlePrevPage}
/>
```

## 🎯 Pages to Update

### High Priority:
1. **StylistClientsScreen.tsx** (Line 298, 442)
   - Replace `filteredClients.map` with `paginatedClients.map`
   
2. **StylistEarningsScreen.tsx** (Line 345)
   - Replace `filteredTransactions.map` with `paginatedTransactions.map`
   
3. **StylistScheduleScreen.tsx** (Line 415)
   - Replace `selectedDateAppointments.map` with `paginatedAppointments.map`
   
4. **StylistNotificationsScreen.tsx** (Line 424)
   - Replace `notifications.map` with `paginatedNotifications.map`

### Medium Priority:
5. **StylistDashboardScreen.tsx** (Line 422, 599)
   - Today's appointments list (if more than 5)

## 📝 Example Implementation

See `StylistAppointmentsScreen.tsx` lines 62-278 for a complete example.

## 🎨 Benefits
- ✅ Consistent pagination UI across all pages
- ✅ Better performance with large datasets
- ✅ Improved UX with 5 items per page
- ✅ Smooth scrolling on page change
- ✅ Auto-reset when filters change
