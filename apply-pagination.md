# Manual Pagination Application

Due to file complexity, here's the exact code to manually add to each page:

## For StylistClientsScreen.tsx:

### 1. Add to imports (line 25):
```typescript
  StylistPagination,
```

### 2. Add after line 37 (after `const [loading, setLoading] = useState(true);`):
```typescript
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilter, searchQuery]);
```

### 3. Add after filteredClients definition (around line 209):
```typescript

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = filteredClients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

### 4. Replace `filteredClients.map` with `paginatedClients.map` (2 occurrences)

### 5. Add before closing `</StylistSection>` (after the map):
```typescript
            <StylistPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredClients.length}
              itemsPerPage={itemsPerPage}
              onNextPage={handleNextPage}
              onPrevPage={handlePrevPage}
            />
```

---

I've created this guide because the automated edits were causing syntax errors. The pagination component is ready and working on Appointments. You can:

1. Manually apply using this guide (5-10 min per page)
2. Or I can create a complete new version of each file with pagination included

Would you like me to create complete new versions of the files instead?
