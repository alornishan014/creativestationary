import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    let settings = await db.shopSettings.findFirst()
    
    if (!settings) {
      settings = await db.shopSettings.create({
        data: { name: 'My Shop' }
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Failed to fetch shop settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { name, phone, address } = await request.json()
    
    let settings = await db.shopSettings.findFirst()
    
    if (settings) {
      settings = await db.shopSettings.update({
        where: { id: settings.id },
        data: { name, phone, address }
      })
    } else {
      settings = await db.shopSettings.create({
        data: { name, phone, address }
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Failed to update shop settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}