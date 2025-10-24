import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateRequest, AuthenticatedUser } from '@/src/lib/auth-middleware';
import { processProfileImage, validateImageFile, generateProfilePictureFilename, getFileExtension, calculateCompressionRatio } from '@/src/lib/image-utils';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    logger.debug('Profile picture upload request received');
    
    // Authenticate user
    const user = await authenticateRequest(request);
    if (!user) {
      logger.warn('Authentication failed');
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    logger.debug('User authenticated:', user.id);

    // Initialize Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if user has a player profile
    const { data: playerProfile, error: playerError } = await supabase
      .from('players')
      .select('id, profile_pic_url')
      .eq('user_id', user.id)
      .single();

    if (playerError || !playerProfile) {
      return NextResponse.json({
        success: false,
        error: 'Player profile not found. Please create a player profile first.'
      }, { status: 404 });
    }

    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('profilePicture') as File;

    logger.debug('Form data received, file:', file ? `${file.name} (${file.size} bytes)` : 'none');

    if (!file) {
      logger.warn('No file provided in form data');
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 });
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

    // Process the image
    const processedImage = await processProfileImage(buffer, {
      width: 400,
      height: 400,
      quality: 85,
      format: 'jpeg'
    });

    // Generate filename
    const fileExtension = getFileExtension(file.type);
    const filename = generateProfilePictureFilename(user.id, fileExtension);

    // Upload to Supabase Storage
    console.log('Uploading to Supabase Storage:', filename);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('player-profiles')
      .upload(filename, processedImage.buffer, {
        contentType: `image/${fileExtension}`,
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
      .from('player-profiles')
      .getPublicUrl(filename);

    const publicUrl = urlData.publicUrl;

    // Update player profile with new image URL
    const { error: updateError } = await supabase
      .from('players')
      .update({ 
        profile_pic_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', playerProfile.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Failed to update player profile'
      }, { status: 500 });
    }

    // Calculate compression stats
    const compressionRatio = calculateCompressionRatio(buffer.length, processedImage.buffer.length);

    return NextResponse.json({
      success: true,
      data: {
        url: publicUrl,
        filename: filename,
        metadata: {
          originalSize: buffer.length,
          compressedSize: processedImage.buffer.length,
          compressionRatio: compressionRatio,
          dimensions: {
            width: processedImage.metadata.width,
            height: processedImage.metadata.height
          },
          format: processedImage.metadata.format
        }
      }
    });

  } catch (error: any) {
    console.error('Profile picture upload error:', error);
    console.error('Error stack:', error.stack);
    
    // Handle specific error types
    if (error.message && error.message.includes('Image processing failed')) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 400 });
    }

    if (error.message && error.message.includes('File too large')) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 413 });
    }

    if (error.message && error.message.includes('Invalid file type')) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}

// Handle DELETE request to remove profile picture
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get player profile
    const { data: playerProfile, error: playerError } = await supabase
      .from('players')
      .select('id, profile_pic_url')
      .eq('user_id', user.id)
      .single();

    if (playerError || !playerProfile) {
      return NextResponse.json({
        success: false,
        error: 'Player profile not found'
      }, { status: 404 });
    }

    if (!playerProfile.profile_pic_url) {
      return NextResponse.json({
        success: false,
        error: 'No profile picture to delete'
      }, { status: 400 });
    }

    // Extract filename from URL
    const urlParts = playerProfile.profile_pic_url.split('/');
    const filename = urlParts[urlParts.length - 1];
    const fullPath = `${user.id}/${filename}`;

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from('player-profiles')
      .remove([fullPath]);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      // Continue with database update even if storage delete fails
    }

    // Update player profile to remove image URL
    const { error: updateError } = await supabase
      .from('players')
      .update({ 
        profile_pic_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', playerProfile.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Failed to update player profile'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile picture deleted successfully'
    });

  } catch (error: any) {
    console.error('Profile picture delete error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
