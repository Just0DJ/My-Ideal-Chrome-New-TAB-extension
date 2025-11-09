/**
 * Options Page JavaScript
 * Handles the extension options page functionality
 */

class OptionsPage {
  constructor() {
    this.init();
  }

  async init() {
    try {
      await this.loadExtensionInfo();
      this.setupEventListeners();
      this.loadStats();
    } catch (error) {
      console.error('Failed to initialize options page:', error);
      this.showStatus('Failed to initialize page', 'error');
    }
  }

  /**
   * Load extension information
   */
  async loadExtensionInfo() {
    try {
      // Get extension manifest
      const manifest = chrome.runtime.getManifest();
      
      // Update version
      document.getElementById('extension-version').textContent = manifest.version;
      
      // Update last updated (use install date or current date)
      const installDate = await this.getInstallDate();
      document.getElementById('last-updated').textContent = this.formatDate(installDate);
      
    } catch (error) {
      console.warn('Failed to load extension info:', error);
    }
  }

  /**
   * Get extension install date
   */
  async getInstallDate() {
    try {
      const result = await chrome.storage.sync.get(['installDate']);
      if (result.installDate) {
        return new Date(result.installDate);
      }
      
      // If no install date, set current date
      const now = new Date();
      await chrome.storage.sync.set({ installDate: now.toISOString() });
      return now;
    } catch (error) {
      return new Date();
    }
  }

  /**
   * Load user statistics
   */
  async loadStats() {
    try {
      const result = await chrome.storage.sync.get(['statsData']);
      const stats = result.statsData || {};
      
      // Update usage time
      const usageTimeElement = document.getElementById('total-usage-time');
      if (usageTimeElement && stats.totalUsageTime) {
        usageTimeElement.textContent = this.formatUsageTime(stats.totalUsageTime);
      }
      
      // Update tabs opened
      const tabsOpenedElement = document.getElementById('total-tabs-opened');
      if (tabsOpenedElement && stats.totalTabsOpened) {
        tabsOpenedElement.textContent = stats.totalTabsOpened.toLocaleString();
      }
      
    } catch (error) {
      console.warn('Failed to load stats:', error);
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Open settings button
    document.getElementById('open-settings').addEventListener('click', () => {
      this.openSettings();
    });

    // Reset all data button
    document.getElementById('reset-all-data').addEventListener('click', () => {
      this.resetAllData();
    });

    // Export data button
    document.getElementById('export-data').addEventListener('click', () => {
      this.exportSettings();
    });

    // Import data button
    document.getElementById('import-data').addEventListener('click', () => {
      document.getElementById('import-file').click();
    });

    // Import file input
    document.getElementById('import-file').addEventListener('change', (e) => {
      this.importSettings(e);
    });

    // Support links
    document.getElementById('report-issue').addEventListener('click', (e) => {
      e.preventDefault();
      this.openSupportLink('https://github.com/your-repo/issues');
    });

    document.getElementById('suggest-feature').addEventListener('click', (e) => {
      e.preventDefault();
      this.openSupportLink('https://github.com/your-repo/discussions');
    });

    document.getElementById('rate-extension').addEventListener('click', (e) => {
      e.preventDefault();
      this.openChromeWebStore();
    });
  }

  /**
   * Open settings in new tab
   */
  openSettings() {
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
  }

  /**
   * Reset all extension data
   */
  async resetAllData() {
    if (confirm('Are you sure you want to reset all extension data? This action cannot be undone.')) {
      try {
        // Clear all storage
        await chrome.storage.sync.clear();
        await chrome.storage.local.clear();
        
        // Reset install date
        const now = new Date();
        await chrome.storage.sync.set({ installDate: now.toISOString() });
        
        this.showStatus('All data has been reset successfully', 'success');
        
        // Reload page after short delay
        setTimeout(() => {
          location.reload();
        }, 1500);
        
      } catch (error) {
        console.error('Failed to reset data:', error);
        this.showStatus('Failed to reset data', 'error');
      }
    }
  }

  /**
   * Export settings as JSON
   */
  async exportSettings() {
    try {
      // Get all settings
      const result = await chrome.storage.sync.get();
      
      // Create JSON file
      const jsonString = JSON.stringify(result, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = `new-tab-extension-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Cleanup
      URL.revokeObjectURL(url);
      
      this.showStatus('Settings exported successfully', 'success');
      
    } catch (error) {
      console.error('Failed to export settings:', error);
      this.showStatus('Failed to export settings', 'error');
    }
  }

  /**
   * Import settings from JSON
   */
  async importSettings(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const settings = JSON.parse(text);
      
      // Validate settings
      this.validateSettings(settings);
      
      // Confirm import
      if (confirm('This will replace all current settings. Are you sure?')) {
        // Clear existing settings
        await chrome.storage.sync.clear();
        
        // Import new settings
        await chrome.storage.sync.set(settings);
        
        this.showStatus('Settings imported successfully', 'success');
        
        // Reload page
        setTimeout(() => {
          location.reload();
        }, 1500);
      }
      
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
    // Basic validation - check if it's an object
    if (!settings || typeof settings !== 'object') {
      throw new Error('Invalid settings format');
    }
    
    // Check for required sections (optional)
    const optionalSections = ['newTabSettings', 'backgroundSettings', 'statsData', 'pinnedApps'];
    const hasValidSections = Object.keys(settings).some(key => 
      optionalSections.includes(key) || key.endsWith('Settings')
    );
    
    if (!hasValidSections) {
      throw new Error('Settings file does not contain valid configuration sections');
    }
  }

  /**
   * Open support link
   */
  openSupportLink(url) {
    chrome.tabs.create({ url: url });
  }

  /**
   * Open Chrome Web Store for rating
   */
  openChromeWebStore() {
    // Replace with your actual Chrome Web Store URL
    const extensionId = chrome.runtime.id;
    const webStoreUrl = `https://chrome.google.com/webstore/detail/${extensionId}`;
    chrome.tabs.create({ url: webStoreUrl });
  }

  /**
   * Show status message
   */
  showStatus(message, type = 'info') {
    // Remove existing status messages
    const existingStatus = document.querySelector('.status-message');
    if (existingStatus) {
      existingStatus.remove();
    }

    // Create new status message
    const statusDiv = document.createElement('div');
    statusDiv.className = `status-message ${type}`;
    statusDiv.textContent = message;
    
    document.body.appendChild(statusDiv);
    
    // Show with animation
    requestAnimationFrame(() => {
      statusDiv.classList.add('show');
    });
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      statusDiv.classList.remove('show');
      setTimeout(() => {
        if (statusDiv.parentNode) {
          statusDiv.parentNode.removeChild(statusDiv);
        }
      }, 300);
    }, 3000);
  }

  /**
   * Format date for display
   */
  formatDate(date) {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Format usage time for display
   */
  formatUsageTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return '< 1m';
    }
  }
}

// Initialize options page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new OptionsPage();
});