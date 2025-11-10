import { NextRequest, NextResponse } from 'next/server'

// Rate limiting storage (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limiting configuration
const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100 // Maximum requests per window
}

// CORS configuration
const corsConfig = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] // Add your production domains
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}

// Security headers
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
}

export function withRateLimit(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown'
    
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
          retryAfter: Math.ceil((record.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((record.resetTime - Date.now()) / 1000).toString()
          }
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

    // Add CORS headers
    const response = await handler(req)
    
    // Add security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    // Add CORS headers
    if (corsConfig.origin.length > 0) {
      const origin = req.headers.get('origin')
      if (corsConfig.origin.includes(origin || '')) {
        response.headers.set('Access-Control-Allow-Origin', origin)
      }
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
      
      // Log detailed error information
      const errorDetails = {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString(),
        userAgent: req.headers.get('user-agent')
      }

      // In production, you might want to send this to a logging service
      if (process.env.NODE_ENV === 'production') {
        // Send to your logging service
        console.error('Production Error:', JSON.stringify(errorDetails, null, 2))
      }

      // Return appropriate error response
      if (error instanceof SyntaxError) {
        return NextResponse.json(
          { 
            error: 'Invalid request format',
            message: 'The request contains invalid data'
          },
          { status: 400 }
        )
      }

      if (error.name === 'ValidationError') {
        return NextResponse.json(
          { 
            error: 'Validation failed',
            message: error.message || 'Request validation failed'
          },
          { status: 400 }
        )
      }

      // Generic server error
      return NextResponse.json(
        { 
          error: 'Internal server error',
          message: process.env.NODE_ENV === 'production' 
            ? '      { 
          error: 'Internal server error',
          message: process.env.NODE_ENV === 'production' 
            ? 'Something went wrong' 
            : error.message || 'Internal server error'
        }
        },
        { status: 500 }
      )
    }
  }
}

// Production-ready error handler
export function handleApiError(error: unknown, context: string): never {
  if (error instanceof Error) {
    console.error(`Error in ${context}:`, {
      name: error.name,
      message: error.message,
      stack: error.stack
    })
    throw error
  }
}

// Request validator
export function validateRequest(data: any, schema: Record<string, any>): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field]
    
    // Required field validation
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`)
      continue
    }
    
    // Type validation
    if (value !== undefined && value !== null) {
      if (rules.type === 'string' && typeof value !== 'string') {
        errors.push(`${field} must be a string`)
      }
      
      if (rules.type === 'number' && (typeof value !== 'number' || isNaN(value))) {
        errors.push(`${field} must be a number`)
      }
      
      if (rules.type === 'boolean' && typeof value !== 'boolean') {
        errors.push(`${field} must be a boolean`)
      }
      
      if (rules.type === 'array' && !Array.isArray(value)) {
        errors.push(`${field} must be an array`)
      }
      
      if (rules.type === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
        errors.push(`${field} must be an object`)
      }
    }
    
    // Custom validation
    if (rules.custom && value !== undefined && value !== null) {
      const customResult = rules.custom(value)
      if (customResult !== true) {
        errors.push(`${field}: ${customResult}`)
      }
    }
    
    // Length validation
    if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
      errors.push(`${field} must be at least ${rules.minLength} characters long`)
    }
    
    if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
      errors.push(`${field} must be no more than ${rules.maxLength} characters long`)
    }
    
    // Range validation for numbers
    if (rules.min !== undefined && typeof value === 'number' && value < rules.min) {
      errors.push(`${field} must be at least ${rules.min}`)
    }
    
    if (rules.max !== undefined && typeof value === 'number' && value > rules.max) {
      errors.push(`${field} must be no more than ${rules.max}`)
    }
    
    // Pattern validation for strings
    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
      errors.push(`${field} format is invalid`)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Sanitize input data
export function sanitizeInput(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeInput(item))
  }
  
  const sanitized: any = {}
  
  for (const [key, value] of Object.entries(data)) {
    // Remove potentially dangerous characters
    if (typeof value === 'string') {
      sanitized[key] = value
        .replace(/[<>]/g, '') // Remove HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .trim()
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized
}

export function logRequest(req: NextRequest, context: string) {
  const timestamp = new Date().toISOString()
  const method = req.method
  const url = req.url
  const userAgent = req.headers.get('user-agent') || 'Unknown'
  
  console.log(`[${timestamp}] ${method} ${url} - ${context} - ${userAgent}`)
}