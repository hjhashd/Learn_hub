import path from 'path'
import fs from 'fs/promises'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getContentType(ext: string) {
  switch (ext.toLowerCase()) {
    case '.png': return 'image/png'
    case '.jpg':
    case '.jpeg': return 'image/jpeg'
    case '.gif': return 'image/gif'
    case '.webp': return 'image/webp'
    case '.svg': return 'image/svg+xml'
    default: return 'application/octet-stream'
  }
}

export async function GET(req: Request, { params }: { params: { filename: string } }) {
  const filePath = path.join(process.cwd(), 'data', 'images', params.filename)
  try {
    const buf = await fs.readFile(filePath)
    const ext = path.extname(params.filename)
    return new Response(buf, {
      headers: {
        'Content-Type': getContentType(ext),
        'Cache-Control': 'public, max-age=31536000'
      }
    })
  } catch {
    return new Response('Not Found', { status: 404 })
  }
}

