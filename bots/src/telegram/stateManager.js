/**
 * Telegram State Manager
 * Manages user session states and view stack
 */

/**
 * State manager class
 */
export class TelegramStateManager {
  constructor() {
    this.viewStackByChatId = new Map(); // chatId -> [{ text, markup }]
    this.userStates = new Map(); // userId -> { action, step, data }
    this.alertsByUserId = new Map(); // userId -> alert config
  }

  /**
   * Push a view to the stack
   */
  pushView(chatId, text, markup) {
    const stack = this.viewStackByChatId.get(chatId) || [];
    stack.push({ text, markup });
    this.viewStackByChatId.set(chatId, stack);
  }

  /**
   * Pop a view from the stack
   */
  popView(chatId) {
    const stack = this.viewStackByChatId.get(chatId) || [];
    if (stack.length > 1) stack.pop();
    this.viewStackByChatId.set(chatId, stack);
    return stack[stack.length - 1];
  }

  /**
   * Get current view
   */
  getCurrentView(chatId) {
    const stack = this.viewStackByChatId.get(chatId) || [];
    return stack[stack.length - 1];
  }

  /**
   * Reset view stack for a chat
   */
  resetViewStack(chatId, initialView) {
    this.viewStackByChatId.set(chatId, [initialView]);
  }

  /**
   * Set user state
   */
  setUserState(userId, state) {
    this.userStates.set(userId, state);
  }

  /**
   * Get user state
   */
  getUserState(userId) {
    return this.userStates.get(userId);
  }

  /**
   * Clear user state
   */
  clearUserState(userId) {
    this.userStates.delete(userId);
  }

  /**
   * Set user alert
   */
  setUserAlert(userId, alert) {
    this.alertsByUserId.set(userId, alert);
  }

  /**
   * Get user alert
   */
  getUserAlert(userId) {
    return this.alertsByUserId.get(userId);
  }

  /**
   * Remove user alert
   */
  removeUserAlert(userId) {
    this.alertsByUserId.delete(userId);
  }

  /**
   * Check if user has alerts
   */
  hasUserAlert(userId) {
    return this.alertsByUserId.has(userId);
  }
}
