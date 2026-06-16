import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
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

export async function requestOtp(email) {
  const response = await apiClient.post('/api/auth/request-otp', { email });
  return response.data;
}

export async function verifyOtp(email, otp) {
  const response = await apiClient.post('/api/auth/verify-otp', { email, otp });
  return response.data;
}

export async function getAdminUsers() {
  const response = await apiClient.get('/api/admin/users');
  return response.data;
}

export async function getAdminUserHistory(userId) {
  const response = await apiClient.get(`/api/admin/history/${userId}`);
  return response.data;
}

export async function getResumeBlob(analysisId, type = 'view') {
  const endpoint = type === 'view' ? `/api/view/${analysisId}` : `/api/download/${analysisId}`;
  const response = await apiClient.get(endpoint, {
    responseType: 'blob'
  });
  return response.data;
}

export default {
  analyzeResume,
  getHistory,
  requestOtp,
  verifyOtp,
  getAdminUsers,
  getAdminUserHistory,
  getResumeBlob,
};
