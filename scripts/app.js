/**
 * New Tab Extension Main Application
 * Coordinates all modules and handles initialization
 */

class NewTabApp {
  constructor() {
    this.modules = {};
    this.isInitialized = false;
    this.init();
  }

  async init() {
    try {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.initializeModules());
      } else {
        await this.initializeModules();
      }
    } catch (error) {
      console.error('Failed to initialize New Tab App:', error);
      this.showError('Failed to initialize extension');
    }
  }

  /**
   * Initialize all modules
   */
  async initializeModules() {
    try {
      // Initialize modules in order of dependency
      await this.initializeSettingsManager();
      await this.initializeBackgroundEngine();
      await this.initializeClockManager();
      await this.initializePinnedAppsManager();
      await this.initializeStatsTracker();
      
      // Setup global event listeners
      this.setupGlobalEventListeners();
      
      // Mark as initialized
      this.isInitialized = true;
      
      // Hide loading indicator
      this.hideLoadingIndicator();
      
      console.log('New Tab Extension initialized successfully');
    } catch (error) {
      console.error('Module initialization failed:', error);
      this.showError('Failed to initialize modules');
    }
  }

  /**
   * Initialize Settings Manager
   */
  async initializeSettingsManager() {
    if (window.settingsManager) {
      this.modules.settings = window.settingsManager;
      console.log('Settings Manager initialized');
    } else {
      throw new Error('Settings Manager not available');
    }
  }

  /**
   * Initialize Background Engine
   */
  async initializeBackgroundEngine() {
    if (window.backgroundEngine) {
      this.modules.background = window.backgroundEngine;
      console.log('Background Engine initialized');
    } else {
      throw new Error('Background Engine not available');
    }
  }

  /**
   * Initialize Clock Manager
   */
  async initializeClockManager() {
    if (window.clockManager) {
      this.modules.clock = window.clockManager;
      console.log('Clock Manager initialized');
    } else {
      throw new Error('Clock Manager not available');
    }
  }

  /**
   * Initialize Pinned Apps Manager
   */
  async initializePinnedAppsManager() {
    if (window.pinnedAppsManager) {
      this.modules.apps = window.pinnedAppsManager;
      console.log('Pinned Apps Manager initialized');
    } else {
      throw new Error('Pinned Apps Manager not available');
    }
  }

  /**
   * Initialize Stats Tracker
   */
  async initializeStatsTracker() {
    if (window.statsTracker) {
      this.modules.stats = window.statsTracker;
      console.log('Stats Tracker initialized');
    } else {
      throw new Error('Stats Tracker not available');
    }
  }

  /**
   * Setup global event listeners
   */
  setupGlobalEventListeners() {
    // Handle file uploads for background images
    document.getElementById('bg-upload-file').addEventListener('change', async (e) => {
      await this.handleBackgroundImageUpload(e);
    });

    // Handle app icon uploads
    document.getElementById('app-icon-upload').addEventListener('change', async (e) => {
      await this.handleAppIconUpload(e);
    });

    // Handle keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcuts(e);
    });

    // Handle window resize for responsive layout
    window.addEventListener('resize', () => {
      this.handleWindowResize();
    });

    // Handle visibility change (tab switching)
    document.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });
  }

  /**
   * Handle background image upload
   */
  async handleBackgroundImageUpload(event) {
    const files = Array.from(event.target.files);
    
    if (files.length === 0) return;
    
    try {
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          await this.modules.background.addUploadedImage(file);
        }
      }
      
      // Refresh background
      await this.modules.background.applyBackground();
      
      // Update settings modal
      if (window.settingsManager) {
        window.settingsManager.populateUploadedImages();
      }
      
      console.log(`Uploaded ${files.length} background images`);
    } catch (error) {
      console.error('Failed to upload background images:', error);
      this.showError('Failed to upload images');
    }
    
    // Reset file input
    event.target.value = '';
  }

  /**
   * Handle app icon upload
   */
  async handleAppIconUpload(event) {
    const file = event.target.files[0];
    
    if (!file || !file.type.startsWith('image/')) return;
    
    try {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const iconUrl = e.target.result;
        
        // Update the app edit modal
        const iconPreview = document.getElementById('app-icon-preview');
        const iconInput = document.getElementById('app-icon-input');
        
        if (iconPreview && iconInput) {
          iconPreview.src = iconUrl;
          iconInput.value = iconUrl;
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to upload app icon:', error);
      this.showError('Failed to upload icon');
    }
    
    // Reset file input
    event.target.value = '';
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyboardShortcuts(event) {
    // Ctrl/Cmd + , opens settings
    if ((event.ctrlKey || event.metaKey) && event.key === ',') {
      event.preventDefault();
      if (this.modules.settings) {
        this.modules.settings.openModal();
      }
    }
    
    // Escape closes modals
    if (event.key === 'Escape') {
      this.closeAllModals();
    }
  }

  /**
   * Close all modals
   */
  closeAllModals() {
    // Close settings modal
    if (this.modules.settings) {
      this.modules.settings.closeModal();
    }
    
    // Close app edit modal
    const appEditModal = document.getElementById('app-edit-modal');
    if (appEditModal) {
      appEditModal.classList.remove('active');
    }
  }

  /**
   * Handle window resize
   */
  handleWindowResize() {
    // Update responsive layouts if needed
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Adjust grid layout for mobile
    if (width < 768) {
      document.body.classList.add('mobile-layout');
    } else {
      document.body.classList.remove('mobile-layout');
    }
  }

  /**
   * Handle visibility change (tab switching)
   */
  handleVisibilityChange() {
    if (document.hidden) {
      // Tab is hidden - pause tracking
      if (this.modules.stats) {
        this.modules.stats.isActive = false;
      }
    } else {
      // Tab is visible - resume tracking
      if (this.modules.stats) {
        this.modules.stats.isActive = true;
        this.modules.stats.currentSession.startTime = Date.now();
      }
      
      // Refresh background if needed
      if (this.modules.background) {
        this.modules.background.handleBackgroundCycle();
      }
    }
  }

  /**
   * Show loading indicator
   */
  showLoadingIndicator() {
    const loader = document.getElementById('loading-indicator');
    if (loader) {
      loader.style.display = 'block';
    }
  }

  /**
   * Hide loading indicator
   */
  hideLoadingIndicator() {
    const loader = document.getElementById('loading-indicator');
    if (loader) {
      loader.style.display = 'none';
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    console.error(message);
    
    // Create error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-notification';
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    // Remove after 5 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 5000);
  }

  /**
   * Get module instance
   */
  getModule(name) {
    return this.modules[name] || null;
  }

  /**
   * Check if app is initialized
   */
  isReady() {
    return this.isInitialized;
  }
}

// Initialize the application
window.newTabApp = new NewTabApp();

// Expose utility functions globally
window.utils = {
  /**
   * Format time in 12/24 hour format
   */
  formatTime: (hours, minutes, seconds, format24 = false, showSeconds = true) => {
    let formattedHours = hours;
    let period = '';
    
    if (!format24) {
      period = hours >= 12 ? ' PM' : ' AM';
      formattedHours = hours % 12 || 12;
    }
    
    const timeString = `${String(formattedHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    const secondsString = showSeconds ? `:${String(seconds).padStart(2, '0')}` : '';
    
    return timeString + secondsString + period;
  },

  /**
   * Format date
   */
  formatDate: (date) => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString(undefined, options);
  },

  /**
   * Debounce function
   */
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Generate random ID
   */
  generateId: (prefix = 'id') => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }
};