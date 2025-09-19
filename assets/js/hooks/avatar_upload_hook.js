// Avatar Upload Hook with drag-and-drop and progress tracking
const AvatarUpload = {
  mounted() {
    this.uploadZone = this.el;
    this.fileInput = this.uploadZone.querySelector('input[type="file"]');

    if (!this.fileInput) {
      console.error('File input not found in upload zone');
      return;
    }

    // Bind events
    this.uploadZone.addEventListener('dragover', this.handleDragOver.bind(this));
    this.uploadZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
    this.uploadZone.addEventListener('drop', this.handleDrop.bind(this));
    this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
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

    // Read file as data URL for preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;

      // Split data URL to get base64 data
      const [, data] = dataUrl.split(',');

      // Send file info to LiveView component
      this.pushEventTo(this.el, 'validate_avatar', {
        avatar: {
          name: file.name,
          size: file.size,
          type: file.type,
          data_url: dataUrl,
          data: data // Base64 encoded data without header
        }
      });
    };

    reader.onerror = () => {
      this.pushEventTo(this.el, 'file_error', { error: 'Failed to read file' });
    };

    reader.readAsDataURL(file);
  }
};

export default AvatarUpload;