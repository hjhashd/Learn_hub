import path from 'path'
import fs from 'fs/promises'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const form = await request.formData()
  const file = form.get('file')
  if (!file || typeof file === 'string') {
    return Response.json({ success: false, error: 'No file' }, { status: 400 })
  }

  const f = file as File
  const ext = path.extname(f.name || '').toLowerCase() || '.png'
  const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
  const dir = path.join(process.cwd(), 'data', 'images')
  await fs.mkdir(dir, { recursive: true })
  const buf = Buffer.from(await f.arrayBuffer())
  await fs.writeFile(path.join(dir, name), buf)
  const url = `/api/images/${encodeURIComponent(name)}`
  return Response.json({ success: true, url, filename: name })
}

