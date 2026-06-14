import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('OnlyOffice Callback:', body);
    
    // Status 2 is "ready for saving"
    // Status 6 is "force save"
    // For now, we just acknowledge the callback
    return NextResponse.json({ error: 0 });
  } catch (error) {
    console.error('OnlyOffice Callback Error:', error);
    return NextResponse.json({ error: 1, message: 'Callback failed' }, { status: 500 });
  }
}
