import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from './constants';
import {
  getStoredFiscalYearId,
  shouldAttachFiscalYear,
} from '../../lib/fiscal-year-service';

interface ApiResponse {
  statusCode: number;
  data: any;
  success: boolean;
  message: string;
}

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing = false;
  private pendingRequests: Array<{
    resolve: (value: string) => void;
    reject: (reason?: any) => void;
  }> = [];

  constructor() {
    this.loadTokens();
    console.log('🔵 ApiClient initialized, token:', this.token);

    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });

    // Request interceptor
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        // FormData must use multipart boundary — do not force JSON content-type
        if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
          const headers: any = config.headers;
          if (headers && typeof headers.delete === 'function') {
            headers.delete('Content-Type');
          } else if (headers) {
            delete headers['Content-Type'];
            delete headers['content-type'];
          }
        }

        // Attach selected fiscal year to accounting/report list GETs
        const method = (config.method || 'get').toLowerCase();
        if (method === 'get' && shouldAttachFiscalYear(config.url)) {
          const fyId = getStoredFiscalYearId();
          if (fyId) {
            const url = config.url || '';
            if (!/[?&]fiscalYearId=/.test(url)) {
              config.params = {
                ...(config.params || {}),
                fiscalYearId: config.params?.fiscalYearId || fyId,
              };
            }
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // Subscription expired / required — send user to pricing
        if (
          error.response?.status === 403 &&
          (error.response?.data?.code === 'SUBSCRIPTION_REQUIRED' ||
            String(error.response?.data?.message || '')
              .toLowerCase()
              .includes('subscription'))
        ) {
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('has_active_subscription', '0');
              document.cookie =
                'subscription_access=0; path=/; SameSite=Lax; max-age=604800';
            } catch {
              /* ignore */
            }
            if (!window.location.pathname.startsWith('/plans')) {
              window.location.href = '/plans';
            }
          }
          return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.pendingRequests.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return this.client(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          this.isRefreshing = true;
          
          try {
            const refreshResponse = await this.refreshTokenRequest();
            if (refreshResponse.success) {
              this.token = this.cleanToken(refreshResponse.data?.token);
              this.refreshToken = this.cleanToken(refreshResponse.data?.refreshToken);
              
              if (typeof window !== 'undefined') {
                localStorage.setItem('auth_token', this.token || '');
                localStorage.setItem('refresh_token', this.refreshToken || '');
              }
              
              this.pendingRequests.forEach(({ resolve }) => resolve(this.token!));
              this.pendingRequests = [];
              
              originalRequest.headers.Authorization = `Bearer ${this.token}`;
              return this.client(originalRequest);
            } else {
              this.clearTokens();
              this.pendingRequests.forEach(({ reject }) => reject(new Error('Session expired')));
              this.pendingRequests = [];
              return Promise.reject(error);
            }
          } finally {
            this.isRefreshing = false;
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  private cleanToken(token: string | null): string | null {
    if (!token) return null;
    return token.trim().replace(/"/g, '').replace(/\s/g, '');
  }

  // ========== PUBLIC METHODS ==========
  setTokens(token: string, refreshToken: string) {
    this.token = this.cleanToken(token);
    this.refreshToken = this.cleanToken(refreshToken);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', this.token || '');
      localStorage.setItem('refresh_token', this.refreshToken || '');
      console.log('🔵 Tokens saved:', this.token);
    }
  }

  clearTokens() {
    this.token = null;
    this.refreshToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('userProfile');
      localStorage.removeItem('bisonstechs_company_branding');
    }
  }

  loadTokens() {
    if (typeof window !== 'undefined') {
      this.token = this.cleanToken(localStorage.getItem('auth_token'));
      this.refreshToken = this.cleanToken(localStorage.getItem('refresh_token'));
      console.log('🔵 Tokens loaded from localStorage:', this.token);
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.loadTokens();
    }
    return this.token;
  }

  // ========== HTTP METHODS ==========
  async get(endpoint: string, requiresAuth: boolean = true): Promise<ApiResponse> {
    return this.request('GET', endpoint, null, requiresAuth);
  }

  async post(endpoint: string, body?: any, requiresAuth: boolean = true): Promise<ApiResponse> {
    return this.request('POST', endpoint, body, requiresAuth);
  }

  async put(endpoint: string, body?: any, requiresAuth: boolean = true): Promise<ApiResponse> {
    return this.request('PUT', endpoint, body, requiresAuth);
  }

  async patch(endpoint: string, body?: any, requiresAuth: boolean = true): Promise<ApiResponse> {
    return this.request('PATCH', endpoint, body, requiresAuth);
  }

  async delete(endpoint: string, requiresAuth: boolean = true): Promise<ApiResponse> {
    return this.request('DELETE', endpoint, null, requiresAuth);
  }

  // ========== CORE REQUEST METHOD ==========
  async request(
    method: string,
    endpoint: string,
    body?: any,
    requiresAuth: boolean = true
  ): Promise<ApiResponse> {
    try {
      const config: any = {
        method,
        url: endpoint,
        headers: {},
      };

      if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        config.data = body;
        // Let the browser/axios set multipart boundary for FormData
        if (typeof FormData !== 'undefined' && body instanceof FormData) {
          config.headers['Content-Type'] = undefined;
        }
      }

      if (!requiresAuth) {
        const response = await this.client(config);
        return this.processResponse(response);
      }

      // Ensure token is loaded
      const token = this.getToken();
      if (!token) {
        console.warn('🔴 No token available for authenticated request');
        return {
          statusCode: 401,
          data: null,
          success: false,
          message: 'No authentication token available',
        };
      }

      const response = await this.client(config);
      return this.processResponse(response);
    } catch (error: any) {
      if (error.response) {
        return {
          statusCode: error.response.status,
          data: error.response.data,
          success: false,
          message: error.response.data?.message || error.message,
        };
      }
      return {
        statusCode: 500,
        data: null,
        success: false,
        message: error.message || 'Network error',
      };
    }
  }

  // ========== PRIVATE HELPERS ==========
  private async refreshTokenRequest(): Promise<ApiResponse> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/users/refresh-token`,
        { refreshToken: this.refreshToken },
        { headers: { 'Content-Type': 'application/json' } }
      );
      return this.processResponse(response);
    } catch (error: any) {
      return {
        statusCode: error.response?.status || 500,
        data: null,
        success: false,
        message: error.message || 'Failed to refresh token',
      };
    }
  }

  private processResponse(response: AxiosResponse): ApiResponse {
    const data = response.data;
    const success = response.status >= 200 && response.status < 300;
    return {
      statusCode: response.status,
      data: data,
      success: success,
      message: data?.message || '',
    };
  }
}

// ========== EXPORT SINGLETON INSTANCE ==========
export const apiClient = new ApiClient();