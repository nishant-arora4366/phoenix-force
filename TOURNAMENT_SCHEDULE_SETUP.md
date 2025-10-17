# Tournament Schedule Upload Setup Guide

This guide will help you set up the tournament schedule upload functionality for Phoenix Force.

## 🚀 **Quick Setup**

### 1. **Supabase Storage Configuration**

You need to manually create the storage bucket in your Supabase dashboard:

1. **Go to your Supabase Dashboard**
2. **Navigate to Storage**
3. **Create a new bucket** with these settings:
   - **Name**: `tournament-schedules`
   - **Public**: ✅ **Yes** (checked)
   - **File size limit**: `10485760` bytes (10MB)
   - **Allowed MIME types**: `image/jpeg,image/jpg,image/png,image/webp`

### 2. **Run Storage Setup Script**

```bash
cd database-setup
node setup-tournament-schedule-storage.js
```

This will set up the RLS policies and helper functions.

### 3. **Manual SQL Setup (Alternative)**

If the script doesn't work, run this SQL in your Supabase SQL Editor:

```sql
-- Create storage bucket for tournament schedules
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tournament-schedules',
  'tournament-schedules',
  true,
  10485760, -- 10MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow tournament hosts and admins to upload schedules
CREATE POLICY "Tournament hosts and admins can upload schedules" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'tournament-schedules' 
  AND auth.role() = 'authenticated'
  AND (
    -- Check if user is admin
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
    OR
    -- Check if user is tournament host
    EXISTS (
      SELECT 1 FROM tournaments t
      JOIN users u ON u.id = t.host_id
      WHERE t.id::text = (storage.foldername(name))[2]
      AND u.id = auth.uid()
      AND u.role = 'host'
    )
  )
);

-- Policy: Allow public read access to tournament schedules
CREATE POLICY "Tournament schedules are publicly readable" ON storage.objects
FOR SELECT USING (
  bucket_id = 'tournament-schedules'
);
```

## 📋 **Features Implemented**

### ✅ **What's Working**

1. **Schedule Upload for Hosts/Admins**
   - Only tournament hosts and admins can upload schedules
   - **Multiple file upload support** - upload several schedule images at once
   - File validation (type, size)
   - Image processing and optimization
   - Progress indicators
   - Error handling

2. **Image Processing**
   - Automatic compression to 1200x800px
   - Quality optimization (90%)
   - Format conversion to JPEG
   - 10MB upload limit

3. **Storage Management**
   - Secure file storage in Supabase
   - Tournament-specific file organization
   - Automatic cleanup of old images
   - Public URL generation

4. **UI Integration**
   - Different views for hosts vs participants
   - Upload modal with drag & drop support
   - **Schedule preview dialog** with multiple image support
   - Schedule viewing functionality
   - Responsive design

### 🎯 **Key Features**

- **10MB Upload Limit**: Supports high-quality schedule images
- **Permission-Based Access**: Only hosts and admins can upload
- **Automatic Compression**: Reduces file size while maintaining readability
- **Secure Storage**: Proper RLS policies for access control
- **Public Viewing**: All users can view uploaded schedules

## 🔧 **Technical Details**

### **File Structure**
```
app/api/upload/schedule/route.ts                    # Upload API endpoint
app/tournaments/[id]/page.tsx                      # Tournament page with schedule functionality
database-setup/schema/tournament-schedule-storage.sql  # Database setup
database-setup/setup-tournament-schedule-storage.js    # Setup script
```

### **API Endpoints**
- `POST /api/upload/schedule` - Upload tournament schedule

### **Storage Organization**
```
tournament-schedules/
├── {tournament-id}/
│   ├── {timestamp}-{random}.jpg
│   └── {timestamp}-{random}.png
```

### **Database Schema**
The `tournaments` table now includes:
- `schedule_image_url` (text) - URL to the primary uploaded schedule image
- `schedule_images` (text[]) - Array of all uploaded schedule image URLs

## 🎨 **User Experience**

### **For Tournament Hosts/Admins:**
1. **No Schedule**: See "Upload Schedule" button
2. **Upload Process**: Click button → Select multiple images → Automatic upload
3. **After Upload**: Button changes to "View Schedule(s)" (plural if multiple)

### **For Participants:**
1. **No Schedule**: See "Schedule Not Available" (disabled button)
2. **Schedule Available**: See "View Schedule(s)" button
3. **Viewing**: Opens preview dialog with all schedule images stacked vertically
4. **Multiple Images**: Each image has "Open in New Tab" option for full-screen viewing

## 🔒 **Security Features**

- **Authentication Required**: Only authenticated users can upload
- **Role-Based Access**: Only hosts and admins can upload schedules
- **File Validation**: Type and size validation on both client and server
- **RLS Policies**: Database-level security for storage access
- **Automatic Cleanup**: Old schedule images are automatically deleted

## 🚀 **Usage**

1. **Host Upload**: Tournament hosts can upload schedule images
2. **Public Viewing**: All users can view uploaded schedules
3. **Automatic Updates**: Tournament page updates immediately after upload
4. **Mobile Friendly**: Works on all device sizes

## 📱 **Responsive Design**

- **Desktop**: Side-by-side layout with Teams Formed card
- **Mobile**: Stacked layout for better mobile experience
- **Upload Modal**: Responsive modal that works on all screen sizes

## 🔄 **Future Enhancements**

- Schedule editing capabilities
- Multiple schedule versions
- Schedule notifications
- Integration with tournament timeline
- Schedule templates
