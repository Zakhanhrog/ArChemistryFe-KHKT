import api from './api';

/**
 * Send a message to AI assistant
 * @param {string} message - User's message
 * @param {Array} history - Optional conversation history
 * @returns {Promise<{response: string, success: boolean, error?: string}>}
 */
export const chatWithAI = async (message, history = []) => {
  try {
    const response = await api.post('/api/ai/chat', {
      message,
      history: history.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    });
    return response.data;
  } catch (error) {
    console.error('Error chatting with AI:', error);
    throw error;
  }
};

