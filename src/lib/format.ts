export function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&hellip;/g, '...');
}

export function truncateText(
  content: string | undefined,
  maxLength: number = 200,
  fallback: string = 'No content available'
): string {
  if (!content) return fallback;

  let text = stripHtml(content);
  text = decodeHtmlEntities(text).replace(/\s+/g, ' ').trim();

  if (!text) return fallback;
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function transformFrappeUrls(html: string): string {
  if (!html) return html;
  const frappeBaseUrl = process.env.NEXT_PUBLIC_FRAPPE_BASE_URL || '';
  return html.replace(
    /src="(\/files\/[^"]+)"/g,
    `src="${frappeBaseUrl}$1"`
  );
}

/**
 * Sanitize HTML to prevent XSS. Use this before passing any user/server
 * content to dangerouslySetInnerHTML.
 *
 * Allows safe HTML tags (p, a, img, strong, em, etc.) but strips
 * scripts, event handlers, and other dangerous content.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  // Dynamic import would be cleaner but DOMPurify is small and we use it everywhere
  const DOMPurify = require('isomorphic-dompurify').default;
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['target', 'allowfullscreen', 'frameborder'],
  });
}

/** Sanitize + transform Frappe URLs. The standard pipeline for rendering Frappe HTML. */
export function safeHtml(html: string): string {
  return sanitizeHtml(transformFrappeUrls(html));
}
