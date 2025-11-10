import { NextRequest, NextResponse } from 'next/server'
import { withCors } from '@/lib/middleware'
import { db } from '@/lib/db'

export const POST = withCors(async (request: NextRequest) => {
  try {
    const { mobile } = await request.json()
    
    if (!mobile) {
      return NextResponse.json({ error: 'Mobile number is required' }, { status: 400 })
    }

    const employee = await db.employee.findUnique({
      where: { mobile, isActive: true }
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: employee.id,
      name: employee.name,
      mobile: employee.mobile
    })
  } catch (error) {
    console.error('Employee login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})