# File Upload Component Guide

This guide explains how to use the generic file upload system in the Streampai application.

## Overview

The file upload system consists of:
1. **Generic JavaScript Hook** (`FileUpload`) - Handles client-side file selection, validation, and S3 upload
2. **Generic LiveView Component** (`FileUploadComponent`) - Server-side component for any file type
3. **S3 Direct Upload** - Files are uploaded directly to S3/R2/MinIO using presigned PUT URLs

## Basic Usage

### 1. Simple File Upload

```elixir
<.live_component
  module={StreampaiWeb.Components.FileUploadComponent}
  id="my-file-upload"
  current_user={@current_user}
/>
```

### 2. Document Upload (PDF only)

```elixir
<.live_component
  module={StreampaiWeb.Components.FileUploadComponent}
  id="document-upload"
  current_user={@current_user}
  file_type={:document}
  accept="application/pdf,.pdf"
  max_size={20_000_000}  # 20MB
  title="Upload Document"
  description="Upload a PDF document up to 20MB"
  upload_button_text="Document"
/>
```

### 3. Image Upload

```elixir
<.live_component
  module={StreampaiWeb.Components.FileUploadComponent}
  id="image-upload"
  current_user={@current_user}
  file_type={:thumbnail}
  accept="image/*"
  max_size={5_000_000}  # 5MB
  title="Upload Thumbnail"
  description="Upload an image (JPG, PNG, GIF) up to 5MB"
  show_preview={true}
  upload_button_text="Image"
/>
```

### 4. Video Upload

```elixir
<.live_component
  module={StreampaiWeb.Components.FileUploadComponent}
  id="video-upload"
  current_user={@current_user}
  file_type={:video}
  accept="video/mp4,video/webm"
  max_size={100_000_000}  # 100MB
  title="Upload Video"
  description="Upload a video (MP4 or WebM) up to 100MB"
  upload_button_text="Video"
/>
```

## Component Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | string | required | Unique identifier for the component |
| `current_user` | User | required | Current authenticated user |
| `file_type` | atom | `:other` | Type of file (`:avatar`, `:document`, `:video`, `:thumbnail`, `:other`) |
| `accept` | string | `"*"` | Accepted file types (MIME types or extensions) |
| `max_size` | integer | `10_000_000` | Maximum file size in bytes |
| `title` | string | `"Upload File"` | Title displayed above the upload area |
| `description` | string | `"Choose a file to upload"` | Description text |
| `show_preview` | boolean | `false` | Whether to show file preview (useful for images) |
| `upload_button_text` | string | `"File"` | Text for the upload button |
| `current_file_url` | string | `nil` | URL of current file (for showing existing uploads) |

## Accept Patterns

The `accept` parameter supports:
- **MIME types**: `"image/jpeg"`, `"application/pdf"`
- **Wildcard MIME**: `"image/*"`, `"video/*"`, `"audio/*"`
- **Extensions**: `".pdf"`, `".jpg"`, `".png"`
- **Multiple types**: `"image/jpeg,image/png,.pdf"`
- **Any file**: `"*"`

## Handling Upload Results

In your parent LiveView, handle the upload completion:

```elixir
def handle_info({:file_uploaded, component_id, file}, socket) do
  case component_id do
    "avatar-upload" ->
      # Update user avatar
      {:ok, _user} = Accounts.User.update_avatar(socket.assigns.current_user, file.id)
      {:noreply, put_flash(socket, :info, "Avatar updated successfully!")}

    "document-upload" ->
      # Handle document upload
      {:noreply, assign(socket, :uploaded_document, file)}

    _ ->
      {:noreply, socket}
  end
end
```

## Custom File Upload Hook Usage

If you need custom behavior, you can use the `FileUpload` hook directly:

```html
<div
  phx-hook="FileUpload"
  data-max-size="5242880"
  data-accept="image/*"
  data-upload-event="custom_upload"
  data-validate-event="custom_validate"
  data-confirm-event="custom_confirm"
>
  <input type="file" />
  <!-- Your custom UI here -->
</div>
```

Hook configuration attributes:
- `data-max-size` - Maximum file size in bytes
- `data-accept` - Accepted file types
- `data-upload-event` - Phoenix event name for upload
- `data-validate-event` - Phoenix event name for validation
- `data-confirm-event` - Phoenix event name for confirmation

## Progress Tracking

The component automatically tracks upload progress. You can listen for progress events:

```javascript
// In your custom JavaScript
document.addEventListener('upload-progress', (event) => {
  console.log('Upload progress:', event.detail.progress + '%');
});
```

## File Type Configuration

Configure file types in `Streampai.Storage.SizeLimits`:

```elixir
defmodule Streampai.Storage.SizeLimits do
  def max_size(:avatar), do: 5_000_000        # 5MB
  def max_size(:document), do: 20_000_000     # 20MB
  def max_size(:video), do: 100_000_000       # 100MB
  def max_size(:thumbnail), do: 2_000_000     # 2MB
  def max_size(_), do: 10_000_000             # 10MB default
end
```

## Security Notes

1. **Client-side validation** is for UX only - always validate on the server
2. **File size limits** are enforced client-side for better UX
3. **Direct S3 upload** means files never touch your server, reducing load
4. **Presigned URLs** expire after 30 minutes by default
5. **Two-phase upload** prevents orphaned files:
   - Phase 1: Create pending file record and get presigned URL
   - Phase 2: After successful upload, mark file as uploaded

## Examples in Production

### User Settings Page
```elixir
# Avatar upload
<.live_component
  module={StreampaiWeb.Components.FileUploadComponent}
  id="avatar-upload"
  current_user={@current_user}
  file_type={:avatar}
  accept="image/*"
  max_size={5_000_000}
  title="Profile Picture"
  description="Upload a new avatar. JPG, PNG or GIF. Max 5MB"
  show_preview={true}
  current_file_url={@current_user.display_avatar}
  upload_button_text="Avatar"
/>
```

### Stream Overlay Upload
```elixir
# Overlay image upload
<.live_component
  module={StreampaiWeb.Components.FileUploadComponent}
  id="overlay-upload"
  current_user={@current_user}
  file_type={:thumbnail}
  accept="image/png,image/gif"
  max_size={2_000_000}
  title="Stream Overlay"
  description="Upload a transparent PNG or GIF for your stream overlay"
  show_preview={true}
  upload_button_text="Overlay"
/>
```

### Document Verification
```elixir
# ID verification document
<.live_component
  module={StreampaiWeb.Components.FileUploadComponent}
  id="verification-doc"
  current_user={@current_user}
  file_type={:document}
  accept="application/pdf,image/jpeg,image/png"
  max_size={10_000_000}
  title="Verification Document"
  description="Upload your ID or verification document (PDF, JPG, PNG)"
  upload_button_text="Document"
/>
```

## Migration from Avatar-Specific Upload

To migrate from the old `AvatarUploadComponent` to the generic component:

```elixir
# Old
<.live_component
  module={StreampaiWeb.Components.AvatarUploadComponent}
  id="avatar-upload"
  current_user={@current_user}
/>

# New
<.live_component
  module={StreampaiWeb.Components.FileUploadComponent}
  id="avatar-upload"
  current_user={@current_user}
  file_type={:avatar}
  accept="image/*"
  max_size={5_000_000}
  title="Profile Picture"
  description="Upload a new avatar. JPG, PNG or GIF. Max 5MB"
  show_preview={true}
  upload_button_text="Avatar"
/>
```

The old `AvatarUpload` JavaScript hook is kept for backward compatibility but new implementations should use `FileUpload`.