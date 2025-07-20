import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

export function middleware(req: NextRequest) {
  const cookie = getSessionCookie(req)
  if (!cookie) {
    return NextResponse.redirect(new URL('/', req.url))
  }
  return NextResponse.next()
}

export const config = { matcher: ['/dashboard'] }