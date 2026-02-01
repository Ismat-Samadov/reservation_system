'use client'

import { useState, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Camera, Loader2, Trash2, User } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface AvatarUploadProps {
  currentAvatarUrl?: string | null
  providerId: string
  providerName: string
  onUploadSuccess?: (url: string) => void
  onDeleteSuccess?: () => void
}

export function AvatarUpload({
  currentAvatarUrl,
  providerId,
  providerName,
  onUploadSuccess,
  onDeleteSuccess,
}: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl || null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPEG, PNG, or WebP image.',
        variant: 'destructive',
      })
      return
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 5MB.',
        variant: 'destructive',
      })
      return
    }

    // Upload file
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('providerId', providerId)

      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setAvatarUrl(data.data.url)
      onUploadSuccess?.(data.data.url)

      toast({
        title: 'Success',
        description: 'Profile picture updated successfully!',
      })
    } catch (error: any) {
      console.error('Upload error:', error)
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload profile picture',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async () => {
    if (!avatarUrl) return

    setDeleting(true)
    try {
      const response = await fetch(
        `/api/upload/avatar?providerId=${providerId}`,
        {
          method: 'DELETE',
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Delete failed')
      }

      setAvatarUrl(null)
      onDeleteSuccess?.()

      toast({
        title: 'Success',
        description: 'Profile picture removed successfully!',
      })
    } catch (error: any) {
      console.error('Delete error:', error)
      toast({
        title: 'Delete failed',
        description: error.message || 'Failed to remove profile picture',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  const getInitials = () => {
    return providerName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className="h-32 w-32">
          <AvatarImage src={avatarUrl || undefined} alt={providerName} />
          <AvatarFallback className="bg-blue-100 text-blue-600 text-3xl">
            {getInitials()}
          </AvatarFallback>
        </Avatar>

        {/* Camera button overlay */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || deleting}
          className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Upload photo"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Camera className="h-5 w-5" />
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading || deleting}
        />
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || deleting}
          variant="outline"
          size="sm"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Camera className="mr-2 h-4 w-4" />
              Change Photo
            </>
          )}
        </Button>

        {avatarUrl && (
          <Button
            onClick={handleDelete}
            disabled={uploading || deleting}
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700"
          >
            {deleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Removing...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </>
            )}
          </Button>
        )}
      </div>

      <p className="text-sm text-gray-500 text-center">
        Recommended: Square image, at least 400x400px
        <br />
        Max size: 5MB (JPEG, PNG, or WebP)
      </p>
    </div>
  )
}
