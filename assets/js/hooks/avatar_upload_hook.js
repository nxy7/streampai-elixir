// Avatar Upload Hook with drag-and-drop, S3 direct upload, and progress tracking
const AvatarUpload = {
  mounted() {
    this.uploadZone = this.el;
    this.fileInput = this.uploadZone.querySelector('input[type="file"]');
    this.currentFile = null;

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

  processFile(file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.pushEventTo(this.el, 'file_error', { error: 'Please select an image file' });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      this.pushEventTo(this.el, 'file_error', { error: 'File size must be less than 5MB' });
      return;
    }

    // Store file for later upload
    this.currentFile = file;

    // Read file as data URL for preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;

      // Send file info to LiveView component for preview
      this.pushEventTo(this.el, 'validate_avatar', {
        avatar: {
          name: file.name,
          size: file.size,
          type: file.type,
          data_url: dataUrl
        }
      });
    };

    reader.onerror = () => {
      this.pushEventTo(this.el, 'file_error', { error: 'Failed to read file' });
    };

    reader.readAsDataURL(file);
  },

  async uploadToS3(url, headers, file_id) {
    if (!this.currentFile) {
      this.pushEventTo(this.el, 'file_error', { error: 'No file selected' });
      return;
    }

    try {
      // Use PUT with direct file upload for all storage providers
      const response = await fetch(url, {
        method: 'PUT',
        body: this.currentFile,
        headers: {
          ...headers,
          'Content-Length': this.currentFile.size.toString()
        }
      });

      if (response.ok || response.status === 204 || response.status === 200) {
        // Upload successful, notify server
        this.pushEventTo(this.el, 'confirm_upload', { file_id });
      } else {
        const errorText = await response.text();
        console.error('PUT upload failed:', response.status, errorText);
        this.pushEventTo(this.el, 'file_error', {
          error: `Upload failed: ${response.status}`
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      this.pushEventTo(this.el, 'file_error', {
        error: 'Failed to upload file'
      });
    }
  }
};

export default AvatarUpload;