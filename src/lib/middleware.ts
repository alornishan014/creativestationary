import { NextRequest, NextResponse } from 'next/server'

// Rate limiting storage (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limiting configuration
const RATE_LIMIT = {
	windowMs: 15 * 60 * 1000, // 15 minutes
	maxRequests: 100, // Maximum requests per window
}

// CORS configuration
const configuredOrigins = (process.env.NEXT_PUBLIC_ALLOWED_ORIGINS || '')
	.split(',')
	.map((o) => o.trim())
	.filter(Boolean)

const corsConfig = {
	origin:
		process.env.NODE_ENV === 'production'
			? configuredOrigins.length ? configuredOrigins : ['*']
			: ['http://localhost:3000', 'http://127.0.0.1:3000'],
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
	credentials: true,
}

// Security headers
const securityHeaders: Record<string, string> = {
	'X-Content-Type-Options': 'nosniff',
	'X-Frame-Options': 'DENY',
	'X-XSS-Protection': '1; mode=block',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
}

export function withRateLimit(handler: (req: NextRequest) => Promise<NextResponse>) {
	return async (req: NextRequest) => {
		const clientIp = (req as any).ip || req.headers.get('x-forwarded-for') || 'unknown'

		// Get or create rate limit entry for this IP
		let record = rateLimitStore.get(clientIp)

		if (!record) {
			record = { count: 0, resetTime: Date.now() + RATE_LIMIT.windowMs }
			rateLimitStore.set(clientIp, record)
		}

		// Reset if window has expired
		if (Date.now() > record.resetTime) {
			record = { count: 0, resetTime: Date.now() + RATE_LIMIT.windowMs }
			rateLimitStore.set(clientIp, record)
		}

		// Check if rate limit exceeded
		if (record.count >= RATE_LIMIT.maxRequests) {
			return NextResponse.json(
				{
					error: 'Rate limit exceeded',
					message: 'Too many requests. Please try again later.',
					retryAfter: Math.ceil((record.resetTime - Date.now()) / 1000),
				},
				{
					status: 429,
					headers: {
						'Retry-After': Math.ceil((record.resetTime - Date.now()) / 1000).toString(),
					},
				}
			)
		}

		// Increment request count
		record.count++
		rateLimitStore.set(clientIp, record)

		return handler(req)
	}
}

export function withCors(handler: (req: NextRequest) => Promise<NextResponse>) {
	return async (req: NextRequest) => {
		// Handle preflight requests
		if (req.method === 'OPTIONS') {
			return new NextResponse(null, { status: 200 })
		}

		const response = await handler(req)

		// Add security headers
		Object.entries(securityHeaders).forEach(([key, value]) => {
			response.headers.set(key, value)
		})

		// Add CORS headers
		const origin = req.headers.get('origin') || '*'
		if (corsConfig.origin.includes('*') || corsConfig.origin.includes(origin)) {
			response.headers.set('Access-Control-Allow-Origin', origin === '*' ? '*' : origin)
		}
		response.headers.set('Access-Control-Allow-Methods', corsConfig.methods.join(', '))
		response.headers.set('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '))
		response.headers.set('Access-Control-Allow-Credentials', 'true')

		return response
	}
}

export function withErrorHandler(handler: (req: NextRequest) => Promise<NextResponse>) {
	return async (req: NextRequest) => {
		try {
			return await handler(req)
		} catch (error) {
			console.error('API Error:', error)

			// In production, you might want to send this to a logging service
			if (process.env.NODE_ENV === 'production') {
				console.error('Production Error:', JSON.stringify({
					message: error instanceof Error ? error.message : 'Unknown error',
					url: req.url,
					method: req.method,
					timestamp: new Date().toISOString(),
				}))
			}

			if (error instanceof SyntaxError) {
				return NextResponse.json(
					{
						error: 'Invalid request format',
						message: 'The request contains invalid data',
					},
					{ status: 400 }
				)
			}

			if ((error as any)?.name === 'ValidationError') {
				return NextResponse.json(
					{
						error: 'Validation failed',
						message: (error as any).message || 'Request validation failed',
					},
					{ status: 400 }
				)
			}

			return NextResponse.json(
				{
					error: 'Internal server error',
					message:
						process.env.NODE_ENV === 'production'
							? 'Something went wrong'
							: error instanceof Error
							? error.message
							: 'Internal server error',
				},
				{ status: 500 }
			)
		}
	}
}

// Utility log helper
export function logRequest(req: NextRequest, context: string) {
	const timestamp = new Date().toISOString()
	const method = req.method
	const url = req.url
	const userAgent = req.headers.get('user-agent') || 'Unknown'
	console.log(`[${timestamp}] ${method} ${url} - ${context} - ${userAgent}`)
}