/**
 * Pinned Apps Manager
 * Handles app grid, drag-and-drop, and app management
 */

class PinnedAppsManager {
  constructor() {
    this.gridElement = document.getElementById('pinned-apps-grid');
    this.addButton = document.getElementById('add-app-button');
    this.appEditModal = document.getElementById('app-edit-modal');
    
    this.apps = [];
    this.settings = {
      iconPadding: 16,
      iconTransparency: 1,
      showAppNames: true
    };
    
    this.draggedElement = null;
    this.draggedIndex = null;
    this.editingIndex = null;
    
    this.init();
  }

  async init() {
    await this.loadApps();
    await this.loadSettings();
    this.renderApps();
    this.setupEventListeners();
    this.applySettings();
  }

  /**
   * Load apps from storage
   */
  async loadApps() {
    try {
      const result = await chrome.storage.sync.get(['pinnedApps']);
      if (result.pinnedApps) {
        this.apps = result.pinnedApps;
      } else {
        // Default apps
        this.apps = [
          {
            name: 'Google',
            url: 'https://google.com',
            icon: 'https://google.com/favicon.ico'
          },
          {
            name: 'YouTube',
            url: 'https://youtube.com',
            icon: 'https://youtube.com/favicon.ico'
          },
          {
            name: 'GitHub',
            url: 'https://github.com',
            icon: 'https://github.com/favicon.ico'
          }
        ];
        await this.saveApps();
      }
    } catch (error) {
      console.warn('Failed to load pinned apps:', error);
      this.apps = [];
    }
  }

  /**
   * Save apps to storage
   */
  async saveApps() {
    try {
      await chrome.storage.sync.set({ pinnedApps: this.apps });
    } catch (error) {
      console.warn('Failed to save pinned apps:', error);
    }
  }

  /**
   * Load app settings
   */
  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['appsSettings']);
      if (result.appsSettings) {
        this.settings = { ...this.settings, ...result.appsSettings };
      }
    } catch (error) {
      console.warn('Failed to load apps settings:', error);
    }
  }

  /**
   * Save app settings
   */
  async saveSettings() {
    try {
      await chrome.storage.sync.set({ appsSettings: this.settings });
    } catch (error) {
      console.warn('Failed to save apps settings:', error);
    }
  }

  /**
   * Apply current settings to the UI
   */
  applySettings() {
    // Update CSS variables
    document.documentElement.style.setProperty('--app-icon-padding', `${this.settings.iconPadding}px`);
    
    // Update app name visibility
    const appNames = document.querySelectorAll('.app-name');
    appNames.forEach(name => {
      if (this.settings.showAppNames) {
        name.classList.remove('hidden');
      } else {
        name.classList.add('hidden');
      }
    });

    // Update icon transparency
    const appIcons = document.querySelectorAll('.app-icon');
    appIcons.forEach(icon => {
      icon.style.opacity = this.settings.iconTransparency;
    });
  }

  /**
   * Render all apps in the grid
   */
  renderApps() {
    this.gridElement.innerHTML = '';
    
    this.apps.forEach((app, index) => {
      const appElement = this.createAppElement(app, index);
      this.gridElement.appendChild(appElement);
    });
  }

  /**
   * Create an app element
   */
  createAppElement(app, index) {
    const appElement = document.createElement('div');
    appElement.className = 'app-item';
    appElement.draggable = true;
    appElement.dataset.index = index;

    appElement.innerHTML = `
      <img class="app-icon" src="${app.icon}" alt="${app.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iOCIgZmlsbD0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjEpIi8+CjxwYXRoIGQ9Ik0zMiAxNlYzMkwxNiA0OEgzMlY2NEw0OCA0OFY2NEg2NFYxNkg0OFYzMkgzMlYxNkgxNlYxNkgzMloiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4zKSIvPgo8L3N2Zz4K'">
      <div class="app-name">${app.name}</div>
    `;

    // Add event listeners
    appElement.addEventListener('click', (e) => {
      if (!this.draggedElement) {
        this.openApp(app.url);
      }
    });

    appElement.addEventListener('dblclick', (e) => {
      e.preventDefault();
      this.openEditModal(index);
    });

    // Drag events
    appElement.addEventListener('dragstart', (e) => {
      this.draggedElement = appElement;
      this.draggedIndex = index;
      appElement.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    appElement.addEventListener('dragend', (e) => {
      appElement.classList.remove('dragging');
      this.draggedElement = null;
      this.draggedIndex = null;
    });

    appElement.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (this.draggedElement && this.draggedElement !== appElement) {
        const rect = appElement.getBoundingClientRect();
        const midpoint = rect.left + rect.width / 2;
        
        if (e.clientX < midpoint) {
          appElement.parentNode.insertBefore(this.draggedElement, appElement);
        } else {
          appElement.parentNode.insertBefore(this.draggedElement, appElement.nextSibling);
        }
      }
    });

    appElement.addEventListener('drop', (e) => {
      e.preventDefault();
      if (this.draggedIndex !== null) {
        this.reorderApps();
      }
    });

    return appElement;
  }

  /**
   * Reorder apps after drag and drop
   */
  reorderApps() {
    const appElements = this.gridElement.querySelectorAll('.app-item');
    const newOrder = [];
    
    appElements.forEach(element => {
      const index = parseInt(element.dataset.index);
      newOrder.push(this.apps[index]);
    });
    
    this.apps = newOrder;
    this.renderApps();
    this.saveApps();
  }

  /**
   * Open an app URL
   */
  openApp(url) {
    if (url) {
      chrome.tabs.create({ url: url });
    }
  }

  /**
   * Open the edit modal for an app
   */
  openEditModal(index) {
    this.editingIndex = index;
    const app = this.apps[index];
    
    document.getElementById('app-name').value = app.name || '';
    document.getElementById('app-url').value = app.url || '';
    
    const iconPreview = document.getElementById('icon-preview');
    iconPreview.innerHTML = app.icon ? `<img src="${app.icon}" alt="${app.name}">` : '';
    
    this.appEditModal.classList.add('active');
  }

  /**
   * Close the edit modal
   */
  closeEditModal() {
    this.appEditModal.classList.remove('active');
    this.editingIndex = null;
  }

  /**
   * Save the edited app
   */
  saveApp() {
    const name = document.getElementById('app-name').value.trim();
    const url = document.getElementById('app-url').value.trim();
    const iconPreview = document.getElementById('icon-preview').querySelector('img');
    const icon = iconPreview ? iconPreview.src : '';

    if (!name || !url) {
      this.showNotification('Please fill in all fields', 'error');
      return;
    }

    // Validate URL
    try {
      new URL(url);
    } catch (error) {
      this.showNotification('Please enter a valid URL', 'error');
      return;
    }

    if (this.editingIndex !== null) {
      // Edit existing app
      this.apps[this.editingIndex] = { name, url, icon };
    } else {
      // Add new app
      this.apps.push({ name, url, icon });
    }

    this.renderApps();
    this.saveApps();
    this.closeEditModal();
    this.showNotification('App saved successfully', 'success');
  }

  /**
   * Delete the current app
   */
  deleteApp() {
    if (this.editingIndex !== null) {
      this.apps.splice(this.editingIndex, 1);
      this.renderApps();
      this.saveApps();
      this.closeEditModal();
      this.showNotification('App deleted successfully', 'success');
    }
  }

  /**
   * Handle icon upload
   */
  handleIconUpload(file) {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const iconPreview = document.getElementById('icon-preview');
        iconPreview.innerHTML = `<img src="${e.target.result}" alt="Icon preview">`;
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Use favicon as icon
   */
  async useFavicon() {
    const url = document.getElementById('app-url').value.trim();
    if (!url) {
      this.showNotification('Please enter a URL first', 'error');
      return;
    }

    try {
      const urlObj = new URL(url);
      const faviconUrl = `${urlObj.origin}/favicon.ico`;
      
      // Test if favicon exists
      const response = await fetch(faviconUrl, { method: 'HEAD' });
      if (response.ok) {
        const iconPreview = document.getElementById('icon-preview');
        iconPreview.innerHTML = `<img src="${faviconUrl}" alt="Favicon">`;
        this.showNotification('Favicon loaded successfully', 'success');
      } else {
        this.showNotification('Could not load favicon', 'warning');
      }
    } catch (error) {
      this.showNotification('Error loading favicon', 'error');
    }
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  /**
   * Update app settings
   */
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.applySettings();
    this.saveSettings();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Add app button
    this.addButton.addEventListener('click', () => {
      this.editingIndex = null;
      document.getElementById('app-name').value = '';
      document.getElementById('app-url').value = '';
      document.getElementById('icon-preview').innerHTML = '';
      this.appEditModal.classList.add('active');
    });

    // Edit modal buttons
    document.getElementById('close-app-edit').addEventListener('click', () => {
      this.closeEditModal();
    });

    document.getElementById('save-app').addEventListener('click', () => {
      this.saveApp();
    });

    document.getElementById('delete-app').addEventListener('click', () => {
      this.deleteApp();
    });

    // Icon upload
    document.getElementById('app-icon-upload').addEventListener('change', (e) => {
      const file = e.target.files[0];
      this.handleIconUpload(file);
    });

    document.getElementById('icon-upload-area').addEventListener('click', () => {
      document.getElementById('app-icon-upload').click();
    });

    document.getElementById('use-favicon').addEventListener('click', () => {
      this.useFavicon();
    });

    // Listen for settings changes
    document.addEventListener('appsSettingsChanged', (event) => {
      this.updateSettings(event.detail);
    });

    // Close modal on outside click
    this.appEditModal.addEventListener('click', (e) => {
      if (e.target === this.appEditModal) {
        this.closeEditModal();
      }
    });
  }

  /**
   * Get current settings
   */
  getSettings() {
    return { ...this.settings };
  }

  /**
   * Get all apps
   */
  getApps() {
    return [...this.apps];
  }
}

// Initialize pinned apps when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.pinnedAppsManager = new PinnedAppsManager();
});