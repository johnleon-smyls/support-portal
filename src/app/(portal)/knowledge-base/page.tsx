// === KNOWLEDGE BASE (FR-10: Browse published articles, FR-11: Search articles by keyword) ===

'use client';

import { useMemo, useCallback, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, BookOpen, Calendar, ThumbsUp } from 'lucide-react';
import { useArticles, useCategories } from '@/hooks/use-articles';
import { useDebouncedSearch } from '@/hooks/use-debounced-search';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { BRAND_GRADIENT, BRAND_PRIMARY } from '@/lib/theme';
import { truncateText, formatDate } from '@/lib/format';
import { HDArticle } from '@/types/frappe';
import { useAuth } from '@/lib/auth';

export default function KnowledgeBasePage() {
  const { isAgent } = useAuth();
  const { data, isLoading, error } = useArticles();
  const { data: categoryMap } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Resolve category ID to display name
  const getCategoryName = useCallback(
    (id: string | undefined) => (id && categoryMap?.[id]) || id || 'General',
    [categoryMap]
  );

  // Filter for published articles only
  const publishedArticles = useMemo(() => {
    return (data || []).filter((a: HDArticle) => a.status === 'Published');
  }, [data]);

  const filterFn = useCallback(
    (article: HDArticle, q: string) => {
      const lower = q.toLowerCase();
      return (
        article.title.toLowerCase().includes(lower) ||
        article.content?.toLowerCase().includes(lower) ||
        getCategoryName(article.category).toLowerCase().includes(lower)
      );
    },
    [getCategoryName]
  );

  const { query, setQuery, results, clearSearch } = useDebouncedSearch<HDArticle>({
    items: publishedArticles,
    filterFn,
  });

  // Unique categories from published articles (display names)
  const categories = useMemo(() => {
    const ids = [...new Set(publishedArticles.map((a: HDArticle) => a.category).filter(Boolean))] as string[];
    return ids.map((id) => ({ id, name: getCategoryName(id) }));
  }, [publishedArticles, getCategoryName]);

  const handleCategoryClick = (categoryId: string) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory(null);
      clearSearch();
    } else {
      setSelectedCategory(categoryId);
      setQuery(getCategoryName(categoryId));
    }
  };

  const handleClearSearch = () => {
    setSelectedCategory(null);
    clearSearch();
  };

  return (
    <>
      {/* Header Bar */}
      <div className="h-12 flex items-center justify-between px-6 border-b border-gray-200">
        <h1
          className="text-xl font-medium text-foreground"
        >
          Knowledge Base
        </h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto" style={{ background: '#FFF' }}>
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search articles, solutions, and guides..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!categories.some(c => c.name === e.target.value)) setSelectedCategory(null);
              }}
              className="pl-10 h-10 rounded-lg border-gray-300"
            />
          </div>

          {categories.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Popular Categories:</p>
              <div className="flex flex-wrap gap-2">
                {categories.slice(0, 6).map((cat) => (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleCategoryClick(cat.id)}
                    style={{
                      background: selectedCategory === cat.id ? BRAND_GRADIENT : 'transparent',
                      borderColor: BRAND_PRIMARY,
                      color: selectedCategory === cat.id ? 'white' : BRAND_PRIMARY,
                    }}
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && <ErrorState message={(error as Error).message || 'Failed to load articles'} />}

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {query ? `Search Results for "${query}"` : 'All Articles'}
            </h2>
            <p className="text-sm text-gray-600">
              {results.length} {results.length === 1 ? 'article' : 'articles'} found
            </p>
          </div>
          {query && (
            <Button variant="outline" onClick={handleClearSearch}>
              Clear Search
            </Button>
          )}
        </div>

        {/* Articles Grid */}
        {isLoading ? (
          <div className="py-12">
            <LoadingSpinner message="Loading articles..." />
          </div>
        ) : results.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={query ? 'No articles found' : 'No articles available'}
            description={
              query
                ? 'Try adjusting your search terms or browse all articles'
                : 'Check back later for helpful guides and solutions'
            }
            action={
              query ? (
                <Button onClick={handleClearSearch}>View All Articles</Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((article) => (
              <Link key={article.name} href={`/knowledge-base/${article.name}`}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle
                        className="text-lg line-clamp-2 flex-1 text-foreground"
                      >
                        {article.title || 'Untitled Article'}
                      </CardTitle>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{article.creation ? formatDate(article.creation) : 'No date'}</span>
                      </div>
                    </div>

                    <Badge className="w-fit mt-2">
                      {getCategoryName(article.category)}
                    </Badge>
                  </CardHeader>

                  <CardContent>
                    <p className="text-gray-600 text-sm line-clamp-3">
                      {truncateText(article.content)}
                    </p>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>By {article.author || article.owner || 'Unknown'}</span>
                      </div>

                      {(article.helpful_count || article.not_helpful_count) && (
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <ThumbsUp className="h-4 w-4" />
                          <span>{article.helpful_count || 0}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Help Section */}
        {!isAgent && (
          <Card className="mt-8">
            <CardContent className="py-4">
              <div className="text-center">
                <h3
                  className="text-lg font-medium mb-3 text-foreground"
                >
                  Can&apos;t find what you&apos;re looking for?
                </h3>
                <div className="flex flex-col items-center gap-2">
                  <Link href="/tickets/new">
                    <Button>Create a ticket</Button>
                  </Link>
                  <span className="text-sm text-gray-600">
                    Contact us:{' '}
                    <a href="mailto:support@smyls.ca" className="text-primary hover:underline">
                      support@smyls.ca
                    </a>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
