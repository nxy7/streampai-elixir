// Settings Thumbnail Upload Hook - handles thumbnail uploads during live stream settings changes
// Works with Vue components to capture File objects and upload them to S3
const SettingsThumbnailUpload = {
  mounted() {
    this.currentFile = null;

    // Listen for file selection from Vue component
    window.addEventListener('settings-thumbnail-selected', this.handleThumbnailSelected.bind(this));

    // Listen for upload trigger from LiveView
    this.handleEvent('start_settings_thumbnail_upload', ({ file_id, upload_url, upload_headers }) => {
      this.uploadToS3(file_id, upload_url, upload_headers);
    });
  },

  destroyed() {
    window.removeEventListener('settings-thumbnail-selected', this.handleThumbnailSelected.bind(this));
  },

  handleThumbnailSelected(event) {
    const { file } = event.detail;

    console.log('Hook: Received settings-thumbnail-selected event with file:', file);

    if (!file) {
      console.warn('No file provided in thumbnail selection event');
      return;
    }

    // Store the file for later upload
    this.currentFile = file;

    console.log('Hook: Pushing settings_thumbnail_file_selected event to Phoenix:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Notify LiveView that a thumbnail has been selected
    this.pushEvent('settings_thumbnail_file_selected', {
      name: file.name,
      size: file.size,
      type: file.type
    });
  },

  async uploadToS3(fileId, url, headers) {
    if (!this.currentFile) {
      console.error('No file to upload');
      this.pushEvent('settings_thumbnail_upload_error', { error: 'No file selected' });
      return;
    }

    try {
      const xhr = new XMLHttpRequest();

      xhr.addEventListener('load', () => {
        if (xhr.status === 200 || xhr.status === 204) {
          // Upload successful, notify LiveView
          this.pushEvent('settings_thumbnail_upload_complete', { file_id: fileId });
        } else {
          console.error('Upload failed:', xhr.status, xhr.responseText);
          this.pushEvent('settings_thumbnail_upload_error', {
            error: `Upload failed: ${xhr.status}`
          });
        }
      });

      xhr.addEventListener('error', () => {
        console.error('Upload error');
        this.pushEvent('settings_thumbnail_upload_error', {
          error: 'Failed to upload thumbnail'
        });
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
      this.pushEvent('settings_thumbnail_upload_error', {
        error: 'Failed to upload thumbnail'
      });
    }
  }
};

export default SettingsThumbnailUpload;
