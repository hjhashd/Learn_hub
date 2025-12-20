import { NextRequest, NextResponse } from 'next/server'
import { getAllPromptsFromFiles, savePromptToFile, searchPrompts, getPromptByIdFromFiles, deletePromptFromFiles } from '@/lib/fileStorage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (id) {
      const item = getPromptByIdFromFiles(id)
      if (item) return NextResponse.json(item)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const query = searchParams.get('q')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    let result
    if (query) {
      const items = await searchPrompts(query)
      result = { prompts: items, total: items.length, page: 1, limit: items.length }
    } else {
      const { items, total } = await getAllPromptsFromFiles(page, limit)
      result = { prompts: items, total, page, limit }
    }

    return new NextResponse(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    })
  } catch (error) {
    console.error('Failed to fetch prompts:', error)
    return NextResponse.json({ error: 'Failed to fetch prompts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const prompt = savePromptToFile(body)
    return NextResponse.json({ prompt })
  } catch (error) {
    console.error('Failed to save prompt:', error)
    return NextResponse.json({ error: 'Failed to save prompt' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID parameter is required' }, { status: 400 })

    const result = await deletePromptFromFiles(id)
    if (result.success) return NextResponse.json({ success: true })
    return NextResponse.json({ error: result.error || 'Failed to delete prompt' }, { status: 404 })
  } catch (error) {
    console.error('Failed to delete prompt:', error)
    return NextResponse.json({ error: 'Failed to delete prompt' }, { status: 500 })
  }
}
