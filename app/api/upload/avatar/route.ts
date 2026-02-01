import { NextRequest, NextResponse } from 'next/server'
import { uploadToR2, generateAvatarKey, deleteFromR2 } from '@/lib/r2'
import { prisma } from '@/lib/prisma'

/**
 * Upload Avatar API Route
 * POST /api/upload/avatar
 *
 * Handles profile picture uploads to Cloudflare R2
 */
export async function POST(req: NextRequest) {
  try {
    // TODO: Add authentication check here
    // const session = await getServerSession(authOptions)
    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const providerId = formData.get('providerId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique key
    const extension = file.type.split('/')[1]
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

/**
 * Delete Avatar
 * DELETE /api/upload/avatar
 */
export async function DELETE(req: NextRequest) {
  try {
    // TODO: Add authentication check

    const { searchParams } = new URL(req.url)
    const providerId = searchParams.get('providerId')

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      )
    }

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

    // Extract key from URL
    const url = new URL(provider.avatarUrl)
    const key = url.pathname.substring(1) // Remove leading slash

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
