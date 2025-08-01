// Session management utility for handling browser close detection
export class SessionManager {
  private static readonly SESSION_KEY = 'app_session_id';
  private static readonly SESSION_HEARTBEAT_KEY = 'app_session_heartbeat';
  private static readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private static heartbeatInterval: NodeJS.Timeout | null = null;

  // Generate a unique session ID when the app starts
  static initializeSession(): string {
    const sessionId = this.generateSessionId();
    sessionStorage.setItem(this.SESSION_KEY, sessionId);
    this.startHeartbeat();
    return sessionId;
  }

  // Start heartbeat to track active session
  static startHeartbeat(): void {
    this.updateHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      this.updateHeartbeat();
    }, this.HEARTBEAT_INTERVAL);
  }

  // Stop heartbeat when user logs out
  static stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    sessionStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.SESSION_HEARTBEAT_KEY);
  }

  // Update heartbeat timestamp
  private static updateHeartbeat(): void {
    localStorage.setItem(this.SESSION_HEARTBEAT_KEY, Date.now().toString());
  }

  // Check if the session is still valid (browser wasn't closed)
  static isSessionValid(): boolean {
    const sessionId = sessionStorage.getItem(this.SESSION_KEY);
    const lastHeartbeat = localStorage.getItem(this.SESSION_HEARTBEAT_KEY);
    
    if (!sessionId || !lastHeartbeat) {
      return false;
    }

    const timeSinceLastHeartbeat = Date.now() - parseInt(lastHeartbeat);
    // Consider session invalid if more than 2 minutes without heartbeat
    return timeSinceLastHeartbeat < 120000; // 2 minutes
  }

  // Get current session ID
  static getSessionId(): string | null {
    return sessionStorage.getItem(this.SESSION_KEY);
  }

  // Check if this is a new browser session (browser was closed and reopened)
  static isNewBrowserSession(): boolean {
    const sessionId = sessionStorage.getItem(this.SESSION_KEY);
    const lastHeartbeat = localStorage.getItem(this.SESSION_HEARTBEAT_KEY);
    
    // If no session ID in sessionStorage but there's a heartbeat in localStorage,
    // it means browser was closed and reopened
    return !sessionId && !!lastHeartbeat;
  }

  // Generate a unique session ID
  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Clear all session data
  static clearSession(): void {
    sessionStorage.clear();
    localStorage.removeItem(this.SESSION_HEARTBEAT_KEY);
    this.stopHeartbeat();
  }
}
