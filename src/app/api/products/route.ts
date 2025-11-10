import { NextRequest, NextResponse } from 'next/server'
import { withCors } from '@/lib/middleware'
import { db } from '@/lib/db'

export const GET = withCors(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const isActive = searchParams.get('isActive')
    const category = searchParams.get('category')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
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
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (category) {
      whereClause.category = category
    }

    if (minPrice || maxPrice) {
      whereClause.price = {}
      if (minPrice) {
        whereClause.price.gte = parseFloat(minPrice)
      }
      if (maxPrice) {
        whereClause.price.lte = parseFloat(maxPrice)
      }
    }

    // Get products with enhanced data
    const products = await db.product.findMany({
      where: whereClause,
      orderBy: { [sortBy]: sortOrder },
      take: limit,
      skip: offset
    })

    // Get total count for pagination
    const totalCount = await db.product.count({ where: whereClause })

    // Calculate analytics
    const totalProducts = await db.product.count()
    const activeCount = await db.product.count({ where: { isActive: true } })
    const inactiveCount = totalProducts - activeCount

    // Calculate price ranges
    const allProducts = await db.product.findMany({
      select: { price: true }
    })
    
    const prices = allProducts.map(p => p.price)
    const avgPrice = prices.length > 0 ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0
    const minPriceAll = prices.length > 0 ? Math.min(...prices) : 0
    const maxPriceAll = prices.length > 0 ? Math.max(...prices) : 0

    // Get low stock products (if you have a stock field)
    const lowStockProducts = await db.product.count({
      where: {
        isActive: true,
        // stock: { lte: 10 } // Uncomment if you have a stock field
      }
    })

    return NextResponse.json({
      products,
      analytics: {
        totalCount,
        totalProducts,
        activeCount,
        inactiveCount,
        avgPrice,
        minPrice: minPriceAll,
        maxPrice: maxPriceAll,
        lowStockCount: lowStockProducts
      }
    })
  } catch (error) {
    console.error('Failed to fetch products:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Failed to fetch products'
    }, { status: 500 })
  }
})

export const POST = withCors(async (request: NextRequest) => {
  try {
    const { name, price, description, category, image, sku, barcode, cost, stock, tags } = await request.json()
    
    // Enhanced validation
    if (!name || !price) {
      return NextResponse.json({ 
        error: 'Validation failed',
        message: 'Product name and price are required'
      }, { status: 400 })
    }

    const parsedPrice = parseFloat(price)
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return NextResponse.json({ 
        error: 'Validation failed',
        message: 'Price must be a positive number'
      }, { status: 400 })
    }

    // Validate SKU if provided
    if (sku) {
      const existingSku = await db.product.findUnique({
        where: { sku: sku.trim() }
      })

      if (existingSku) {
        return NextResponse.json({ 
          error: 'Validation failed',
          message: 'Product with this SKU already exists'
        }, { status: 400 })
      }
    }

    // Validate barcode if provided
    if (barcode) {
      const existingBarcode = await db.product.findFirst({
        where: { barcode: barcode.trim() }
      })

      if (existingBarcode) {
        return NextResponse.json({ 
          error: 'Validation failed',
          message: 'Product with this barcode already exists'
        }, { status: 400 })
      }
    }

    // Validate stock if provided
    let parsedStock = undefined
    if (stock !== undefined) {
      parsedStock = parseInt(stock)
      if (isNaN(parsedStock) || parsedStock < 0) {
        return NextResponse.json({ 
          error: 'Validation failed',
          message: 'Stock must be a non-negative integer'
        }, { status: 400 })
      }
    }

    // Validate cost if provided
    let parsedCost = undefined
    if (cost !== undefined) {
      parsedCost = parseFloat(cost)
      if (isNaN(parsedCost) || parsedCost < 0) {
        return NextResponse.json({ 
          error: 'Validation failed',
          message: 'Cost must be a non-negative number'
        }, { status: 400 })
      }
    }

    // Create product with enhanced data
    const product = await db.product.create({
      data: {
        name: name.trim(),
        price: parsedPrice,
        description: description?.trim() || null,
        category: category?.trim() || null,
        image: image?.trim() || null,
        sku: sku?.trim() || null,
        barcode: barcode?.trim() || null,
        cost: parsedCost,
        stock: parsedStock,
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : null,
        isActive: true
      }
    })

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        description: product.description,
        category: product.category,
        image: product.image,
        sku: product.sku,
        barcode: product.barcode,
        cost: product.cost,
        stock: product.stock,
        tags: product.tags,
        isActive: product.isActive,
        createdAt: product.createdAt
      },
      message: 'Product created successfully'
    })
  } catch (error) {
    console.error('Failed to create product:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Failed to create product'
    }, { status: 500 })
  }
})