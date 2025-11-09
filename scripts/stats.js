/**
 * Stats Tracker
 * Tracks browser usage statistics including time spent, tabs opened, and days used
 */

class StatsTracker {
  constructor() {
    this.stats = {
      totalUsageTime: 0, // in seconds
      tabsOpenedToday: 0,
      totalTabsOpened: 0,
      firstUseDate: null,
      lastActiveDate: null,
      trackersBlocked: 0, // dummy counter
      sessions: []
    };
    
    this.currentSession = {
      startTime: Date.now(),
      activeTime: 0,
      lastActivity: Date.now()
    };
    
    this.isActive = true;
    this.trackingInterval = null;
    this.idleThreshold = 30000; // 30 seconds of inactivity
    
    this.init();
  }

  async init() {
    await this.loadStats();
    this.startTracking();
    this.setupEventListeners();
    this.updateDisplay();
  }

  /**
   * Load stats from chrome.storage.sync
   */
  async loadStats() {
    try {
      const result = await chrome.storage.sync.get(['statsData']);
      if (result.statsData) {
        this.stats = { ...this.stats, ...result.statsData };
        
        // Initialize first use date if not set
        if (!this.stats.firstUseDate) {
          this.stats.firstUseDate = new Date().toISOString();
        }
        
        // Reset daily counters if it's a new day
        this.checkNewDay();
      }
    } catch (error) {
      console.warn('Failed to load stats:', error);
    }
  }

  /**
   * Save stats to chrome.storage.sync
   */
  async saveStats() {
    try {
      await chrome.storage.sync.set({ statsData: this.stats });
    } catch (error) {
      console.warn('Failed to save stats:', error);
    }
  }

  /**
   * Check if it's a new day and reset daily counters
   */
  checkNewDay() {
    const today = new Date().toDateString();
    const lastActive = this.stats.lastActiveDate ? new Date(this.stats.lastActiveDate).toDateString() : null;
    
    if (lastActive !== today) {
      // New day - reset daily counters
      this.stats.tabsOpenedToday = 0;
      this.stats.lastActiveDate = new Date().toISOString();
      this.saveStats();
    }
  }

  /**
   * Start tracking usage time
   */
  startTracking() {
    this.trackingInterval = setInterval(() => {
      if (this.isActive) {
        const now = Date.now();
        const timeSinceLastActivity = now - this.currentSession.lastActivity;
        
        if (timeSinceLastActivity < this.idleThreshold) {
          // User is active - add time
          const timeDelta = Math.floor((now - this.currentSession.startTime) / 1000);
          this.stats.totalUsageTime += timeDelta;
          this.currentSession.activeTime += timeDelta;
          this.currentSession.startTime = now;
          
          this.updateDisplay();
          this.saveStats();
        }
      }
    }, 1000); // Update every second
  }

  /**
   * Stop tracking
   */
  stopTracking() {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
  }

  /**
   * Setup event listeners for tab tracking
   */
  setupEventListeners() {
    // Tab opened tracking
    chrome.tabs.onCreated.addListener(() => {
      this.incrementTabCount();
    });
    
    // Activity tracking
    document.addEventListener('mousemove', () => this.recordActivity());
    document.addEventListener('keypress', () => this.recordActivity());
    document.addEventListener('click', () => this.recordActivity());
    
    // Window focus/blur
    window.addEventListener('focus', () => {
      this.isActive = true;
      this.currentSession.startTime = Date.now();
    });
    
    window.addEventListener('blur', () => {
      this.isActive = false;
      this.saveCurrentSession();
    });
    
    // Settings changed
    document.addEventListener('statsSettingsChanged', (event) => {
      this.handleSettingsChange(event.detail);
    });
    
    // Before unload
    window.addEventListener('beforeunload', () => {
      this.saveCurrentSession();
    });
  }

  /**
   * Record user activity
   */
  recordActivity() {
    this.currentSession.lastActivity = Date.now();
    if (!this.isActive) {
      this.isActive = true;
      this.currentSession.startTime = Date.now();
    }
  }

  /**
   * Increment tab count
   */
  incrementTabCount() {
    this.stats.tabsOpenedToday++;
    this.stats.totalTabsOpened++;
    this.updateDisplay();
    this.saveStats();
  }

  /**
   * Save current session data
   */
  saveCurrentSession() {
    if (this.currentSession.activeTime > 0) {
      this.stats.sessions.push({
        date: new Date().toISOString(),
        duration: this.currentSession.activeTime,
        tabsOpened: this.stats.tabsOpenedToday
      });
      
      // Keep only last 30 days of sessions
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      this.stats.sessions = this.stats.sessions.filter(session => 
        new Date(session.date) > thirtyDaysAgo
      );
      
      this.saveStats();
    }
  }

  /**
   * Handle settings changes
   */
  handleSettingsChange(settings) {
    if (!settings.enabled) {
      this.stopTracking();
      document.getElementById('stats-container').style.display = 'none';
    } else {
      this.startTracking();
      document.getElementById('stats-container').style.display = 'block';
    }
    
    this.updateDisplay();
  }

  /**
   * Update stats display
   */
  updateDisplay() {
    const container = document.getElementById('stats-container');
    if (!container) return;
    
    const settings = window.settingsManager ? window.settingsManager.getSettings().stats : {
      enabled: true,
      showUsageTime: true,
      showTabsOpened: true,
      showDaysUsed: true,
      showTrackersBlocked: true
    };
    
    if (!settings.enabled) {
      container.style.display = 'none';
      return;
    }
    
    container.style.display = 'block';
    
    // Format usage time
    const usageTime = this.formatUsageTime(this.stats.totalUsageTime);
    
    // Calculate days used
    const daysUsed = this.calculateDaysUsed();
    
    // Generate stats HTML
    let statsHTML = '';
    
    if (settings.showUsageTime) {
      statsHTML += `<div class="stat-item">
        <span class="stat-label">Usage Time</span>
        <span class="stat-value">${usageTime}</span>
      </div>`;
    }
    
    if (settings.showTabsOpened) {
      statsHTML += `<div class="stat-item">
        <span class="stat-label">Tabs Today</span>
        <span class="stat-value">${this.stats.tabsOpenedToday}</span>
      </div>`;
    }
    
    if (settings.showDaysUsed) {
      statsHTML += `<div class="stat-item">
        <span class="stat-label">Days Used</span>
        <span class="stat-value">${daysUsed}</span>
      </div>`;
    }
    
    if (settings.showTrackersBlocked) {
      statsHTML += `<div class="stat-item">
        <span class="stat-label">Trackers Blocked</span>
        <span class="stat-value">${this.stats.trackersBlocked}</span>
      </div>`;
    }
    
    container.innerHTML = statsHTML;
  }

  /**
   * Format usage time in human-readable format
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

  /**
   * Calculate days since first use
   */
  calculateDaysUsed() {
    if (!this.stats.firstUseDate) return 0;
    
    const firstUse = new Date(this.stats.firstUseDate);
    const today = new Date();
    const diffTime = Math.abs(today - firstUse);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  /**
   * Get current stats
   */
  getStats() {
    return {
      totalUsageTime: this.stats.totalUsageTime,
      tabsOpenedToday: this.stats.tabsOpenedToday,
      totalTabsOpened: this.stats.totalTabsOpened,
      daysUsed: this.calculateDaysUsed(),
      trackersBlocked: this.stats.trackersBlocked,
      sessions: [...this.stats.sessions]
    };
  }

  /**
   * Reset stats (for testing/debugging)
   */
  async resetStats() {
    this.stats = {
      totalUsageTime: 0,
      tabsOpenedToday: 0,
      totalTabsOpened: 0,
      firstUseDate: new Date().toISOString(),
      lastActiveDate: new Date().toISOString(),
      trackersBlocked: 0,
      sessions: []
    };
    
    this.currentSession = {
      startTime: Date.now(),
      activeTime: 0,
      lastActivity: Date.now()
    };
    
    await this.saveStats();
    this.updateDisplay();
  }

  /**
   * Increment trackers blocked (dummy counter)
   */
  incrementTrackersBlocked() {
    this.stats.trackersBlocked++;
    this.updateDisplay();
    this.saveStats();
  }
}

// Initialize stats tracker when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.statsTracker = new StatsTracker();
});