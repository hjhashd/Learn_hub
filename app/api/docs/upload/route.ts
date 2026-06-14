import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const docsDir = path.join(process.cwd(), 'data', 'docs');
    const results = [];

    for (const file of files) {
      const ext = path.extname(file.name).toLowerCase();
      let category = '';

      if (['.doc', '.docx', '.rtf', '.txt'].includes(ext)) {
        category = 'word';
      } else if (['.xls', '.xlsx', '.csv'].includes(ext)) {
        category = 'excel';
      } else if (['.ppt', '.pptx'].includes(ext)) {
        category = 'ppt';
      } else if (ext === '.pdf') {
        category = 'pdf';
      } else {
        results.push({ name: file.name, success: false, error: `Unsupported file type: ${ext}` });
        continue;
      }

      const categoryDir = path.join(docsDir, category);
      await fs.mkdir(categoryDir, { recursive: true });

      const filePath = path.join(categoryDir, file.name);
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(filePath, buffer);

      results.push({ name: file.name, success: true, category });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
