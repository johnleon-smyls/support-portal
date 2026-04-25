// === FRAPPE API CLIENT (NFR-10: RESTful API Integration with Frappe Helpdesk) ===
// All backend communication flows through this client → Next.js proxy → Frappe Cloud.
// Backend permission_query() handles data isolation (FR-13) automatically per user session.

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { FrappeAuthConfig, FrappeErrorResponse } from '@/types/auth';

class FrappeAPIClient {
  private client: AxiosInstance;
  private config: FrappeAuthConfig;

  constructor(config: FrappeAuthConfig) {
    this.config = config;
    
    this.client = axios.create({
      baseURL: '/api/frappe', // Use our Next.js API proxy
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });

    this.setupInterceptors();
  }

  // === REQUEST/RESPONSE INTERCEPTORS (NFR-07: User-friendly error messages) ===
  private setupInterceptors() {
    // Request interceptor — ensure cookies are sent for session auth
    this.client.interceptors.request.use((config) => {
      config.withCredentials = true;
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        if (process.env.NEXT_PUBLIC_API_DEBUG === 'true') {
          console.log('API Response:', response);
        }
        return response;
      },
      (error) => {
        if (process.env.NEXT_PUBLIC_API_DEBUG === 'true') {
          console.error('API Error:', error);
        }

        // For 417 errors on HD Article requests, don't create an error - let the calling code handle it
        if (error.response?.status === 417 && 
            (error.config?.url?.includes('HD Article') || error.config?.url?.includes('HD%20Article'))) {
          console.log('HD Article 417 error - likely doctype not available or invalid filter');
          // Return the error object but don't reject, so calling code can handle it
          return Promise.reject({ 
            status: 417, 
            response: error.response,
            message: 'HD Article API error - invalid filter or doctype not available',
            skipErrorHandling: true 
          });
        }

        // For 404 errors, also allow graceful handling
        if (error.response?.status === 404) {
          return Promise.reject({
            status: 404,
            response: error.response,
            message: error.response?.data?.message || 'Resource not found',
            skipErrorHandling: false
          });
        }

        let errorMessage = 'An unexpected error occurred';
        
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'Request timeout - server took too long to respond';
        } else if (error.code === 'ERR_NETWORK') {
          errorMessage = 'Network error - could not connect to server. Check if CORS is configured.';
        } else if (error.response?.status === 0) {
          errorMessage = 'CORS error - server not allowing requests from localhost';
        } else if (error.response?.status === 401) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.response?.status === 403) {
          errorMessage = 'Access denied. Your account may not have permission to access this system.';
        } else if (error.response?.status === 404) {
          errorMessage = 'API endpoint not found. Please contact support.';
        } else if (error.response?.status === 417) {
          errorMessage = 'Resource not available. This feature may not be configured in your system.';
        } else if (error.response?.status >= 500) {
          errorMessage = 'Server error. Please try again later or contact support.';
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        // Disable automatic redirect on 401 - we handle auth state in components
        // This prevents unwanted redirects when API token requests fail
        // if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
        //   window.location.href = '/login';
        // }

        const frappeError: FrappeErrorResponse = {
          message: errorMessage,
          exc_type: error.response?.data?.exc_type,
          exception: error.response?.data?.exception,
        };

        return Promise.reject(frappeError);
      }
    );
  }

  // Generic method for making requests
  async request<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.client.request<T>(config);
    return response.data;
  }

  // GET request
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  // POST request
  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  // PUT request
  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  // DELETE request
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  // === AUTHENTICATION (FR-02: Email/password login, FR-15: Secure logout) ===
  async login(usr: string, pwd: string) {
    return this.post('/method/login', { usr, pwd });
  }

  // Logout method
  async logout() {
    return this.post('/method/logout');
  }

  // Get current user info
  async getCurrentUser() {
    return this.get('/method/frappe.auth.get_logged_user');
  }

  // Get user details including custom fields (bypasses REST API caching)
  async getUserDetails(email: string) {
    return this.post('/method/frappe.client.get_value', {
      doctype: 'User',
      filters: { name: email },
      fieldname: ['name', 'full_name', 'first_name', 'last_name', 'email', 'enabled', 'user_type']
    });
  }

  // === USER MANAGEMENT (FR-01: Registration, FR-03: Invite system) ===
  
  // User signup
  async signUp(userData: { email: string; full_name: string; password: string }) {
    return this.post('/method/frappe.core.doctype.user.user.sign_up', userData);
  }

  // Assign role to user
  async assignRole(user: string, role: string) {
    return this.post('/resource/User Role', {
      user,
      role,
      doctype: 'User Role'
    });
  }

  // === TICKETS (FR-04: Creation, FR-05: Dashboard listing, FR-07: Search) ===
  // Backend permission_query() automatically filters by HD Customer (FR-13)
  async getTickets(filters?: Record<string, unknown>) {
    const params: Record<string, string> = {};
    if (filters) {
      params.filters = JSON.stringify(filters);
    }
    params.fields = JSON.stringify([
      'name', 'subject', 'description', 'status', 'priority',
      'raised_by', 'creation', 'modified', 'owner', 'ticket_type'
    ]);

    return this.get(`/resource/HD Ticket`, { params });
  }

  async getTicket(ticketId: string) {
    return this.get(`/resource/HD Ticket/${ticketId}`);
  }

  async createTicket(ticketData: Record<string, unknown>) {
    return this.post(`/resource/HD Ticket`, ticketData);
  }

  async updateTicket(ticketId: string, ticketData: Record<string, unknown>) {
    return this.put(`/resource/HD Ticket/${ticketId}`, ticketData);
  }

  // === TICKET REPLIES (via Helpdesk's whitelisted get_one, which includes communications) ===
  async getTicketReplies(ticketId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = await this.get(`/method/helpdesk.helpdesk.doctype.hd_ticket.api.get_one`, {
      params: { name: ticketId },
    });
    return { data: response?.message?.communications || [] };
  }

  async addTicketReply(ticketId: string, content: string) {
    return this.post(`/method/run_doc_method`, {
      dt: 'HD Ticket',
      dn: ticketId,
      method: 'create_communication_via_contact',
      args: JSON.stringify({ message: content }),
    });
  }

  // === KNOWLEDGE BASE (FR-10: Browse articles, FR-11: Search, FR-12: Detail view) ===
  async getArticles() {
    try {
      console.log('🔍 Attempting to load HD Articles from API...');

      // Specify fields to fetch - Frappe defaults to only 'name' if not specified
      // Note: Some fields like 'is_public', 'helpful_count' are not permitted in HD Article queries
      const fields = [
        'name',
        'title',
        'content',
        'status',
        'category',
        'author',
        'creation',
        'modified',
        'owner'
      ];

      const result = await this.get(`/resource/HD Article?fields=${JSON.stringify(fields)}`);
      console.log('✅ HD Articles loaded successfully:', result);
      return result;
    } catch (error: unknown) {
      console.error('❌ HD Article API error:', error);
      // Type guard for axios errors
      const isAxiosError = (err: unknown): err is { response?: { status: number }; status?: number; skipErrorHandling?: boolean } => {
        return typeof err === 'object' && err !== null;
      };
      // If HD Article doctype doesn't exist (417), return empty data instead of throwing
      if (isAxiosError(error) && (error?.response?.status === 417 || error?.status === 417 || error?.skipErrorHandling)) {
        console.log('⚠️ HD Article doctype not available, returning empty data');
        return { data: [] };
      }
      throw error; // Re-throw other errors
    }
  }

  async getArticle(articleId: string) {
    return this.get(`/resource/HD Article/${articleId}`);
  }

  // === TICKET SEARCH (FR-07: Find tickets by keywords) ===
  async searchTickets(query: string) {
    return this.get('/resource/HD Ticket', {
      params: {
        filters: JSON.stringify({
          subject: ['like', `%${query}%`]
        }),
        fields: JSON.stringify([
          'name', 'subject', 'description', 'status', 'priority',
          'raised_by', 'creation', 'modified', 'owner', 'ticket_type'
        ])
      }
    });
  }

  async searchArticles(query: string) {
    // Specify fields to fetch - same as getArticles()
    // Note: Some fields like 'is_public', 'helpful_count' are not permitted in HD Article queries
    const fields = [
      'name',
      'title',
      'content',
      'status',
      'category',
      'author',
      'creation',
      'modified',
      'owner'
    ];

    return this.get('/resource/HD Article', {
      params: {
        fields: JSON.stringify(fields),
        filters: JSON.stringify({
          title: ['like', `%${query}%`],
          status: 'Published'
        })
      }
    });
  }

  // === PASSWORD RESET (FR-16: Forgot password via email) ===
  async resetPassword(email: string) {
    return this.post('/method/frappe.core.doctype.user.user.reset_password', {
      user: email
    });
  }

  // === INVITE SYSTEM (FR-03: Tokenized email invite links) ===
  async validateInviteToken(key: string): Promise<{ message: { valid: boolean; email?: string; first_name?: string; error?: string } }> {
    return this.post('/method/validate_invite_token', { key });
  }

  async acceptInvite(data: { key: string; password: string; first_name: string; last_name?: string }): Promise<{ message: { success: boolean; email?: string; error?: string } }> {
    return this.post('/method/accept_invite', data);
  }
}

// Create and export the API client instance
// In demo mode (NEXT_PUBLIC_DEMO_MODE=true), uses a mock client with dummy data
import { DemoAPIClient } from './demo-api';
import { isDemoMode } from './demo-data';

export const createAPIClient = (): FrappeAPIClient | DemoAPIClient => {
  if (isDemoMode()) {
    return new DemoAPIClient();
  }

  const config: FrappeAuthConfig = {
    baseUrl: process.env.NEXT_PUBLIC_FRAPPE_BASE_URL || '',
    apiVersion: process.env.NEXT_PUBLIC_FRAPPE_API_VERSION || 'v2',
  };

  if (!config.baseUrl) {
    throw new Error('NEXT_PUBLIC_FRAPPE_BASE_URL is required');
  }

  return new FrappeAPIClient(config);
};

export const apiClient = createAPIClient();