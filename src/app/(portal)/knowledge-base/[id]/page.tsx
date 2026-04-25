// === ARTICLE DETAIL (FR-12: Full article view with metadata and feedback) ===

'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { useState } from 'react';
import { useArticle, useCategories } from '@/hooks/use-articles';
import { CreateTicketDialog } from '@/components/tickets/CreateTicketDialog';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorState } from '@/components/ui/error-state';
import { formatDate, safeHtml } from '@/lib/format';
import { useAuth } from '@/lib/auth';

export default function ArticleDetailsPage() {
  const { isAgent } = useAuth();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const params = useParams();
  const articleId = params?.id as string;
  const { data: article, isLoading, error } = useArticle(articleId);
  const { data: categoryMap } = useCategories();

  const categoryName = article?.category && categoryMap?.[article.category] || article?.category || 'General';
  const isUnpublished = article && article.status !== 'Published';

  return (
    <>
      {/* Header Bar */}
      <div className="h-12 flex items-center px-6 border-b border-border">
        <Link href="/knowledge-base">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Knowledge Base
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto bg-background">
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
              <CardHeader className="pt-8 pb-4">
                <div className="space-y-3">
                  {/* Category Badge */}
                  <div className="flex items-center space-x-2">
                    {article.category && (
                      <Badge variant="outline">{categoryName}</Badge>
                    )}
                  </div>

                  {/* Title */}
                  <CardTitle className="text-2xl md:text-3xl leading-tight">
                    {article.title}
                  </CardTitle>

                  {/* Meta Information */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
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
                  className="prose max-w-none prose-zinc prose-headings:text-foreground prose-a:text-primary"
                  dangerouslySetInnerHTML={{ __html: safeHtml(article.content) }}
                />
              </CardContent>
            </Card>

            {/* Need More Help */}
            {!isAgent && (
              <Card className="mt-8">
                <CardContent className="py-4">
                  <div className="text-center">
                    <h3 className="text-lg font-medium mb-3 text-foreground">
                      Can&apos;t find what you&apos;re looking for?
                    </h3>
                    <div className="flex flex-col items-center gap-2">
                      <Button onClick={() => setShowCreateDialog(true)}>Create a ticket</Button>
                      <CreateTicketDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
                      <span className="text-sm text-muted-foreground">
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
