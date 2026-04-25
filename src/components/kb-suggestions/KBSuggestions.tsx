'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { BookOpen, ExternalLink } from 'lucide-react';
import { useArticles } from '@/hooks/use-articles';
import { stripHtml } from '@/lib/format';
import type { HDArticle } from '@/types/frappe';

interface KBSuggestionsProps {
  query: string;
  maxResults?: number;
}

/**
 * Shows relevant KB articles based on a search query.
 * Uses keyword matching — splits the query into words and scores
 * articles by how many words appear in the title or content.
 */
export function KBSuggestions({ query, maxResults = 3 }: KBSuggestionsProps) {
  const { data: articles } = useArticles();

  const suggestions = useMemo(() => {
    if (!query || query.length < 5 || !articles?.length) return [];

    const words = query
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 2); // Skip short words like "a", "is", "the"

    if (words.length === 0) return [];

    const scored = articles
      .filter((a: HDArticle) => a.status === 'Published')
      .map((article: HDArticle) => {
        const title = (article.title || '').toLowerCase();
        const content = stripHtml(article.content || '').toLowerCase();
        const combined = `${title} ${content}`;

        // Score: title matches worth 3x, content matches worth 1x
        let score = 0;
        for (const word of words) {
          if (title.includes(word)) score += 3;
          if (content.includes(word)) score += 1;
        }

        return { article, score };
      })
      .filter(({ score }) => score >= 2) // At least 2 points to show
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);

    return scored;
  }, [query, articles, maxResults]);

  if (suggestions.length === 0) return null;

  return (
    <div className="rounded-md border border-smyls-blue-100 bg-smyls-blue-50 p-3 space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-smyls-blue-700">
        <BookOpen className="h-3.5 w-3.5" />
        These articles might help
      </div>
      <div className="space-y-1">
        {suggestions.map(({ article }) => (
          <Link
            key={article.name}
            href={`/knowledge-base/${article.name}`}
            target="_blank"
            className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-smyls-blue-100 transition-colors group"
          >
            <span className="text-sm text-foreground group-hover:text-primary truncate">
              {article.title}
            </span>
            <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 group-hover:text-primary" />
          </Link>
        ))}
      </div>
    </div>
  );
}
