import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('🔍 [DEBUG] Simple undo test route called')
  return NextResponse.json({ message: 'Simple undo test working' })
}
