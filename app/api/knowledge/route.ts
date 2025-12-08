import { NextRequest, NextResponse } from 'next/server';
import { getAllKnowledgeFromFiles, saveKnowledgeToFile, searchKnowledge, getKnowledgeByIdFromFiles, deleteKnowledgeFromFiles } from '@/lib/fileStorage';

// GET /api/knowledge - 获取所有知识条目
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      const item = getKnowledgeByIdFromFiles(id);
      if (item) {
        return NextResponse.json(item);
      }
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const query = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    let result;
    if (query) {
      // Search currently doesn't support pagination in the underlying function, but we can wrap it
      const items = await searchKnowledge(query);
      result = {
        knowledge: items,
        total: items.length,
        page: 1,
        limit: items.length
      };
    } else {
      const { items, total } = await getAllKnowledgeFromFiles(page, limit);
      result = {
        knowledge: items,
        total,
        page,
        limit
      };
    }
    
    // 确保返回正确的 JSON 格式，避免编码问题
    return new NextResponse(JSON.stringify(result), {
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
    const { directory, ...knowledgeData } = body;
    const knowledge = await saveKnowledgeToFile(knowledgeData, directory);
    return NextResponse.json({ knowledge });
  } catch (error) {
    console.error('Failed to create knowledge:', error);
    return NextResponse.json(
      { error: 'Failed to create knowledge' },
      { status: 500 }
    );
  }
}

// DELETE /api/knowledge - 删除知识条目
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID parameter is required' },
        { status: 400 }
      );
    }

    // 使用fileStorage中的删除功能
    const result = await deleteKnowledgeFromFiles(id);
    
    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to delete knowledge' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Failed to delete knowledge:', error);
    return NextResponse.json(
      { error: 'Failed to delete knowledge' },
      { status: 500 }
    );
  }
}