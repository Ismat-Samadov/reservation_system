import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
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
          borderRadius: '7px',
        }}
      >
        {/* Calendar icon simplified for 32px */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
          }}
        >
          <div
            style={{
              width: '18px',
              height: '16px',
              background: 'white',
              borderRadius: '2px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div style={{ height: '5px', background: 'rgba(255,255,255,0.35)', display: 'flex' }} />
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                paddingTop: '1px',
              }}
            >
              <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#2563eb' }} />
              <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#2563eb' }} />
              <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#c7d2fe' }} />
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
