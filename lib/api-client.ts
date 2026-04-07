/**
 * API Client Wrapper
 * Handles all HTTP requests with error handling and token management
 */

import { API_BASE_URL } from './constants'

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
  status: number
}

export interface ApiError {
  message: string
  status: number
  code?: string
}

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    this.loadToken()
  }

  private loadToken() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token')
    }
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
    }
  }

  clearToken() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('booth_id')
      localStorage.removeItem('user_role')
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    return headers
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type')
    let data

    try {
      if (contentType?.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }
    } catch {
      data = null
    }

    if (!response.ok) {
      const error: ApiError = {
        message: data?.message || data?.error || `HTTP ${response.status}`,
        status: response.status,
        code: data?.code,
      }
      throw error
    }

    return data as T
  }

  async get<T = unknown>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
      ...options,
    })

    return this.handleResponse<T>(response)
  }

  async post<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    })

    return this.handleResponse<T>(response)
  }

  async put<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    })

    return this.handleResponse<T>(response)
  }

  async patch<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const response = await fetch(url, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    })

    return this.handleResponse<T>(response)
  }

  async delete<T = unknown>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(),
      ...options,
    })

    return this.handleResponse<T>(response)
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
