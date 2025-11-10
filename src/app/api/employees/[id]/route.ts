import { NextRequest, NextResponse } from 'next/server'
import { withCors } from '@/lib/middleware'
import { db } from '@/lib/db'

export const DELETE = withCors(async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.employee.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete employee:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})