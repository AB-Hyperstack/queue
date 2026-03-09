/**
 * Mock for next-intl/middleware — returns a pass-through middleware for tests.
 */
import { NextResponse, type NextRequest } from 'next/server';

export default function createIntlMiddleware() {
  return (request: NextRequest) => NextResponse.next({ request });
}
