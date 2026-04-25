// === AUTH STATE MANAGEMENT (FR-02: Email/password login, FR-15: Secure logout) ===
// Zustand store with localStorage persistence handles login, logout, and session validation.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthStore, LoginCredentials, FrappeUser } from '@/types/auth';
import { apiClient } from '@/lib/api';
import { isDemoMode, DEMO_USER } from '@/lib/demo-data';

// Fetch role info from Helpdesk's get_user endpoint
async function fetchHelpdeskRoles(): Promise<{
  is_agent: boolean;
  is_admin: boolean;
  is_manager: boolean;
  has_desk_access: boolean;
  user_image?: string;
}> {
  try {
    const response = await apiClient.get('/method/helpdesk.api.auth.get_user');
    const data = (response as { message?: Record<string, unknown> })?.message;
    return {
      is_agent: !!data?.is_agent,
      is_admin: !!data?.is_admin,
      is_manager: !!data?.is_manager,
      has_desk_access: !!data?.has_desk_access,
      user_image: data?.user_image as string | undefined,
    };
  } catch {
    return { is_agent: false, is_admin: false, is_manager: false, has_desk_access: false };
  }
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: false,
      error: null,
      isAgent: false,
      isAdmin: false,
      isCustomer: true,

      // === LOGIN (FR-02: Email/password login via Frappe API) ===
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });

        try {
          // Demo mode: skip real API, use demo user directly
          if (isDemoMode()) {
            await new Promise((r) => setTimeout(r, 400)); // Simulate network delay
            const user: FrappeUser = {
              name: DEMO_USER.name,
              email: DEMO_USER.email,
              full_name: DEMO_USER.full_name,
              first_name: DEMO_USER.first_name,
              last_name: DEMO_USER.last_name,
              roles: DEMO_USER.roles,
              enabled: 1,
              user_type: DEMO_USER.user_type,
            };
            set({ user, isAuthenticated: true, isLoading: false, error: null });
            return;
          }

          const response = await apiClient.login(credentials.usr, credentials.pwd);
          const authData = response as { full_name?: string; first_name?: string; last_name?: string; message?: { full_name?: string; first_name?: string; last_name?: string } };

          // Fetch user details for basic info
          let fullName = authData.full_name || authData.message?.full_name || 'Unknown User';
          let firstName = authData.first_name || authData.message?.first_name || '';
          let lastName = authData.last_name || authData.message?.last_name || '';

          try {
            const userDoc = await apiClient.getUserDetails(credentials.usr);
            const userDocData = userDoc as {
              message?: {
                full_name?: string;
                first_name?: string;
                last_name?: string;
              }
            };
            fullName = userDocData.message?.full_name || fullName;
            firstName = userDocData.message?.first_name || firstName;
            lastName = userDocData.message?.last_name || lastName;
          } catch (fetchError) {
            console.warn('Could not fetch user details during login:', fetchError);
          }

          // Fetch role info from Helpdesk
          const roles = await fetchHelpdeskRoles();

          const user: FrappeUser = {
            name: credentials.usr,
            email: credentials.usr,
            full_name: fullName,
            first_name: firstName,
            last_name: lastName,
            roles: [],
            enabled: 1,
            user_type: roles.has_desk_access ? 'System User' : 'Website User',
            is_agent: roles.is_agent,
            is_admin: roles.is_admin,
            is_manager: roles.is_manager,
            has_desk_access: roles.has_desk_access,
            user_image: roles.user_image,
          };

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            isAgent: roles.is_agent,
            isAdmin: roles.is_admin,
            isCustomer: !roles.is_agent && !roles.is_admin,
          });
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      // === LOGOUT (FR-15: Secure logout with session invalidation) ===
      logout: async () => {
        set({ isLoading: true });
        
        try {
          await apiClient.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            isAgent: false,
            isAdmin: false,
            isCustomer: true,
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      // === SESSION VALIDATION (FR-02: Verify active session on page reload) ===
      checkSession: async () => {
        // Demo mode: trust persisted state, no API validation needed
        if (isDemoMode()) {
          set({ isLoading: false });
          return true;
        }

        // Get the current persisted user before making API calls
        const currentUser = useAuthStore.getState().user;

        set({ isLoading: true });

        try {
          // Call Frappe's getCurrentUser to check if session cookie is valid
          const response = await apiClient.getCurrentUser();
          const userData = response as { message?: string; email?: string };

          // getCurrentUser only returns the email
          const sessionEmail = userData.message || userData.email;

          if (!sessionEmail) {
            throw new Error('No user email returned from session check');
          }

          // If session returns "Administrator" but we expected a different user,
          // the session is invalid — force re-login rather than trusting stale state.
          if (sessionEmail === 'Administrator' && currentUser && currentUser.email !== 'Administrator') {
            console.warn('Session returned Administrator instead of expected user — clearing auth state');
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              isAgent: false,
              isAdmin: false,
              isCustomer: true,
            });
            return false;
          }

          // If the session email matches our persisted user, refresh roles but keep user data
          if (currentUser && currentUser.email === sessionEmail) {
            console.log('Session valid for user:', sessionEmail);
            const roles = await fetchHelpdeskRoles();
            set({
              isLoading: false,
              isAgent: roles.is_agent,
              isAdmin: roles.is_admin,
              isCustomer: !roles.is_agent && !roles.is_admin,
            });
            return true;
          }

          // Session email differs from persisted user - need to update
          // Fetch the full user document to get name, roles, etc.
          // Use frappe.client.get_value method which bypasses REST API caching
          try {
            const userDoc = await apiClient.getUserDetails(sessionEmail);
            const userDocData = userDoc as {
              message?: {
                name?: string;
                full_name?: string;
                first_name?: string;
                last_name?: string;
                enabled?: number;
                user_type?: string;
              }
            };

            // Log the response to debug
            console.log('User details response:', userDocData);

            const user: FrappeUser = {
              name: userDocData.message?.name || sessionEmail,
              email: sessionEmail,
              full_name: userDocData.message?.full_name || userDocData.message?.name || sessionEmail,
              first_name: userDocData.message?.first_name || '',
              last_name: userDocData.message?.last_name || '',
              roles: [],
              enabled: userDocData.message?.enabled || 1,
              user_type: userDocData.message?.user_type || 'System User',
            };

            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            return true;
          } catch (userFetchError) {
            // If we can't fetch user details, use just the email
            console.warn('Could not fetch user details, using email only:', userFetchError);

            const user: FrappeUser = {
              name: sessionEmail,
              email: sessionEmail,
              full_name: sessionEmail,
              first_name: '',
              last_name: '',
              roles: [],
              enabled: 1,
              user_type: 'System User',
            };

            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            return true;
          }
        } catch {
          // Session is invalid or expired, clear auth state
          console.log('No valid session found, user needs to login');
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });

          return false;
        }
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isAgent: state.isAgent,
        isAdmin: state.isAdmin,
        isCustomer: state.isCustomer,
      }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.log('Error rehydrating auth store:', error);
            if (state) {
              state.hasHydrated = true;
            }
            return;
          }

          if (state) {
            // Mark as hydrated first
            state.hasHydrated = true;

            // Only validate session if user was previously authenticated
            // This prevents unnecessary API calls and doesn't interfere with fresh logins
            if (state.isAuthenticated) {
              console.log('Found persisted auth state, validating session...');
              state.checkSession();
            } else {
              console.log('No persisted auth state, skipping session check');
            }
          }
        };
      },
    }
  )
);