'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseDebouncedSearchOptions<T> {
  items: T[];
  filterFn: (item: T, query: string) => boolean;
  apiFn?: (query: string) => Promise<T[]>;
  delay?: number;
}

export function useDebouncedSearch<T>({
  items,
  filterFn,
  apiFn,
  delay = 300,
}: UseDebouncedSearchOptions<T>) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // Sync results with items when query is empty
  useEffect(() => {
    if (!query.trim()) {
      setResults(items);
    }
  }, [items, query]);

  useEffect(() => {
    if (!query.trim()) {
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(async () => {
      const currentItems = itemsRef.current;
      const localResults = currentItems.filter((item) => filterFn(item, query));

      if (localResults.length > 0 || !apiFn) {
        setResults(localResults);
        setIsSearching(false);
        return;
      }

      try {
        const apiResults = await apiFn(query);
        setResults(apiResults);
      } catch {
        setResults(localResults);
      } finally {
        setIsSearching(false);
      }
    }, delay);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, delay]);

  const clearSearch = useCallback(() => {
    setQuery('');
  }, []);

  return { query, setQuery, results, isSearching, clearSearch };
}
