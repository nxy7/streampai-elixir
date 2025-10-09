// Thumbnail Selector Hook - handles file selection and preview without uploading
// The actual upload happens later when the user clicks GO LIVE
const ThumbnailSelector = {
  mounted() {
    this.fileInput = this.el.querySelector('input[type="file"]');
    this.currentFile = null;

    if (!this.fileInput) {
      console.error('File input not found in thumbnail selector');
      return;
    }

    this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));

    // Listen for upload trigger from LiveView
    this.handleEvent('start_thumbnail_upload', ({ file_id, upload_url, upload_headers }) => {
      this.uploadToS3(file_id, upload_url, upload_headers);
    });
  },

  destroyed() {
    if (this.fileInput) {
      this.fileInput.removeEventListener('change', this.handleFileSelect.bind(this));
    }
  },

  handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
      this.processFile(files[0]);
    }
  },

  async processFile(file) {
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const ACCEPTED_TYPES = ['image/jpeg', 'image/png'];

    // Validate file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      alert('Please select a JPG or PNG image');
      this.fileInput.value = '';
      return;
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      alert('File size must be less than 5MB');
      this.fileInput.value = '';
      return;
    }

    // Store the file for later upload
    this.currentFile = file;

    // Compute hash for deduplication (for files < 4MB)
    let contentHash = null;
    const HASH_SIZE_LIMIT = 4 * 1024 * 1024;

    if (file.size <= HASH_SIZE_LIMIT) {
      try {
        contentHash = await this.computeFileHash(file);
      } catch (error) {
        console.warn('Failed to compute file hash:', error);
      }
    }

    // Read file as data URL for preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;

      // Send file info to LiveView component
      this.pushEventTo(this.el, 'file_validated', {
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
      alert('Failed to read file');
      this.fileInput.value = '';
    };

    reader.readAsDataURL(file);
  },

  async computeFileHash(file) {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  },

  async uploadToS3(fileId, url, headers) {
    if (!this.currentFile) {
      console.error('No file to upload');
      return;
    }

    try {
      const xhr = new XMLHttpRequest();

      xhr.addEventListener('load', () => {
        if (xhr.status === 200 || xhr.status === 204) {
          // Upload successful, notify LiveView
          this.pushEvent('thumbnail_upload_complete', { file_id: fileId });
        } else {
          console.error('Upload failed:', xhr.status, xhr.responseText);
          alert('Failed to upload thumbnail');
        }
      });

      xhr.addEventListener('error', () => {
        console.error('Upload error');
        alert('Failed to upload thumbnail');
      });

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
      alert('Failed to upload thumbnail');
    }
  }
};

export default ThumbnailSelector;
