/**
 * Clock Module
 * Handles time display with customizable formats and settings
 */

class ClockManager {
  constructor() {
    this.clockElement = document.getElementById('clock');
    this.dateElement = document.getElementById('date');
    this.clockContainer = document.getElementById('clock-container');
    
    this.settings = {
      showClock: true,
      showSeconds: false,
      use24HourFormat: false,
      showDate: true
    };
    
    this.interval = null;
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.startClock();
    this.setupEventListeners();
  }

  /**
   * Load clock settings from storage
   */
  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['clockSettings']);
      if (result.clockSettings) {
        this.settings = { ...this.settings, ...result.clockSettings };
      }
      this.applySettings();
    } catch (error) {
      console.warn('Failed to load clock settings:', error);
    }
  }

  /**
   * Save clock settings to storage
   */
  async saveSettings() {
    try {
      await chrome.storage.sync.set({ clockSettings: this.settings });
    } catch (error) {
      console.warn('Failed to save clock settings:', error);
    }
  }

  /**
   * Apply current settings to the UI
   */
  applySettings() {
    if (this.settings.showClock) {
      this.clockContainer.classList.remove('hidden');
    } else {
      this.clockContainer.classList.add('hidden');
      return;
    }

    // Update clock format
    this.updateClock();
  }

  /**
   * Start the clock interval
   */
  startClock() {
    this.updateClock();
    this.updateDate();
    
    // Update every second if showing seconds, otherwise every minute
    const interval = this.settings.showSeconds ? 1000 : 60000;
    
    if (this.interval) {
      clearInterval(this.interval);
    }
    
    this.interval = setInterval(() => {
      this.updateClock();
      this.updateDate();
    }, interval);
  }

  /**
   * Update the time display
   */
  updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    let timeString = '';
    
    if (this.settings.use24HourFormat) {
      timeString = `${this.padZero(hours)}:${this.padZero(minutes)}`;
    } else {
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 should be 12
      timeString = `${this.padZero(hours)}:${this.padZero(minutes)} ${ampm}`;
    }

    if (this.settings.showSeconds) {
      timeString += `:${this.padZero(seconds)}`;
    }

    this.clockElement.textContent = timeString;
  }

  /**
   * Update the date display
   */
  updateDate() {
    if (!this.settings.showDate) {
      this.dateElement.classList.add('hidden');
      return;
    }

    const now = new Date();
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    const dateString = now.toLocaleDateString('en-US', options);
    this.dateElement.textContent = dateString;
    this.dateElement.classList.remove('hidden');
  }

  /**
   * Pad single digits with leading zero
   */
  padZero(num) {
    return num.toString().padStart(2, '0');
  }

  /**
   * Update clock settings
   */
  updateSettings(newSettings) {
    const oldShowSeconds = this.settings.showSeconds;
    this.settings = { ...this.settings, ...newSettings };
    
    this.applySettings();
    this.saveSettings();
    
    // Restart clock if seconds setting changed
    if (oldShowSeconds !== this.settings.showSeconds) {
      this.startClock();
    }
  }

  /**
   * Setup event listeners for settings changes
   */
  setupEventListeners() {
    // Listen for settings changes from settings module
    document.addEventListener('clockSettingsChanged', (event) => {
      this.updateSettings(event.detail);
    });
  }

  /**
   * Get current settings
   */
  getSettings() {
    return { ...this.settings };
  }

  /**
   * Destroy the clock manager
   */
  destroy() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

// Initialize clock when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.clockManager = new ClockManager();
});