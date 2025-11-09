/**
 * Settings Manager
 * Handles the settings modal and all customization options
 */

class SettingsManager {
  constructor() {
    this.modal = document.getElementById('settings-modal');
    this.settingsButton = document.getElementById('settings-button');
    this.closeButton = document.getElementById('settings-close');
    this.saveButton = document.getElementById('settings-save');
    this.resetButton = document.getElementById('settings-reset');
    this.exportButton = document.getElementById('settings-export');
    this.importButton = document.getElementById('settings-import');
    this.importFile = document.getElementById('settings-import-file');
    this.statusMessage = document.getElementById('settings-status');
    
    this.settings = {
      clock: {
        format: '12', // 12 or 24
        showSeconds: true,
        showDate: true,
        hidden: false
      },
      apps: {
        showNames: true,
        padding: 10,
        transparency: 0.9,
        gridColumns: 10,
        gridRows: 2
      },
      background: {
        type: 'upload', // upload, color, gradient, api
        uploadSettings: {
          images: [],
          cycle: 'refresh', // refresh, newtab
          order: 'random' // random, sequential
        },
        colorSettings: {
          color: '#1a1a1a'
        },
        gradientSettings: {
          type: 'linear',
          color1: '#667eea',
          color2: '#764ba2'
        },
        apiSettings: {
          source: 'unsplash',
          apiKey: '',
          query: 'nature',
          cycle: 'refresh'
        }
      },
      stats: {
        enabled: true,
        showUsageTime: true,
        showTabsOpened: true,
        showDaysUsed: true,
        showTrackersBlocked: true
      }
    };
    
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupEventListeners();
    this.populateSettings();
  }

  /**
   * Load settings from chrome.storage.sync
   */
  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['newTabSettings']);
      if (result.newTabSettings) {
        this.settings = { ...this.settings, ...result.newTabSettings };
      }
    } catch (error) {
      console.warn('Failed to load settings:', error);
    }
  }

  /**
   * Save settings to chrome.storage.sync
   */
  async saveSettings() {
    try {
      await chrome.storage.sync.set({ newTabSettings: this.settings });
      this.showStatus('Settings saved successfully!', 'success');
      
      // Dispatch events for other modules
      this.dispatchSettingsEvents();
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showStatus('Failed to save settings', 'error');
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Modal open/close
    this.settingsButton.addEventListener('click', () => this.openModal());
    this.closeButton.addEventListener('click', () => this.closeModal());
    
    // Save and reset
    this.saveButton.addEventListener('click', () => this.saveCurrentSettings());
    this.resetButton.addEventListener('click', () => this.resetToDefaults());
    
    // Import/export
    this.exportButton.addEventListener('click', () => this.exportSettings());
    this.importButton.addEventListener('click', () => this.importFile.click());
    this.importFile.addEventListener('change', (e) => this.importSettings(e));
    
    // Category navigation
    document.querySelectorAll('.settings-category').forEach(category => {
      category.addEventListener('click', (e) => this.switchCategory(e.target.dataset.category));
    });
    
    // Close modal on outside click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    });
  }

  /**
   * Open settings modal
   */
  openModal() {
    this.modal.classList.add('active');
    this.populateSettings();
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close settings modal
   */
  closeModal() {
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
    this.hideStatus();
  }

  /**
   * Switch between settings categories
   */
  switchCategory(category) {
    // Update active category
    document.querySelectorAll('.settings-category').forEach(cat => {
      cat.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`).classList.add('active');
    
    // Show corresponding section
    document.querySelectorAll('.settings-section').forEach(section => {
      section.classList.remove('active');
    });
    document.getElementById(`settings-${category}`).classList.add('active');
  }

  /**
   * Populate settings form with current values
   */
  populateSettings() {
    // Clock settings
    document.getElementById('clock-format').value = this.settings.clock.format;
    document.getElementById('clock-seconds').checked = this.settings.clock.showSeconds;
    document.getElementById('clock-date').checked = this.settings.clock.showDate;
    document.getElementById('clock-hidden').checked = this.settings.clock.hidden;
    
    // App settings
    document.getElementById('apps-show-names').checked = this.settings.apps.showNames;
    document.getElementById('apps-padding').value = this.settings.apps.padding;
    document.getElementById('apps-transparency').value = this.settings.apps.transparency;
    document.getElementById('apps-padding-value').textContent = this.settings.apps.padding + 'px';
    document.getElementById('apps-transparency-value').textContent = Math.round(this.settings.apps.transparency * 100) + '%';
    
    // Background settings
    document.getElementById('background-type').value = this.settings.background.type;
    this.showBackgroundSection(this.settings.background.type);
    
    // Upload settings
    document.getElementById('bg-upload-cycle').value = this.settings.background.uploadSettings.cycle;
    document.getElementById('bg-upload-order').value = this.settings.background.uploadSettings.order;
    this.populateUploadedImages();
    
    // Color settings
    document.getElementById('bg-color').value = this.settings.background.colorSettings.color;
    
    // Gradient settings
    document.getElementById('bg-gradient-type').value = this.settings.background.gradientSettings.type;
    document.getElementById('bg-gradient-color1').value = this.settings.background.gradientSettings.color1;
    document.getElementById('bg-gradient-color2').value = this.settings.background.gradientSettings.color2;
    
    // API settings
    document.getElementById('bg-api-source').value = this.settings.background.apiSettings.source;
    document.getElementById('bg-api-key').value = this.settings.background.apiSettings.apiKey;
    document.getElementById('bg-api-query').value = this.settings.background.apiSettings.query;
    
    // Stats settings
    document.getElementById('stats-enabled').checked = this.settings.stats.enabled;
    document.getElementById('stats-usage-time').checked = this.settings.stats.showUsageTime;
    document.getElementById('stats-tabs-opened').checked = this.settings.stats.showTabsOpened;
    document.getElementById('stats-days-used').checked = this.settings.stats.showDaysUsed;
    document.getElementById('stats-trackers').checked = this.settings.stats.showTrackersBlocked;
  }

  /**
   * Show appropriate background section
   */
  showBackgroundSection(type) {
    document.querySelectorAll('.background-section').forEach(section => {
      section.classList.remove('active');
    });
    document.getElementById(`bg-${type}-section`).classList.add('active');
  }

  /**
   * Populate uploaded images list
   */
  populateUploadedImages() {
    const container = document.getElementById('bg-upload-images');
    container.innerHTML = '';
    
    this.settings.background.uploadSettings.images.forEach((image, index) => {
      const imageItem = document.createElement('div');
      imageItem.className = 'uploaded-image-item';
      imageItem.innerHTML = `
        <img src="${image}" alt="Uploaded image ${index + 1}">
        <button class="remove-image-btn" data-index="${index}">×</button>
      `;
      container.appendChild(imageItem);
    });
    
    // Add remove listeners
    container.querySelectorAll('.remove-image-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        this.removeUploadedImage(index);
      });
    });
  }

  /**
   * Remove uploaded image
   */
  async removeUploadedImage(index) {
    this.settings.background.uploadSettings.images.splice(index, 1);
    await this.saveSettings();
    this.populateUploadedImages();
  }

  /**
   * Save current settings
   */
  async saveCurrentSettings() {
    // Clock settings
    this.settings.clock.format = document.getElementById('clock-format').value;
    this.settings.clock.showSeconds = document.getElementById('clock-seconds').checked;
    this.settings.clock.showDate = document.getElementById('clock-date').checked;
    this.settings.clock.hidden = document.getElementById('clock-hidden').checked;
    
    // App settings
    this.settings.apps.showNames = document.getElementById('apps-show-names').checked;
    this.settings.apps.padding = parseInt(document.getElementById('apps-padding').value);
    this.settings.apps.transparency = parseFloat(document.getElementById('apps-transparency').value);
    
    // Background settings
    this.settings.background.type = document.getElementById('background-type').value;
    this.settings.background.uploadSettings.cycle = document.getElementById('bg-upload-cycle').value;
    this.settings.background.uploadSettings.order = document.getElementById('bg-upload-order').value;
    this.settings.background.colorSettings.color = document.getElementById('bg-color').value;
    this.settings.background.gradientSettings.type = document.getElementById('bg-gradient-type').value;
    this.settings.background.gradientSettings.color1 = document.getElementById('bg-gradient-color1').value;
    this.settings.background.gradientSettings.color2 = document.getElementById('bg-gradient-color2').value;
    this.settings.background.apiSettings.source = document.getElementById('bg-api-source').value;
    this.settings.background.apiSettings.apiKey = document.getElementById('bg-api-key').value;
    this.settings.background.apiSettings.query = document.getElementById('bg-api-query').value;
    
    // Stats settings
    this.settings.stats.enabled = document.getElementById('stats-enabled').checked;
    this.settings.stats.showUsageTime = document.getElementById('stats-usage-time').checked;
    this.settings.stats.showTabsOpened = document.getElementById('stats-tabs-opened').checked;
    this.settings.stats.showDaysUsed = document.getElementById('stats-days-used').checked;
    this.settings.stats.showTrackersBlocked = document.getElementById('stats-trackers').checked;
    
    await this.saveSettings();
  }

  /**
   * Reset to default settings
   */
  async resetToDefaults() {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      // Reset to hardcoded defaults
      this.settings = {
        clock: {
          format: '12',
          showSeconds: true,
          showDate: true,
          hidden: false
        },
        apps: {
          showNames: true,
          padding: 10,
          transparency: 0.9,
          gridColumns: 10,
          gridRows: 2
        },
        background: {
          type: 'upload',
          uploadSettings: {
            images: [],
            cycle: 'refresh',
            order: 'random'
          },
          colorSettings: {
            color: '#1a1a1a'
          },
          gradientSettings: {
            type: 'linear',
            color1: '#667eea',
            color2: '#764ba2'
          },
          apiSettings: {
            source: 'unsplash',
            apiKey: '',
            query: 'nature'
          }
        },
        stats: {
          enabled: true,
          showUsageTime: true,
          showTabsOpened: true,
          showDaysUsed: true,
          showTrackersBlocked: true
        }
      };
      
      await this.saveSettings();
      this.populateSettings();
      this.showStatus('Settings reset to defaults', 'success');
    }
  }

  /**
   * Export settings as JSON
   */
  exportSettings() {
    const settingsJson = JSON.stringify(this.settings, null, 2);
    const blob = new Blob([settingsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'new-tab-settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.showStatus('Settings exported successfully', 'success');
  }

  /**
   * Import settings from JSON
   */
  async importSettings(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const importedSettings = JSON.parse(text);
      
      // Validate the imported settings
      this.validateSettings(importedSettings);
      
      // Merge with current settings
      this.settings = { ...this.settings, ...importedSettings };
      await this.saveSettings();
      this.populateSettings();
      
      this.showStatus('Settings imported successfully', 'success');
    } catch (error) {
      console.error('Failed to import settings:', error);
      this.showStatus('Failed to import settings: ' + error.message, 'error');
    }
    
    // Reset file input
    event.target.value = '';
  }

  /**
   * Validate imported settings
   */
  validateSettings(settings) {
    // Basic validation - check if required properties exist
    const required = ['clock', 'apps', 'background', 'stats'];
    for (const prop of required) {
      if (!settings[prop]) {
        throw new Error(`Missing required property: ${prop}`);
      }
    }
  }

  /**
   * Show status message
   */
  showStatus(message, type) {
    this.statusMessage.textContent = message;
    this.statusMessage.className = `status-message ${type}`;
    this.statusMessage.style.display = 'block';
    
    // Auto-hide after 3 seconds
    setTimeout(() => this.hideStatus(), 3000);
  }

  /**
   * Hide status message
   */
  hideStatus() {
    this.statusMessage.style.display = 'none';
  }

  /**
   * Dispatch settings events for other modules
   */
  dispatchSettingsEvents() {
    // Clock settings changed
    document.dispatchEvent(new CustomEvent('clockSettingsChanged', {
      detail: this.settings.clock
    }));
    
    // App settings changed
    document.dispatchEvent(new CustomEvent('appSettingsChanged', {
      detail: this.settings.apps
    }));
    
    // Background settings changed
    document.dispatchEvent(new CustomEvent('backgroundSettingsChanged', {
      detail: this.settings.background
    }));
    
    // Stats settings changed
    document.dispatchEvent(new CustomEvent('statsSettingsChanged', {
      detail: this.settings.stats
    }));
  }

  /**
   * Get current settings
   */
  getSettings() {
    return { ...this.settings };
  }
}

// Initialize settings manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.settingsManager = new SettingsManager();
});