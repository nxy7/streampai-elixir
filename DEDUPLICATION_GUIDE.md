# File Upload Deduplication Guide

## Overview

The file upload system now supports content-based deduplication for small files (< 4MB) using SHA-256 hashing. This prevents storing duplicate files when users upload the same content multiple times.

## How It Works

### 1. Client-Side Hashing
For files under 4MB, the JavaScript hook computes a SHA-256 hash before upload:
- Computed using the Web Crypto API
- Hash is sent with file metadata during validation
- Larger files skip hashing to avoid performance issues

### 2. Server-Side Deduplication Check
When a hash is provided, the server:
1. Checks if a file with the same hash and type already exists
2. If found, returns the existing file ID
3. If not found, proceeds with normal upload process

### 3. Upload Decision
- **Duplicate found**: Skip S3 upload, use existing file
- **No duplicate**: Proceed with upload, store hash after completion

## Implementation Status

### ✅ Completed
- Added `content_hash` field to File resource
- Created index for efficient hash lookups
- Implemented client-side SHA-256 hashing for files < 4MB
- Added `check_duplicate` read action to File resource
- Avatar file size reduced from 5MB to 2MB
- Thumbnail field added to Livestream resource

### 🚧 To Do
- Update FileUploadComponent to handle duplicate detection
- Modify avatar and thumbnail upload flows to use deduplication
- Add content hash to mark_uploaded confirmation
- Create background job to clean up pending files

## Benefits

1. **Storage Savings**: Same image uploaded multiple times only stored once
2. **Bandwidth Savings**: Duplicate uploads are detected before S3 transfer
3. **Cost Reduction**: Fewer S3 storage and transfer costs
4. **User Experience**: Faster "uploads" for duplicate files

## Limitations

1. **File Size**: Only files under 4MB are hashed (performance constraint)
2. **Trust**: Client-provided hash should be verified server-side for security
3. **Browser Support**: Requires modern browser with Web Crypto API

## Example Usage

### Avatar Upload with Deduplication
```elixir
# In component
case Streampai.Storage.File.check_duplicate(%{
  content_hash: file_info.content_hash,
  file_type: :avatar
}, actor: user) do
  {:ok, [existing_file | _]} ->
    # Use existing file
    {:ok, existing_file}

  _ ->
    # No duplicate, proceed with upload
    Streampai.Storage.File.request_upload(...)
end
```

### JavaScript Hash Computation
```javascript
async function computeFileHash(file) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

## Future Improvements

1. **Server-side verification**: Download and verify hash after upload
2. **Chunked hashing**: Support hashing larger files progressively
3. **Reference counting**: Track how many resources use each file
4. **Garbage collection**: Delete files with zero references
5. **Content-based addressing**: Use hash as storage key for true deduplication