import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Uploads a resume and compares it against an optional job description.
 * @param {File} file - PDF or DOCX file object.
 * @param {string} jobDescription - Target job description text.
 * @returns {Promise<Object>} API response with ATS score, breakdown, feedback, and optimization details.
 */
export async function analyzeResume(file, jobDescription) {
  const formData = new FormData();
  formData.append('file', file);
  if (jobDescription) {
    formData.append('jobDescription', jobDescription);
  }

  const response = await apiClient.post('/api/analyze', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

/**
 * Fetches the user's scan history.
 * @returns {Promise<Array>} List of historical analysis items sorted in descending chronological order.
 */
export async function getHistory() {
  const response = await apiClient.get('/api/history');
  return response.data;
}

export default {
  analyzeResume,
  getHistory,
};
