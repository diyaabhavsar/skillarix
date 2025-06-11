import { env } from '@/config/env';
import { User } from '@/types/session';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

interface SessionData {
  token: string;
  user: User;
}

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

  setSession(data: SessionData) {
    localStorage.setItem(env.TOKEN_KEY, data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    this.initSession();
  },

  clearSession() {
    localStorage.removeItem('user');
    localStorage.removeItem(env.TOKEN_KEY);
    this.cleanup();
  },

  startSessionTimer() {
    setInterval(() => {
      if (Date.now() - this.lastActivity > SESSION_TIMEOUT) {
        this.endSession();
      }
    }, 1000); // Check every second
  },

  endSession() {
    this.clearSession();
    window.location.href = '/login?session=expired';
  },

  cleanup() {
    window.removeEventListener('mousemove', this.updateLastActivity);
    window.removeEventListener('keypress', this.updateLastActivity);
  }
};
