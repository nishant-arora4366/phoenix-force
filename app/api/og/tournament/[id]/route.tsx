import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/src/lib/supabaseClient'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Fetch tournament data from database
    const supabase = getSupabaseClient()
    const { data: tournament, error } = await supabase
      .from('tournaments')
      .select('name, slug, format, tournament_date, venue, status, total_slots, selected_teams')
      .eq('id', id)
      .single()

    if (error || !tournament) {
      // If tournament not found, return a generic Phoenix Force image
      const genericHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Phoenix Force Cricket</title>
            <style>
              body {
                margin: 0;
                padding: 0;
                width: 1200px;
                height: 630px;
                background: linear-gradient(135deg, #19171b 0%, #2b0307 50%, #51080d 100%);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-family: Arial, sans-serif;
                position: relative;
                overflow: hidden;
              }
              .background-pattern {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-image: radial-gradient(circle at 1px 1px, rgba(117,2,15,0.1) 1px, transparent 0);
                background-size: 20px 20px;
                opacity: 0.3;
              }
              .content {
                position: relative;
                z-index: 1;
                text-align: center;
              }
              .logo {
                width: 150px;
                height: 150px;
                object-fit: contain;
                filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
                margin-bottom: 30px;
              }
              .title {
                font-size: 48px;
                font-weight: bold;
                color: #DBD0C0;
                text-shadow: 0 2px 4px rgba(0,0,0,0.5);
              }
            </style>
          </head>
          <body>
            <div class="background-pattern"></div>
            <div class="content">
              <img src="/logo.png" alt="Phoenix Force Logo" class="logo" />
              <div class="title">Phoenix Force Cricket</div>
            </div>
          </body>
        </html>
      `
      
      return new NextResponse(genericHtml, {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }

    const tournamentDate = new Date(tournament.tournament_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    // Create a simple OG image with just Phoenix Force logo and home page background
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Phoenix Force - ${tournament.name}</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              width: 1200px;
              height: 630px;
              background: linear-gradient(135deg, #19171b 0%, #2b0307 50%, #51080d 100%);
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              font-family: Arial, sans-serif;
              position: relative;
              overflow: hidden;
            }
            .background-pattern {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background-image: radial-gradient(circle at 1px 1px, rgba(117,2,15,0.1) 1px, transparent 0);
              background-size: 20px 20px;
              opacity: 0.3;
            }
            .content {
              position: relative;
              z-index: 1;
              text-align: center;
            }
            .logo {
              width: 200px;
              height: 200px;
              object-fit: contain;
              filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
              margin-bottom: 30px;
            }
            .title {
              font-size: 48px;
              font-weight: bold;
              color: #DBD0C0;
              text-shadow: 0 2px 4px rgba(0,0,0,0.5);
            }
          </style>
        </head>
        <body>
          <div class="background-pattern"></div>
          <div class="content">
            <img src="/logo.png" alt="Phoenix Force Logo" class="logo" />
            <div class="title">${tournament.name}</div>
          </div>
        </body>
      </html>
    `

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Error generating tournament OG image:', error)
    
    // Always return Phoenix Force logo with home page background, even on error
    const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Phoenix Force Cricket</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              width: 1200px;
              height: 630px;
              background: linear-gradient(135deg, #19171b 0%, #2b0307 50%, #51080d 100%);
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              font-family: Arial, sans-serif;
              position: relative;
              overflow: hidden;
            }
            .background-pattern {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background-image: radial-gradient(circle at 1px 1px, rgba(117,2,15,0.1) 1px, transparent 0);
              background-size: 20px 20px;
              opacity: 0.3;
            }
            .content {
              position: relative;
              z-index: 1;
              text-align: center;
            }
            .logo {
              width: 150px;
              height: 150px;
              object-fit: contain;
              filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
              margin-bottom: 30px;
            }
            .title {
              font-size: 48px;
              font-weight: bold;
              color: #DBD0C0;
              text-shadow: 0 2px 4px rgba(0,0,0,0.5);
            }
          </style>
        </head>
        <body>
          <div class="background-pattern"></div>
          <div class="content">
            <img src="/logo.png" alt="Phoenix Force Logo" class="logo" />
            <div class="title">Phoenix Force Cricket</div>
          </div>
        </body>
      </html>
    `

    return new NextResponse(errorHtml, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }
}
