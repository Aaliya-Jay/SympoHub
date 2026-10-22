import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const apiClient = axios.create({ baseURL, timeout: 20000 });

apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('sympohub_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function apiRequest(path, config = {}) {
  const response = await apiClient.request({ url: path, ...config });
  return response.data;
}

export function getApiError(error, fallback = 'Something went wrong. Please try again.') {
  return error?.response?.data?.message || error?.message || fallback;
}

export async function downloadAttendeesCsv(eventId) {
  const response = await apiClient.get(`/events/${eventId}/export`, { responseType: 'blob' });
  const disposition = response.headers['content-disposition'] || '';
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const filename = match?.[1] || 'event-attendees.csv';
  const url = URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8;' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
