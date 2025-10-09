// Generic File Upload Hook with drag-and-drop, S3 direct upload, and progress tracking
// This hook can be used for any file upload (avatars, documents, videos, etc.)
const FileUpload = {
  mounted() {
    this.uploadZone = this.el;
    this.fileInput = this.uploadZone.querySelector('input[type="file"]');
    this.currentFile = null;

    // Get configuration from data attributes
    this.maxSize = parseInt(this.el.dataset.maxSize || '10485760'); // 10MB default
    this.acceptedTypes = this.el.dataset.accept || '*'; // Accept all by default
    this.uploadEventName = this.el.dataset.uploadEvent || 'upload_file';
    this.validateEventName = this.el.dataset.validateEvent || 'validate_file';
    this.confirmEventName = this.el.dataset.confirmEvent || 'confirm_upload';

    if (!this.fileInput) {
      console.error('File input not found in upload zone');
      return;
    }

    // Bind events
    this.uploadZone.addEventListener('dragover', this.handleDragOver.bind(this));
    this.uploadZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
    this.uploadZone.addEventListener('drop', this.handleDrop.bind(this));
    this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));

    // Listen for S3 upload event from server
    this.handleEvent('start_s3_upload', ({ url, headers, file_id }) => {
      this.uploadToS3(url, headers, file_id);
    });

    // Listen for upload progress updates (optional)
    this.handleEvent('upload_progress', ({ progress }) => {
      this.updateProgress(progress);
    });
  },

  destroyed() {
    // Cleanup event listeners
    this.uploadZone.removeEventListener('dragover', this.handleDragOver.bind(this));
    this.uploadZone.removeEventListener('dragleave', this.handleDragLeave.bind(this));
    this.uploadZone.removeEventListener('drop', this.handleDrop.bind(this));
    this.fileInput.removeEventListener('change', this.handleFileSelect.bind(this));
  },

  handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    this.pushEventTo(this.el, 'drag_over', {});
  },

  handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    this.pushEventTo(this.el, 'drag_leave', {});
  },

  handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    this.pushEventTo(this.el, 'drag_leave', {});

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      this.processFile(files[0]);
    }
  },

  handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
      this.processFile(files[0]);
    }
  },

  async processFile(file) {
    // Validate file type if restrictions are set
    if (this.acceptedTypes !== '*' && !this.isAcceptedType(file)) {
      this.pushEventTo(this.el, 'file_error', {
        error: `Please select a valid file type (${this.acceptedTypes})`
      });
      return;
    }

    // Validate file size
    if (file.size > this.maxSize) {
      const maxSizeMB = (this.maxSize / 1024 / 1024).toFixed(1);
      this.pushEventTo(this.el, 'file_error', {
        error: `File size must be less than ${maxSizeMB}MB`
      });
      return;
    }

    // Store file for later upload
    this.currentFile = file;

    // Compute hash for small files (< 4MB) for deduplication
    let contentHash = null;
    const HASH_SIZE_LIMIT = 4 * 1024 * 1024; // 4MB

    if (file.size <= HASH_SIZE_LIMIT) {
      try {
        contentHash = await this.computeFileHash(file);
      } catch (error) {
        console.warn('Failed to compute file hash:', error);
        // Continue without hash - deduplication will be skipped
      }
    }

    // Read file as data URL for preview (optional, can be disabled for large files)
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;

      // Send file info to LiveView component for validation/preview
      this.pushEventTo(this.el, this.validateEventName, {
        file: {
          name: file.name,
          size: file.size,
          type: file.type,
          data_url: dataUrl,
          content_hash: contentHash
        }
      });
    };

    reader.onerror = () => {
      this.pushEventTo(this.el, 'file_error', { error: 'Failed to read file' });
    };

    // Only read as data URL for images (for preview)
    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
    } else {
      // For non-images, just send file info without data URL
      this.pushEventTo(this.el, this.validateEventName, {
        file: {
          name: file.name,
          size: file.size,
          type: file.type,
          data_url: null,
          content_hash: contentHash
        }
      });
    }
  },

  async computeFileHash(file) {
    // Read file as array buffer
    const buffer = await file.arrayBuffer();

    // Compute SHA-256 hash
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);

    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
  },

  isAcceptedType(file) {
    // Handle common accept patterns
    if (this.acceptedTypes === 'image/*') {
      return file.type.startsWith('image/');
    }
    if (this.acceptedTypes === 'video/*') {
      return file.type.startsWith('video/');
    }
    if (this.acceptedTypes === 'audio/*') {
      return file.type.startsWith('audio/');
    }

    // Handle specific MIME types or extensions
    const acceptedList = this.acceptedTypes.split(',').map(t => t.trim());
    return acceptedList.some(accepted => {
      if (accepted.startsWith('.')) {
        // File extension check
        return file.name.toLowerCase().endsWith(accepted.toLowerCase());
      }
      // MIME type check
      return file.type === accepted;
    });
  },

  async uploadToS3(url, headers, file_id) {
    if (!this.currentFile) {
      this.pushEventTo(this.el, 'file_error', { error: 'No file selected' });
      return;
    }

    try {
      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          this.updateProgress(progress);
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200 || xhr.status === 204) {
          // Upload successful, notify server
          this.pushEventTo(this.el, this.confirmEventName, { file_id });
        } else {
          console.error('PUT upload failed:', xhr.status, xhr.responseText);
          this.pushEventTo(this.el, 'file_error', {
            error: `Upload failed: ${xhr.status}`
          });
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        console.error('Upload error');
        this.pushEventTo(this.el, 'file_error', {
          error: 'Failed to upload file'
        });
      });

      // Open and send request
      xhr.open('PUT', url, true);

      // Set headers
      for (const [key, value] of Object.entries(headers)) {
        xhr.setRequestHeader(key, value);
      }
      xhr.setRequestHeader('Content-Length', this.currentFile.size.toString());

      // Send the file
      xhr.send(this.currentFile);
    } catch (error) {
      console.error('Upload error:', error);
      this.pushEventTo(this.el, 'file_error', {
        error: 'Failed to upload file'
      });
    }
  },

  updateProgress(progress) {
    // Push progress update to LiveView
    this.pushEventTo(this.el, 'upload_progress', { progress });

    // Also dispatch a custom event that other JS can listen to
    this.el.dispatchEvent(new CustomEvent('upload-progress', {
      detail: { progress },
      bubbles: true
    }));
  }
};

export default FileUpload;