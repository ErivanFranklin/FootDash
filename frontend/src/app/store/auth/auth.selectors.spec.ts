import { AuthState, initialAuthState } from './auth.reducer';
import * as AuthSelectors from './auth.selectors';

describe('AuthSelectors', () => {
  const initialState: AuthState = {
    token: 'test-token',
    userId: 1,
    status: 'authenticated',
    error: null
  };

  const state = {
    auth: initialState
  };

  describe('selectAuthState', () => {
    it('should select the auth state', () => {
      const result = AuthSelectors.selectAuthState(state);
      expect(result).toEqual(initialState);
    });
  });

  describe('selectToken', () => {
    it('should return the token', () => {
      const result = AuthSelectors.selectToken(state);
      expect(result).toBe('test-token');
    });
  });

  describe('selectUserId', () => {
    it('should return the userId', () => {
      const result = AuthSelectors.selectUserId(state);
      expect(result).toBe(1);
    });
  });

  describe('selectAuthStatus', () => {
    it('should return the status', () => {
      const result = AuthSelectors.selectAuthStatus(state);
      expect(result).toBe('authenticated');
    });
  });

  describe('selectAuthError', () => {
    it('should return the error', () => {
      const result = AuthSelectors.selectAuthError(state);
      expect(result).toBeNull();
    });
  });

  describe('selectIsAuthenticated', () => {
    it('should return true when status is authenticated and token is present', () => {
      const result = AuthSelectors.selectIsAuthenticated(state);
      expect(result).toBeTrue();
    });

    it('should return false when status is unauthenticated', () => {
      const unauthState: AuthState = { ...initialState, status: 'unauthenticated' };
      const result = AuthSelectors.selectIsAuthenticated({ auth: unauthState });
      expect(result).toBeFalse();
    });

    it('should return false when token is missing', () => {
      const noTokenState: AuthState = { ...initialState, token: null };
      const result = AuthSelectors.selectIsAuthenticated({ auth: noTokenState });
      expect(result).toBeFalse();
    });
  });

  describe('selectIsAuthLoading', () => {
    it('should return true when status is loading', () => {
      const loadingState: AuthState = { ...initialState, status: 'loading' };
      const result = AuthSelectors.selectIsAuthLoading({ auth: loadingState });
      expect(result).toBeTrue();
    });

    it('should return false when status is not loading', () => {
      const result = AuthSelectors.selectIsAuthLoading(state);
      expect(result).toBeFalse();
    });
  });
});
