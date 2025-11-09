/**
 * Background Engine
 * Handles background images, colors, gradients, and API integration
 */

class BackgroundEngine {
  constructor() {
    this.backgroundContainer = document.getElementById('background-container');
    this.settings = {
      backgroundType: 'upload', // upload, color, gradient, api
      uploadSettings: {
        images: [],
        cycle: 'refresh', // refresh, newtab
        order: 'random', // random, sequential
        currentIndex: 0
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
        images: [],
        currentIndex: 0
      }
    };
    
    this.imageCache = new Map();
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.applyBackground();
    this.setupEventListeners();
  }

  /**
   * Load background settings from storage
   */
  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['backgroundSettings']);
      if (result.backgroundSettings) {
        this.settings = { ...this.settings, ...result.backgroundSettings };
      }
    } catch (error) {
      console.warn('Failed to load background settings:', error);
    }
  }

  /**
   * Save background settings to storage
   */
  async saveSettings() {
    try {
      await chrome.storage.sync.set({ backgroundSettings: this.settings });
    } catch (error) {
      console.warn('Failed to save background settings:', error);
    }
  }

  /**
   * Apply the current background based on settings
   */
  async applyBackground() {
    switch (this.settings.backgroundType) {
      case 'upload':
        await this.applyUploadBackground();
        break;
      case 'color':
        this.applyColorBackground();
        break;
      case 'gradient':
        this.applyGradientBackground();
        break;
      case 'api':
        await this.applyApiBackground();
        break;
      default:
        this.applyColorBackground();
    }
  }

  /**
   * Apply uploaded images background
   */
  async applyUploadBackground() {
    const uploadSettings = this.settings.uploadSettings;
    
    if (uploadSettings.images.length === 0) {
      this.applyColorBackground();
      return;
    }

    let imageIndex;
    
    if (uploadSettings.order === 'random') {
      imageIndex = Math.floor(Math.random() * uploadSettings.images.length);
    } else {
      imageIndex = uploadSettings.currentIndex;
      uploadSettings.currentIndex = (uploadSettings.currentIndex + 1) % uploadSettings.images.length;
    }

    const imageUrl = uploadSettings.images[imageIndex];
    await this.setBackgroundImage(imageUrl);
    
    // Save the updated index
    await this.saveSettings();
  }

  /**
   * Apply solid color background
   */
  applyColorBackground() {
    const color = this.settings.colorSettings.color;
    this.backgroundContainer.style.backgroundImage = 'none';
    this.backgroundContainer.style.backgroundColor = color;
  }

  /**
   * Apply gradient background
   */
  applyGradientBackground() {
    const gradientSettings = this.settings.gradientSettings;
    let gradient;
    
    if (gradientSettings.type === 'linear') {
      gradient = `linear-gradient(135deg, ${gradientSettings.color1}, ${gradientSettings.color2})`;
    } else {
      gradient = `radial-gradient(circle, ${gradientSettings.color1}, ${gradientSettings.color2})`;
    }
    
    this.backgroundContainer.style.backgroundImage = gradient;
    this.backgroundContainer.style.backgroundColor = 'transparent';
  }

  /**
   * Apply API background
   */
  async applyApiBackground() {
    const apiSettings = this.settings.apiSettings;
    
    if (!apiSettings.apiKey) {
      console.warn('No API key provided');
      this.applyColorBackground();
      return;
    }

    try {
      // Check if we need to fetch new images
      if (apiSettings.images.length === 0) {
        await this.fetchApiImages();
      }

      if (apiSettings.images.length > 0) {
        let imageIndex;
        
        if (apiSettings.order === 'random') {
          imageIndex = Math.floor(Math.random() * apiSettings.images.length);
        } else {
          imageIndex = apiSettings.currentIndex;
          apiSettings.currentIndex = (apiSettings.currentIndex + 1) % apiSettings.images.length;
        }

        const imageUrl = apiSettings.images[imageIndex];
        await this.setBackgroundImage(imageUrl);
        
        // Save the updated index
        await this.saveSettings();
      }
    } catch (error) {
      console.error('Failed to apply API background:', error);
      this.applyColorBackground();
    }
  }

  /**
   * Fetch images from API
   */
  async fetchApiImages() {
    const apiSettings = this.settings.apiSettings;
    let url;
    
    if (apiSettings.source === 'unsplash') {
      url = `https://api.unsplash.com/photos/random?query=${apiSettings.query}&count=10&client_id=${apiSettings.apiKey}`;
    } else if (apiSettings.source === 'pexels') {
      url = `https://api.pexels.com/v1/search?query=${apiSettings.query}&per_page=10`;
    }

    const response = await fetch(url, {
      headers: apiSettings.source === 'pexels' ? {
        'Authorization': apiSettings.apiKey
      } : {}
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (apiSettings.source === 'unsplash') {
      apiSettings.images = data.map(photo => photo.urls.regular);
    } else if (apiSettings.source === 'pexels') {
      apiSettings.images = data.photos.map(photo => photo.src.large);
    }

    // Reset index
    apiSettings.currentIndex = 0;
  }

  /**
   * Set background image with fade transition
   */
  async setBackgroundImage(imageUrl) {
    // Preload image
    const img = new Image();
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        // Add fade effect
        this.backgroundContainer.style.transition = 'background-image 0.5s ease-in-out';
        this.backgroundContainer.style.backgroundImage = `url(${imageUrl})`;
        this.backgroundContainer.style.backgroundColor = 'transparent';
        resolve();
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = imageUrl;
    });
  }

  /**
   * Add uploaded image
   */
  async addUploadedImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const imageDataUrl = e.target.result;
        this.settings.uploadSettings.images.push(imageDataUrl);
        await this.saveSettings();
        resolve(imageDataUrl);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * Remove uploaded image
   */
  async removeUploadedImage(index) {
    if (index >= 0 && index < this.settings.uploadSettings.images.length) {
      this.settings.uploadSettings.images.splice(index, 1);
      
      // Adjust current index if necessary
      if (this.settings.uploadSettings.currentIndex >= this.settings.uploadSettings.images.length) {
        this.settings.uploadSettings.currentIndex = 0;
      }
      
      await this.saveSettings();
    }
  }

  /**
   * Update background settings
   */
  async updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();
    await this.applyBackground();
  }

  /**
   * Handle background cycling based on settings
   */
  handleBackgroundCycle() {
    const uploadSettings = this.settings.uploadSettings;
    const apiSettings = this.settings.apiSettings;
    
    if (this.settings.backgroundType === 'upload' && uploadSettings.cycle === 'newtab') {
      this.applyUploadBackground();
    } else if (this.settings.backgroundType === 'api' && apiSettings.cycle === 'newtab') {
      this.applyApiBackground();
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for settings changes
    document.addEventListener('backgroundSettingsChanged', async (event) => {
      await this.updateSettings(event.detail);
    });

    // Handle new tab background cycling
    this.handleBackgroundCycle();
  }

  /**
   * Get current settings
   */
  getSettings() {
    return { ...this.settings };
  }

  /**
   * Get uploaded images
   */
  getUploadedImages() {
    return [...this.settings.uploadSettings.images];
  }

  /**
   * Get API images
   */
  getApiImages() {
    return [...this.settings.apiSettings.images];
  }
}

// Initialize background engine when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.backgroundEngine = new BackgroundEngine();
});