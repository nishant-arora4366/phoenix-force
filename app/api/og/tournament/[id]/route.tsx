import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { getSupabaseClient } from '@/src/lib/supabaseClient'

export const runtime = 'edge'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getSupabaseClient()
    
    const { data: tournament, error } = await supabase
      .from('tournaments')
      .select('name, slug, format, tournament_date, venue, status, total_slots, selected_teams')
      .eq('id', id)
      .single()

    if (error || !tournament) {
      return new ImageResponse(
        (
          <div
            style={{
              height: '100%',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#19171b',
              backgroundImage: 'linear-gradient(135deg, #19171b 0%, #2b0307 50%, #51080d 100%)',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#DBD0C0',
                fontSize: 48,
                fontWeight: 'bold',
                textAlign: 'center',
              }}
            >
              <div style={{ color: '#CEA17A', marginBottom: 20 }}>🏏</div>
              <div>Tournament Not Found</div>
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      )
    }

    const tournamentDate = new Date(tournament.tournament_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#19171b',
            backgroundImage: 'linear-gradient(135deg, #19171b 0%, #2b0307 50%, #51080d 100%)',
            position: 'relative',
          }}
        >
          {/* Background Pattern */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(117,2,15,0.1) 1px, transparent 0)',
              backgroundSize: '20px 20px',
              opacity: 0.3,
            }}
          />
          
          {/* Main Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              padding: '60px',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Cricket Icon */}
            <div
              style={{
                fontSize: 80,
                marginBottom: 30,
                color: '#CEA17A',
              }}
            >
              🏏
            </div>
            
            {/* Tournament Name */}
            <div
              style={{
                fontSize: 56,
                fontWeight: 'bold',
                color: '#DBD0C0',
                textAlign: 'center',
                marginBottom: 20,
                maxWidth: '1000px',
                lineHeight: 1.2,
              }}
            >
              {tournament.name}
            </div>
            
            {/* Tournament Details */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 15,
                color: '#CEA17A',
                fontSize: 24,
                textAlign: 'center',
              }}
            >
              <div>{tournament.format} Tournament</div>
              <div>{tournamentDate}</div>
              {tournament.venue && <div>📍 {tournament.venue}</div>}
              <div
                style={{
                  display: 'flex',
                  gap: 30,
                  marginTop: 20,
                  fontSize: 20,
                  color: '#DBD0C0',
                }}
              >
                <div>👥 {tournament.selected_teams}/{tournament.total_slots} Teams</div>
                <div
                  style={{
                    backgroundColor: tournament.status === 'open' ? '#22c55e' : '#f59e0b',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: 16,
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                  }}
                >
                  {tournament.status}
                </div>
              </div>
            </div>
            
            {/* Phoenix Force Branding */}
            <div
              style={{
                position: 'absolute',
                bottom: 40,
                right: 40,
                color: '#CEA17A',
                fontSize: 18,
                fontWeight: 'bold',
              }}
            >
              Phoenix Force Cricket
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error) {
    console.error('Error generating tournament OG image:', error)
    
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#19171b',
            color: '#DBD0C0',
            fontSize: 48,
            fontWeight: 'bold',
          }}
        >
          <div style={{ color: '#CEA17A', marginBottom: 20 }}>🏏</div>
          <div>Phoenix Force Cricket</div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  }
}
