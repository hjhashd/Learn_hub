import { NextRequest, NextResponse } from 'next/server';
import { getAllKnowledgeFromFiles, saveKnowledgeToFile, searchKnowledge } from '@/lib/fileStorage';

// GET /api/knowledge - 获取所有知识条目
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    let knowledge;
    if (query) {
      knowledge = await searchKnowledge(query);
    } else {
      knowledge = await getAllKnowledgeFromFiles();
    }
    
    // 确保返回正确的 JSON 格式，避免编码问题
    return new NextResponse(JSON.stringify({ knowledge }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Failed to fetch knowledge:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge' },
      { status: 500 }
    );
  }
}

// POST /api/knowledge - 创建新知识条目
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const knowledge = await saveKnowledgeToFile(body);
    return NextResponse.json({ knowledge });
  } catch (error) {
    console.error('Failed to create knowledge:', error);
    return NextResponse.json(
      { error: 'Failed to create knowledge' },
      { status: 500 }
    );
  }
}