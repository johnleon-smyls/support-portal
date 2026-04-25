// === ARTICLE DETAIL (FR-12: Full article view with metadata and feedback) ===

'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { useArticle, useCategories } from '@/hooks/use-articles';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorState } from '@/components/ui/error-state';
import { BRAND_PRIMARY, FONT_FAMILY } from '@/lib/theme';
import { formatDate } from '@/lib/format';

export default function ArticleDetailsPage() {
  const params = useParams();
  const articleId = params?.id as string;
  const { data: article, isLoading, error } = useArticle(articleId);
  const { data: categoryMap } = useCategories();

  const categoryName = article?.category && categoryMap?.[article.category] || article?.category || 'General';
  const isUnpublished = article && article.status !== 'Published';

  return (
    <>
      {/* Header Bar */}
      <div className="h-12 flex items-center px-6 border-b border-gray-200">
        <Link href="/knowledge-base">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Knowledge Base
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto" style={{ background: '#FFF' }}>
        {isLoading ? (
          <div className="py-12">
            <LoadingSpinner message="Loading article..." />
          </div>
        ) : error ? (
          <ErrorState
            message={(error as Error).message || 'Failed to load article'}
            backLink={{ href: '/knowledge-base', label: 'Back to Knowledge Base' }}
          />
        ) : isUnpublished ? (
          <ErrorState
            message="This article is not available or has not been published yet"
            backLink={{ href: '/knowledge-base', label: 'Back to Knowledge Base' }}
          />
        ) : !article ? (
          <ErrorState
            message="Article not found"
            backLink={{ href: '/knowledge-base', label: 'Back to Knowledge Base' }}
          />
        ) : (
          <div className="max-w-4xl mx-auto">
            {/* Article Header */}
            <Card className="mb-6">
              <CardHeader>
                <div className="space-y-4">
                  {/* Category and Status Badges */}
                  <div className="flex items-center space-x-2">
                    {article.category && (
                      <Badge variant="outline">{categoryName}</Badge>
                    )}
                    <Badge
                      variant="secondary"
                      className="text-white border-none"
                      style={{ background: BRAND_PRIMARY }}
                    >
                      {article.status}
                    </Badge>
                  </div>

                  {/* Title */}
                  <CardTitle className="text-2xl md:text-3xl leading-tight">
                    {article.title}
                  </CardTitle>

                  {/* Meta Information */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span>By {article.author || article.owner || 'Unknown'}</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Published {article.creation ? formatDate(article.creation) : 'No date'}
                      </span>
                    </div>

                    {article.modified && article.modified !== article.creation && (
                      <div className="flex items-center space-x-1">
                        <span>Updated {formatDate(article.modified)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Article Content */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div
                  className="prose max-w-none prose-gray prose-headings:text-gray-900 prose-a:text-blue-600"
                  dangerouslySetInnerHTML={{ __html: article.content }}
                />
              </CardContent>
            </Card>

            {/* Need More Help */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <p className="text-gray-600">
                    If this article didn&apos;t solve your problem, our support team is here to help.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Link href="/tickets/new">
                      <Button>Create Support Ticket</Button>
                    </Link>
                    <Link href="/knowledge-base">
                      <Button variant="outline">Browse More Articles</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            {article.tags && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {article.tags.split(',').map((tag: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </>
  );
}
