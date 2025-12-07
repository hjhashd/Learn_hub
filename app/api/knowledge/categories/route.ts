import { NextResponse } from 'next/server';
import { getCategoriesFromFiles } from '@/lib/fileStorage';

// GET /api/knowledge/categories - 获取分类统计
export async function GET() {
  try {
    const categories = await getCategoriesFromFiles();
    // 确保返回正确的 JSON 格式，避免编码问题
    return new NextResponse(JSON.stringify({ categories }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}