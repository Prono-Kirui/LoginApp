// src/lib/api.ts
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5043';

export interface User {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterDto {
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) localStorage.setItem('authToken', token);
    else localStorage.removeItem('authToken');
  }

  getToken(): string | null {
    if (!this.token) this.token = localStorage.getItem('authToken');
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };

    const token = this.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API Error: ${response.status}`);
    }

    // This is the key fix for TypeScript strict mode
    const data = await response.json();
    return data as T;
  }

  async register(data: RegisterDto): Promise<{ message: string }> {
    console.log("📤 Sending to backend:", data);   // ← Add this line

    return this.request<{ message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginDto): Promise<LoginResponse> {
    return this.request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  logout() {
    this.setToken(null);
  }
}

export const api = new ApiClient();