/**
 * Fetch wrapper with timeout support
 * Prevents requests from hanging indefinitely when network is slow or unavailable
 */

const DEFAULT_TIMEOUT = 15000; // 15 seconds

/**
 * Fetch with automatic timeout
 * @param {string} url - URL to fetch
 * @param {object} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds (default: 15000)
 * @returns {Promise<Response>}
 * @throws {Error} When request times out
 */
export const fetchWithTimeout = async (url, options = {}, timeout = DEFAULT_TIMEOUT) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - please check your connection');
    }
    throw error;
  }
};

export default fetchWithTimeout;
