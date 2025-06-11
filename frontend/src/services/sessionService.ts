import { env } from '@/config/env';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

export const sessionService = {
  lastActivity: 0,

  initSession() {
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get('session') === 'expired') {
      this.handleExpiredSession();
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    this.updateLastActivity();
    this.startSessionTimer();
    window.addEventListener('mousemove', this.updateLastActivity.bind(this));
    window.addEventListener('keypress', this.updateLastActivity.bind(this));
  },

  updateLastActivity() {
    this.lastActivity = Date.now();
  },

  startSessionTimer() {
    setInterval(() => {
      if (Date.now() - this.lastActivity > SESSION_TIMEOUT) {
        this.endSession();
      }
    }, 1000); // Check every second
  },

  endSession() {
    localStorage.removeItem('user');
    localStorage.removeItem(env.TOKEN_KEY);
    window.location.href = '/login?session=expired';
  },

  handleExpiredSession() {
    localStorage.removeItem(env.TOKEN_KEY);
    localStorage.removeItem("user");
    window.location.href = '/auth';
  },

  cleanup() {
    window.removeEventListener('mousemove', this.updateLastActivity);
    window.removeEventListener('keypress', this.updateLastActivity);
  }
};
