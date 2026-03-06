import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadToR2, generateAvatarKey, deleteFromR2 } from '@/lib/r2'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Always use the authenticated provider's own ID — ignore any client-supplied providerId
    const providerId = session.user.id

    // Validate MIME type (declared by browser)
    const allowedTypes: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    }
    if (!allowedTypes[file.type]) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Use a safe, hardcoded extension derived from the validated MIME type
    const extension = allowedTypes[file.type]
    const key = generateAvatarKey(providerId, extension)

    // Upload to R2
    const url = await uploadToR2(buffer, key, file.type)

    // Update provider's avatar URL in database
    const provider = await prisma.provider.update({
      where: { id: providerId },
      data: { avatarUrl: url },
      select: {
        id: true,
        avatarUrl: true,
        fullName: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        url,
        provider,
      },
    })
  } catch (error: any) {
    console.error('Avatar upload error:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const providerId = session.user.id

    // Get current avatar URL
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: { avatarUrl: true },
    })

    if (!provider || !provider.avatarUrl) {
      return NextResponse.json(
        { error: 'No avatar to delete' },
        { status: 404 }
      )
    }

    // Extract key from URL — handle both absolute URLs and legacy relative paths
    let key: string
    try {
      key = new URL(provider.avatarUrl).pathname.substring(1)
    } catch {
      key = provider.avatarUrl.startsWith('/') ? provider.avatarUrl.substring(1) : provider.avatarUrl
    }

    // Delete from R2
    await deleteFromR2(key)

    // Remove from database
    await prisma.provider.update({
      where: { id: providerId },
      data: { avatarUrl: null },
    })

    return NextResponse.json({
      success: true,
      message: 'Avatar deleted successfully',
    })
  } catch (error: any) {
    console.error('Avatar deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete avatar' },
      { status: 500 }
    )
  }
}
