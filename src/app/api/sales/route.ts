import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const employeeId = searchParams.get('employeeId')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    // Build where clause
    const whereClause: any = {}
    
    if (startDate || endDate) {
      whereClause.createdAt = {}
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        whereClause.createdAt.lte = new Date(endDate)
      }
    }
    
    if (employeeId) {
      whereClause.employeeId = employeeId
    }

    // Get sales with enhanced data
    const sales = await db.sale.findMany({
      where: whereClause,
      include: {
        employee: {
          select: { 
            id: true, 
            name: true, 
            mobile: true 
          }
        },
        items: {
          include: {
            product: {
              select: { 
                id: true, 
                name: true, 
                price: true 
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      ...(limit && { take: limit }),
      skip: offset
    })

    // Get total count for pagination
    const totalCount = await db.sale.count({ where: whereClause })

    // Calculate analytics
    const totalRevenue = sales.reduce((sum, sale) => 
      sum + (sale.customTotal || sale.totalAmount), 0
    )

    const todayRevenue = sales.filter(sale => 
      new Date(sale.createdAt).toDateString() === new Date().toDateString()
    ).reduce((sum, sale) => sum + (sale.customTotal || sale.totalAmount), 0)

    // Top products
    const productSales: { [key: string]: { name: string; quantity: number; revenue: number } } = {}
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { 
            name: item.product.name, 
            quantity: 0, 
            revenue: 0 
          }
        }
        productSales[item.productId].quantity += item.quantity
        productSales[item.productId].revenue += (item.customPrice || item.unitPrice) * item.quantity
      })
    })

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    return NextResponse.json({
      sales,
      analytics: {
        totalCount,
        totalRevenue,
        todayRevenue,
        topProducts,
        averageOrderValue: sales.length > 0 ? totalRevenue / sales.length : 0
      }
    })
  } catch (error) {
    console.error('Failed to fetch sales:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Failed to fetch sales data'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { employeeId, items, totalAmount, customTotal, notes } = await request.json()
    
    // Enhanced validation
    if (!employeeId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ 
        error: 'Validation failed',
        message: 'Employee ID and items are required'
      }, { status: 400 })
    }

    // Validate each item
    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return NextResponse.json({ 
          error: 'Validation failed',
          message: 'Each item must have a valid product ID and quantity'
        }, { status: 400 })
      }
    }

    // Check if employee exists and is active
    const employee = await db.employee.findUnique({
      where: { id: employeeId, isActive: true }
    })

    if (!employee) {
      return NextResponse.json({ 
        error: 'Validation failed',
        message: 'Invalid or inactive employee'
      }, { status: 400 })
    }

    // Check product availability and calculate totals
    let calculatedTotal = 0
    const validatedItems = []

    for (const item of items) {
      const product = await db.product.findUnique({
        where: { id: item.productId, isActive: true }
      })

      if (!product) {
        return NextResponse.json({ 
          error: 'Validation failed',
          message: `Product ${item.productId} not found or inactive`
        }, { status: 400 })
      }

      const unitPrice = item.customPrice || product.price
      calculatedTotal += unitPrice * item.quantity

      validatedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
        customPrice: item.customPrice
      })
    }

    // Validate total amount
    if (totalAmount && Math.abs(totalAmount - calculatedTotal) > 0.01) {
      return NextResponse.json({ 
        error: 'Validation failed',
        message: 'Total amount does not match calculated total'
      }, { status: 400 })
    }

    // Create sale with transaction
    const sale = await db.sale.create({
      data: {
        employeeId,
        totalAmount: calculatedTotal,
        customTotal: customTotal || null,
        notes: notes || null,
        items: {
          create: validatedItems
        }
      },
      include: {
        employee: {
          select: { 
            id: true, 
            name: true 
          }
        },
        items: {
          include: {
            product: {
              select: { 
                id: true, 
                name: true 
              }
            }
          }
        }
      }
    })

    // Update product sales count (if you have a salesCount field)
    for (const item of validatedItems) {
      await db.product.update({
        where: { id: item.productId },
        data: {
          // If you have a salesCount field, increment it
          // salesCount: { increment: item.quantity }
        }
      })
    }

    // Return enhanced response
    return NextResponse.json({
      success: true,
      sale: {
        ...sale,
        itemCount: sale.items.length,
        totalAmount: sale.customTotal || sale.totalAmount
      },
      message: 'Sale completed successfully'
    })
  } catch (error) {
    console.error('Failed to create sale:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Failed to complete sale'
    }, { status: 500 })
  }
}