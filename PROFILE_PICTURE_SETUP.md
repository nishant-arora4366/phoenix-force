# Profile Picture Upload Setup Guide

This guide will help you set up the profile picture upload functionality for Phoenix Force.

## 🚀 **Quick Setup**

### 1. **Supabase Storage Configuration**

You need to manually create the storage bucket in your Supabase dashboard:

1. **Go to your Supabase Dashboard**
2. **Navigate to Storage**
3. **Create a new bucket** with these settings:
   - **Name**: `player-profiles` (or use existing bucket)
   - **Public**: ✅ **Yes** (checked)
   - **File size limit**: `15728640` bytes (15MB)
   - **Allowed MIME types**: `image/jpeg,image/jpg,image/png,image/webp`

### 2. **Run Storage Setup Script**

```bash
cd database-setup
node setup-storage.js
```

This will set up the RLS policies and helper functions.

### 3. **Manual SQL Setup (Alternative)**

If the script doesn't work, run this SQL in your Supabase SQL Editor:

```sql
-- Create storage bucket for profile pictures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-pictures',
  'profile-pictures',
  true,
  15728640, -- 15MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to upload their own profile pictures
CREATE POLICY "Users can upload their own profile pictures" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND auth.role() = 'authenticated'
);

-- Policy: Allow users to update their own profile pictures
CREATE POLICY "Users can update their own profile pictures" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND auth.role() = 'authenticated'
);

-- Policy: Allow users to delete their own profile pictures
CREATE POLICY "Users can delete their own profile pictures" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND auth.role() = 'authenticated'
);

-- Policy: Allow public read access to profile pictures
CREATE POLICY "Profile pictures are publicly readable" ON storage.objects
FOR SELECT USING (
  bucket_id = 'profile-pictures'
);
```

## 📋 **Features Implemented**

### ✅ **What's Working**

1. **File Upload Component**
   - Drag & drop support
   - File validation (type, size)
   - Image preview
   - Progress indicators
   - Error handling

2. **Image Processing**
   - Automatic compression to 400x400px
   - Quality optimization (85%)
   - Format conversion to JPEG
   - 15MB upload limit (as requested)

3. **Storage Management**
   - Secure file storage in Supabase
   - User-specific file organization
   - Automatic cleanup of old images
   - Public URL generation

4. **UI Integration**
   - Updated player profile forms
   - Updated player creation forms
   - Updated player edit forms
   - Existing display components work unchanged

### 🎯 **Key Features**

- **15MB Upload Limit**: As requested, supports high-quality device photos
- **Face Positioning**: Center crop for non-square images (placeholder for future advanced cropping)
- **Automatic Compression**: Reduces file size while maintaining quality
- **Secure Storage**: User can only access their own images
- **Fallback Support**: Shows initials when no image is available

## 🔧 **Technical Details**

### **File Structure**
```
app/api/upload/profile-picture/route.ts  # Upload API endpoint
src/components/ImageUpload.tsx           # Upload component
src/lib/image-utils.ts                   # Image processing utilities
database-setup/schema/storage-setup.sql  # Database setup
```

### **API Endpoints**
- `POST /api/upload/profile-picture` - Upload new profile picture
- `DELETE /api/upload/profile-picture` - Remove profile picture

### **Storage Organization**
```
profile-pictures/
├── {user-id}/
│   ├── {timestamp}-{random}.jpg
│   └── {timestamp}-{random}.jpg
└── {user-id}/
    └── {timestamp}-{random}.jpg
```

## 🧪 **Testing**

### **Test Storage Setup**
1. Visit `/api/test-storage` in your browser
2. Check if the response shows the bucket is properly configured
3. If you get a 404 error, create the bucket in Supabase dashboard

### **Test the Upload**
1. Go to `/player-profile` or `/players/create`
2. Click on the profile picture upload area
3. Select an image file (JPEG, PNG, WebP)
4. Verify the upload works and image appears

### **Test File Validation**
- Try uploading non-image files (should fail)
- Try uploading files > 15MB (should fail)
- Try uploading valid images (should work)

### **Test Display**
- Check that uploaded images appear in tournament player lists
- Verify fallback to initials when no image is set
- Test image removal functionality

## 🚨 **Troubleshooting**

### **Common Issues**

1. **"Bucket not found" error**
   - Ensure the `profile-pictures` bucket exists in Supabase Storage
   - Check that it's set to public

2. **"Permission denied" error**
   - Run the RLS policies setup SQL
   - Ensure the bucket allows public read access

3. **"File too large" error**
   - Check that the bucket file size limit is set to 15MB
   - Verify the client-side validation is working

4. **Images not displaying**
   - Check that the bucket is public
   - Verify the URL is being generated correctly
   - Check browser console for CORS errors

5. **500 Internal Server Error on upload**
   - Check server logs for detailed error messages
   - Verify the `profile-pictures` bucket exists in Supabase Storage
   - Ensure the bucket is set to public
   - Check that your Supabase service role key is correct
   - Visit `/api/test-storage` to verify bucket configuration

### **Storage Usage Monitoring**

Monitor your Supabase Storage usage:
- **Free Tier**: 1GB file storage
- **Estimated Usage**: ~50-100KB per compressed image
- **Capacity**: ~10,000-20,000 profile pictures

## 🔄 **Migration from URL-based Images**

Existing profile pictures using external URLs will continue to work. The new upload system will:
- Store new uploads in Supabase Storage
- Keep existing URLs unchanged
- Provide better performance and security for new uploads

## 📈 **Future Enhancements**

Potential improvements for future versions:
1. **Advanced Cropping**: Interactive crop tool for face positioning
2. **Multiple Sizes**: Generate thumbnails and different resolutions
3. **Image Filters**: Basic photo editing capabilities
4. **Bulk Upload**: Support for multiple images
5. **CDN Integration**: Faster image delivery

---

**Setup Complete!** 🎉

Your profile picture upload system is now ready to use. Users can upload high-quality photos that will be automatically compressed and optimized for web display.
