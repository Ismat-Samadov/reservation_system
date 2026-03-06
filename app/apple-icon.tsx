import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '40px',
        }}
      >
        {/* Calendar icon */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '110px',
            height: '100px',
            background: 'white',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              height: '30px',
              background: 'rgba(255,255,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'white', marginRight: '8px' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'white' }} />
          </div>
          {/* Dot grid */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#2563eb' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#2563eb' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#c7d2fe' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#c7d2fe' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#2563eb' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#c7d2fe' }} />
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
