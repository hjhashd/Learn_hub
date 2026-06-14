import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { createReadStream } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const filePathArray = params.path;
  if (!filePathArray || filePathArray.length < 2) {
    return new NextResponse('Invalid path', { status: 400 });
  }

  const category = filePathArray[0];
  const fileName = filePathArray.slice(1).join('/');
  const fullPath = path.join(process.cwd(), 'data', 'docs', category, fileName);

  try {
    await fs.access(fullPath);
    const stats = await fs.stat(fullPath);
    const fileBuffer = await fs.readFile(fullPath);

    let contentType = 'application/octet-stream';
    if (fileName.endsWith('.pdf')) contentType = 'application/pdf';
    else if (fileName.endsWith('.doc')) contentType = 'application/msword';
    else if (fileName.endsWith('.docx')) contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (fileName.endsWith('.xls')) contentType = 'application/vnd.ms-excel';
    else if (fileName.endsWith('.xlsx')) contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    else if (fileName.endsWith('.ppt')) contentType = 'application/vnd.ms-powerpoint';
    else if (fileName.endsWith('.pptx')) contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': stats.size.toString(),
        'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`
      },
    });
  } catch (error) {
    return new NextResponse('File not found', { status: 404 });
  }
}
