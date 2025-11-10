import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const isActive = searchParams.get('isActive')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build where clause
    const whereClause: any = {}
    
    if (isActive !== null) {
      whereClause.isActive = isActive === 'true'
    }
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get employees with sales count
    const employees = await db.employee.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { sales: true }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      take: limit,
      skip: offset
    })

    // Get total count for pagination
    const totalCount = await db.employee.count({ where: whereClause })

    // Calculate additional analytics
    const totalSales = await db.sale.count({
      where: {
        employee: {
          isActive: true
        }
      }
    })

    const activeCount = await db.employee.count({
      where: { isActive: true }
    })

    return NextResponse.json({
      employees,
      analytics: {
        totalCount,
        totalSales,
        activeCount,
        inactiveCount: totalCount - activeCount
      }
    })
  } catch (error) {
    console.error('Failed to fetch employees:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Failed to fetch employees'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, mobile, email, address, hireDate } = await request.json()
    
    // Enhanced validation
    if (!name || !mobile) {
      return NextResponse.json({ 
        error: 'Validation failed',
        message: 'Name and mobile number are required'
      }, { status: 400 })
    }

    // Validate mobile number format (basic validation)
    const mobileRegex = /^[0-9+\-\s()]+$/
    if (!mobileRegex.test(mobile)) {
      return NextResponse.json({ 
        error: 'Validation failed',
        message: 'Invalid mobile number format'
      }, { status: 400 })
    }

    // Check if mobile number already exists
    const existingEmployee = await db.employee.findUnique({
      where: { mobile: mobile.trim() }
    })

    if (existingEmployee) {
      return NextResponse.json({ 
        error: 'Validation failed',
        message: 'Employee with this mobile number already exists'
      }, { status: 400 })
    }

    // Validate email if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json({ 
          error: 'Validation failed',
          message: 'Invalid email format'
        }, { status: 400 })
      }

      // Check if email already exists
      const existingEmail = await db.employee.findFirst({
        where: { email: email.trim() }
      })

      if (existingEmail) {
        return NextResponse.json({ 
          error: 'Validation failed',
          message: 'Email already exists'
        }, { status: 400 })
      }
    }

    // Create employee with enhanced data
    const employee = await db.employee.create({
      data: {
        name: name.trim(),
        mobile: mobile.trim(),
        email: email?.trim() || null,
        address: address?.trim() || null,
        hireDate: hireDate ? new Date(hireDate) : new Date(),
        isActive: true
      }
    })

    return NextResponse.json({
      success: true,
      employee: {
        id: employee.id,
        name: employee.name,
        mobile: employee.mobile,
        email: employee.email,
        address: employee.address,
        hireDate: employee.hireDate,
        isActive: employee.isActive,
        createdAt: employee.createdAt
      },
      message: 'Employee created successfully'
    })
  } catch (error) {
    console.error('Failed to create employee:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Failed to create employee'
    }, { status: 500 })
  }
}