import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export const dynamic = 'force-dynamic';

export async function GET() {
  const docsDir = path.join(process.cwd(), 'data', 'docs');
  const categories = ['word', 'excel', 'pdf', 'ppt'];
  const result: any[] = [];

  try {
    for (const category of categories) {
      const categoryDir = path.join(docsDir, category);
      try {
        const files = await fs.readdir(categoryDir);
        for (const file of files) {
          const filePath = path.join(categoryDir, file);
          const stats = await fs.stat(filePath);
          if (stats.isFile()) {
            result.push({
              name: file,
              category: category,
              size: stats.size,
              mtime: stats.mtime,
              birthtime: stats.birthtime,
              extension: path.extname(file).toLowerCase(),
              path: `${category}/${file}`,
              url: `/api/docs/raw/${category}/${encodeURIComponent(file)}`
            });
          }
        }
      } catch (err) {
        // Directory might not exist or other error
        console.error(`Error reading ${categoryDir}:`, err);
      }
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to list documents' }, { status: 500 });
  }
}
