import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateRequest, AuthenticatedUser } from '@/src/lib/auth-middleware';
import { validateImageFile, processScheduleImage, getFileExtension, normalizeMimeType } from '@/src/lib/image-utils';

export async function POST(request: NextRequest) {
  try {
    console.log('Schedule upload request received');
    
    // Check Authorization header
    const authHeader = request.headers.get('authorization');
    console.log('Authorization header:', authHeader ? 'Present' : 'Missing');
    
    // Authenticate user
    const user = await authenticateRequest(request);
    if (!user) {
      console.log('Authentication failed - no user returned');
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    console.log('User authenticated:', user.id);

    // Initialize Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const tournamentId = formData.get('tournamentId') as string;
    const isSequential = formData.get('isSequential') === 'true';

    console.log('Form data received, file:', file ? `${file.name} (${file.size} bytes)` : 'none');
    console.log('Tournament ID:', tournamentId);
    console.log('Is Sequential:', isSequential);

    if (!file) {
      console.log('No file provided in form data');
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 });
    }

    if (!tournamentId) {
      console.log('No tournament ID provided');
      return NextResponse.json({
        success: false,
        error: 'Tournament ID is required'
      }, { status: 400 });
    }

    // Check if user is the tournament host or admin
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('host_id')
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !tournament) {
      return NextResponse.json({
        success: false,
        error: 'Tournament not found'
      }, { status: 404 });
    }

    // Check if user is admin or tournament host
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({
        success: false,
        error: 'User profile not found'
      }, { status: 404 });
    }

    const isAdmin = userProfile.role === 'admin';
    const isHost = tournament.host_id === user.id && userProfile.role === 'host';

    if (!isAdmin && !isHost) {
      return NextResponse.json({
        success: false,
        error: 'Only tournament hosts and admins can upload schedules'
      }, { status: 403 });
    }

    // Validate the file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: validation.error
      }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process the image (preserve aspect ratio for schedules)
    const processedImage = await processScheduleImage(buffer, {
      maxWidth: 1200,
      maxHeight: 800,
      quality: 90,
      format: 'jpeg'
    });

    // Generate filename
    const fileExtension = getFileExtension(file.type);
    const normalizedMimeType = normalizeMimeType(file.type);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const filename = `tournament-schedules/${tournamentId}/${timestamp}-${random}.${fileExtension}`;

    // Upload to Supabase Storage
    console.log('Uploading to Supabase Storage:', filename, 'MIME type:', normalizedMimeType);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('tournament-schedules')
      .upload(filename, processedImage.buffer, {
        contentType: normalizedMimeType,
        upsert: true // Replace existing file
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({
        success: false,
        error: 'Failed to upload image to storage',
        details: uploadError.message
      }, { status: 500 });
    }

    console.log('Upload successful:', uploadData);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('tournament-schedules')
      .getPublicUrl(filename);

    const publicUrl = urlData.publicUrl;

    // Get current tournament data to update schedule_images array
    // For sequential uploads, we need to be more careful about race conditions
    let retryCount = 0;
    const maxRetries = 3;
    let updateSuccess = false;
    
    while (!updateSuccess && retryCount < maxRetries) {
      const { data: currentTournament, error: fetchError } = await supabase
        .from('tournaments')
        .select('schedule_image_url, schedule_images')
        .eq('id', tournamentId)
        .single();

      if (fetchError) {
        console.error('Error fetching tournament:', fetchError);
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch tournament data'
        }, { status: 500 });
      }

      // Build the updated schedule_images array
      const existingImages = currentTournament.schedule_images || [];
      const existingSingleImage = currentTournament.schedule_image_url ? [currentTournament.schedule_image_url] : [];
      const allImages = [...existingSingleImage, ...existingImages, publicUrl];
      const uniqueImages = Array.from(new Set(allImages)); // Remove duplicates

      console.log('Current images array:', existingImages);
      console.log('Current single image:', existingSingleImage);
      console.log('New URL to add:', publicUrl);
      console.log('All images after update:', uniqueImages);
      console.log('Will set schedule_image_url:', !currentTournament.schedule_image_url ? publicUrl : 'keeping existing');

      // Update tournament with new schedule URL and images array
      // Only set schedule_image_url if it's the first image, otherwise just update the array
      const updateData: any = {
        schedule_images: uniqueImages,
        updated_at: new Date().toISOString()
      };
      
      // Only set schedule_image_url if there's no existing primary image
      if (!currentTournament.schedule_image_url) {
        updateData.schedule_image_url = publicUrl;
      }
      
      const { error: updateError } = await supabase
        .from('tournaments')
        .update(updateData)
        .eq('id', tournamentId);

      if (updateError) {
        console.error('Update error (attempt', retryCount + 1, '):', updateError);
        retryCount++;
        if (retryCount < maxRetries) {
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 200));
          continue;
        } else {
          return NextResponse.json({
            success: false,
            error: 'Failed to update tournament schedule after multiple attempts'
          }, { status: 500 });
        }
      } else {
        updateSuccess = true;
        console.log('Successfully updated tournament with', uniqueImages.length, 'images');
      }
    }

    console.log('Schedule uploaded successfully');

    return NextResponse.json({
      success: true,
      url: publicUrl,
      message: 'Schedule uploaded successfully'
    });

  } catch (error: any) {
    console.error('Schedule upload error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('Schedule delete request received');
    
    // Check Authorization header
    const authHeader = request.headers.get('authorization');
    console.log('Authorization header:', authHeader ? 'Present' : 'Missing');
    
    // Authenticate user
    const user = await authenticateRequest(request);
    if (!user) {
      console.log('Authentication failed - no user returned');
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    console.log('User authenticated:', user.id);

    // Initialize Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Parse request body
    const body = await request.json();
    const { tournamentId, imageUrl, clearAll } = body;

    console.log('Delete request - Tournament ID:', tournamentId, 'Image URL:', imageUrl, 'Clear All:', clearAll);

    if (!tournamentId) {
      return NextResponse.json({
        success: false,
        error: 'Tournament ID is required'
      }, { status: 400 });
    }

    if (!clearAll && !imageUrl) {
      return NextResponse.json({
        success: false,
        error: 'Either image URL or clearAll flag is required'
      }, { status: 400 });
    }

    // Check if user is the tournament host or admin
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('host_id')
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !tournament) {
      return NextResponse.json({
        success: false,
        error: 'Tournament not found'
      }, { status: 404 });
    }

    // Check if user is admin or tournament host
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({
        success: false,
        error: 'User profile not found'
      }, { status: 404 });
    }

    const isAdmin = userProfile.role === 'admin';
    const isHost = tournament.host_id === user.id && userProfile.role === 'host';

    if (!isAdmin && !isHost) {
      return NextResponse.json({
        success: false,
        error: 'Only tournament hosts and admins can delete schedules'
      }, { status: 403 });
    }

    if (clearAll) {
      // Clear all schedule images for the tournament
      const { data: currentTournament, error: fetchError } = await supabase
        .from('tournaments')
        .select('schedule_image_url, schedule_images')
        .eq('id', tournamentId)
        .single();

      if (fetchError) {
        console.error('Error fetching tournament:', fetchError);
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch tournament data'
        }, { status: 500 });
      }

      // Collect all image URLs to delete from storage
      const allImageUrls = []
      if (currentTournament.schedule_image_url) {
        allImageUrls.push(currentTournament.schedule_image_url)
      }
      if (currentTournament.schedule_images) {
        allImageUrls.push(...currentTournament.schedule_images)
      }

      // Delete all files from storage
      if (allImageUrls.length > 0) {
        const filePaths = allImageUrls
          .map(url => url.split('/storage/v1/object/public/tournament-schedules/')[1])
          .filter(path => path); // Remove any undefined paths

        if (filePaths.length > 0) {
          const { error: storageError } = await supabase.storage
            .from('tournament-schedules')
            .remove(filePaths);

          if (storageError) {
            console.error('Storage deletion error:', storageError);
            // Continue with database update even if storage deletion fails
          } else {
            console.log('Files deleted from storage:', filePaths);
          }
        }
      }

      // Clear all schedule data from database
      const { error: updateError } = await supabase
        .from('tournaments')
        .update({ 
          schedule_image_url: null,
          schedule_images: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', tournamentId);

      if (updateError) {
        console.error('Update error:', updateError);
        return NextResponse.json({
          success: false,
          error: 'Failed to clear tournament schedules'
        }, { status: 500 });
      }

      console.log('All schedule images cleared successfully');

      return NextResponse.json({
        success: true,
        message: 'All schedule images cleared successfully'
      });
    }

    // Single image deletion logic
    // Extract file path from URL for storage deletion
    const filePath = imageUrl.split('/storage/v1/object/public/tournament-schedules/')[1];
    
    if (filePath) {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('tournament-schedules')
        .remove([filePath]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
        // Continue with database update even if storage deletion fails
      } else {
        console.log('File deleted from storage:', filePath);
      }
    }

    // Get current tournament data
    const { data: currentTournament, error: fetchError } = await supabase
      .from('tournaments')
      .select('schedule_image_url, schedule_images')
      .eq('id', tournamentId)
      .single();

    if (fetchError) {
      console.error('Error fetching tournament:', fetchError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch tournament data'
      }, { status: 500 });
    }

    // Remove the image from the arrays
    const updatedImages = (currentTournament.schedule_images || []).filter((url: string) => url !== imageUrl);
    const updatedSingleImage = currentTournament.schedule_image_url === imageUrl ? null : currentTournament.schedule_image_url;

    // Update tournament with removed image
    const { error: updateError } = await supabase
      .from('tournaments')
      .update({ 
        schedule_image_url: updatedSingleImage || (updatedImages.length > 0 ? updatedImages[0] : null),
        schedule_images: updatedImages.length > 0 ? updatedImages : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', tournamentId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Failed to update tournament schedule'
      }, { status: 500 });
    }

    console.log('Schedule image deleted successfully');

    return NextResponse.json({
      success: true,
      message: 'Schedule image deleted successfully'
    });

  } catch (error: any) {
    console.error('Schedule delete error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
