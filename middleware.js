// Entry point for Next.js middleware.
// Auth logic lives in proxy.js — edit that file, not this one.
//
// The config.matcher MUST be defined statically here.
// Defining it in proxy.js and re-exporting it prevents Next.js from
// reading the matcher at compile time, causing middleware to run on
// every route — including /_next/static/* CSS and image assets.
export { middleware } from './proxy.js'

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
