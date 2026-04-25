// API Proxy — forwards browser requests to Frappe with cookie-based auth.
// No admin credentials needed; the user's session cookie handles auth.

import { NextRequest, NextResponse } from 'next/server';

const FRAPPE_BASE_URL =
  process.env.FRAPPE_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_FRAPPE_BASE_URL ||
  'https://intern-dev.frappe.cloud';

const DEBUG = process.env.NEXT_PUBLIC_API_DEBUG === 'true';

async function proxyToFrappe(
  request: NextRequest,
  method: string,
  path: string
): Promise<NextResponse> {
  const url = new URL(`${FRAPPE_BASE_URL}/api/${path}`);

  // Forward query params for GET requests
  if (method === 'GET') {
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });
  }

  const contentType = request.headers.get('content-type') || '';
  const isMultipart = contentType.includes('multipart/form-data');

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  // For multipart, forward the original Content-Type (includes boundary)
  // For everything else, set JSON
  if (isMultipart) {
    headers['Content-Type'] = contentType;
  } else {
    headers['Content-Type'] = 'application/json';
  }

  // Forward cookies for session auth
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    headers['Cookie'] = cookieHeader;
  }

  // Read body for non-GET requests
  // For multipart, forward the raw body; for JSON, forward as text
  let body: BodyInit | undefined;
  if (method !== 'GET') {
    body = isMultipart ? await request.arrayBuffer() : await request.text();
  }

  if (DEBUG) {
    console.log(`[API Proxy] ${method} ${url.toString()}`);
  }

  try {
    const response = await fetch(url.toString(), {
      method,
      headers,
      body,
    });

    const data = await response.text();

    if (DEBUG) {
      console.log(`[API Proxy] ${response.status} ${method} ${path}`);
    }

    const nextResponse = new NextResponse(data, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });

    // Forward Set-Cookie headers from Frappe back to browser
    for (const cookie of response.headers.getSetCookie()) {
      nextResponse.headers.append('Set-Cookie', cookie);
    }

    return nextResponse;
  } catch (error) {
    console.error('[API Proxy] Error:', error);
    return NextResponse.json(
      { message: 'Proxy request failed' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyToFrappe(request, 'GET', path.join('/'));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyToFrappe(request, 'POST', path.join('/'));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyToFrappe(request, 'PUT', path.join('/'));
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyToFrappe(request, 'DELETE', path.join('/'));
}
