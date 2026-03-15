import { authReducer, initialAuthState, AuthState } from './auth.reducer';
import * as AuthActions from './auth.actions';

describe('AuthReducer', () => {
  describe('unknown action', () => {
    it('should return the default state', () => {
      const action = { type: 'Unknown' };
      const state = authReducer(initialAuthState, action);

      expect(state).toBe(initialAuthState);
    });
  });

  describe('authLogin action', () => {
    it('should set status to loading and clear error', () => {
      const stateWithError: AuthState = { ...initialAuthState, error: 'Previous error' };
      const action = AuthActions.authLogin({ email: 'test@test.com', password: 'password' });
      const state = authReducer(stateWithError, action);

      expect(state.status).toBe('loading');
      expect(state.error).toBeNull();
    });
  });

  describe('authLoginSuccess action', () => {
    it('should set token, userId and status to authenticated', () => {
      const action = AuthActions.authLoginSuccess({ token: 'test-token', userId: 1 });
      const state = authReducer(initialAuthState, action);

      expect(state.token).toBe('test-token');
      expect(state.userId).toBe(1);
      expect(state.status).toBe('authenticated');
      expect(state.error).toBeNull();
    });
  });

  describe('authLoginFailure action', () => {
    it('should clear user data and set status to error', () => {
      const action = AuthActions.authLoginFailure({ error: 'Login failed' });
      const state = authReducer(initialAuthState, action);

      expect(state.token).toBeNull();
      expect(state.userId).toBeNull();
      expect(state.status).toBe('error');
      expect(state.error).toBe('Login failed');
    });
  });

  describe('authRegister action', () => {
    it('should set status to loading and clear error', () => {
      const action = AuthActions.authRegister({ email: 'test@test.com', password: 'password' });
      const state = authReducer(initialAuthState, action);

      expect(state.status).toBe('loading');
      expect(state.error).toBeNull();
    });
  });

  describe('authRegisterSuccess action', () => {
    it('should set token, userId and status to authenticated', () => {
      const action = AuthActions.authRegisterSuccess({ token: 'new-token', userId: 2 });
      const state = authReducer(initialAuthState, action);

      expect(state.token).toBe('new-token');
      expect(state.userId).toBe(2);
      expect(state.status).toBe('authenticated');
      expect(state.error).toBeNull();
    });
  });

  describe('authRegisterFailure action', () => {
    it('should clear user data and set status to error', () => {
      const action = AuthActions.authRegisterFailure({ error: 'Registration failed' });
      const state = authReducer(initialAuthState, action);

      expect(state.token).toBeNull();
      expect(state.userId).toBeNull();
      expect(state.status).toBe('error');
      expect(state.error).toBe('Registration failed');
    });
  });

  describe('authLogout action', () => {
    it('should set status to loading', () => {
      const action = AuthActions.authLogout();
      const state = authReducer(initialAuthState, action);

      expect(state.status).toBe('loading');
    });
  });

  describe('authLogoutSuccess action', () => {
    it('should reset the auth state', () => {
      const currentState: AuthState = {
        token: 'token',
        userId: 1,
        status: 'authenticated',
        error: null
      };
      const action = AuthActions.authLogoutSuccess();
      const state = authReducer(currentState, action);

      expect(state.token).toBeNull();
      expect(state.userId).toBeNull();
      expect(state.status).toBe('unauthenticated');
      expect(state.error).toBeNull();
    });
  });

  describe('authRestoreSession action', () => {
    it('should set status to loading', () => {
      const action = AuthActions.authRestoreSession();
      const state = authReducer(initialAuthState, action);

      expect(state.status).toBe('loading');
    });
  });

  describe('authRestoreSessionSuccess action', () => {
    it('should restore the session data', () => {
      const action = AuthActions.authRestoreSessionSuccess({ token: 'restored-token', userId: 10 });
      const state = authReducer(initialAuthState, action);

      expect(state.token).toBe('restored-token');
      expect(state.userId).toBe(10);
      expect(state.status).toBe('authenticated');
    });
  });

  describe('authRestoreSessionFailure action', () => {
    it('should clear session data and set status to unauthenticated', () => {
      const action = AuthActions.authRestoreSessionFailure();
      const state = authReducer(initialAuthState, action);

      expect(state.token).toBeNull();
      expect(state.userId).toBeNull();
      expect(state.status).toBe('unauthenticated');
    });
  });

  describe('authSetToken action', () => {
    it('should set token and status to authenticated', () => {
      const action = AuthActions.authSetToken({ token: 'external-token', userId: 5 });
      const state = authReducer(initialAuthState, action);

      expect(state.token).toBe('external-token');
      expect(state.userId).toBe(5);
      expect(state.status).toBe('authenticated');
    });
  });
});
