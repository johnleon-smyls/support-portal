import { NextRequest, NextResponse } from 'next/server';

const FRAPPE_BASE_URL =
  process.env.FRAPPE_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_FRAPPE_BASE_URL ||
  'http://localhost:4000';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  // Auth check: require a valid session cookie
  const cookie = request.headers.get('cookie') || '';
  if (!cookie.includes('sid=') || cookie.includes('sid=Guest')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const params = await context.params;
    const filePath = params.path?.join('/') || '';

    // Validate path — no traversal
    if (filePath.includes('..') || filePath.includes('\\')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const frappeFileUrl = `${FRAPPE_BASE_URL}/private/files/${filePath}`;

    // Forward the user's own session cookie
    const response = await fetch(frappeFileUrl, {
      headers: { Cookie: cookie },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: response.status }
      );
    }

    const fileData = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    return new NextResponse(fileData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('[File Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy file' },
      { status: 500 }
    );
  }
}
