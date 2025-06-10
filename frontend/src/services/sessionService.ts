import { env } from '@/config/env';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

export const sessionService = {
  lastActivity: 0,

  initSession() {
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

  cleanup() {
    window.removeEventListener('mousemove', this.updateLastActivity);
    window.removeEventListener('keypress', this.updateLastActivity);
  }
};
