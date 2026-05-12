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

export interface ForgotPasswordDto {
  email: string;
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
      // 🔥 FIXED: Handle both JSON and plain text errors from .NET
      let errorMessage = `HTTP Error: ${response.status}`;

      try {
        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
          const errorJson = await response.json();
          errorMessage = errorJson.message || errorJson.error || JSON.stringify(errorJson);
        } else {
          // Plain text like "Invalid credentials"
          errorMessage = await response.text();
        }
      } catch (e) {
        // Fallback if reading body fails
        errorMessage = response.statusText || `Error ${response.status}`;
      }

      throw new Error(errorMessage.trim());
    }

    const data = await response.json();
    return data as T;
  }

  async register(data: RegisterDto): Promise<{ message: string }> {
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

  async forgotPassword(data: ForgotPasswordDto): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  logout() {
    this.setToken(null);
  }
}

export const api = new ApiClient();