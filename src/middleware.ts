import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const url = request.nextUrl
    const hostname = request.headers.get('host') || ''

    // Get the root domain - this should be configured in env, or fallback to localhost
    // We assume development on localhost:3000 and production on maindomain.com
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'

    // Define what constitutes a subdomain
    // If hostname is distinct from rootDomain and not 'www'
    // Note: Localhost handling is tricky. Usually "sub.localhost:3000"
    let isSubdomain = false
    if (hostname === rootDomain || hostname === 'www.' + rootDomain || hostname === 'localhost:3000') {
        isSubdomain = false
    } else {
        // Basic check: does it end with the root domain?
        // And is it not just the root domain?
        const rootDomainNoPort = rootDomain.split(':')[0]
        const hostnameNoPort = hostname.split(':')[0]

        if (hostname.startsWith('www.') || hostnameNoPort === 'opbase.in') {
            isSubdomain = false
        } else if (hostnameNoPort !== rootDomainNoPort && hostnameNoPort.endsWith(rootDomainNoPort)) {
            isSubdomain = true
        } else if (hostnameNoPort !== 'localhost' && rootDomainNoPort === 'localhost') {
            // Handle localhost subdomains specifically if needed, e.g. "test.localhost"
            isSubdomain = true
        }
    }

    const path = url.pathname

    if (isSubdomain) {
        // On a subdomain
        // If trying to access the owner login or root, redirect to storefront login
        if (path === '/login' || path === '/') {
            return NextResponse.redirect(new URL('/storefront/login', request.url))
        }
    } else {
        // On the main domain
        // If trying to access storefront login, redirect to owner login (optional cleanup)
        if (path === '/storefront/login') {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files (svg, png, jpg, etc.)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
