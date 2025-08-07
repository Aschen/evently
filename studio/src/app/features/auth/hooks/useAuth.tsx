import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Api } from '../../../shared/libs/api';
import { AuthState, LoginCredentials } from '../models/auth.model';
import { 
  CurrentUserResponseDTO, 
  LoginWithPasswordResponseDto,
  LoginWithPasswordParamsDto 
} from '@evently/api-client';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const checkAuth = async () => {
    try {
      const response = await Api.get<CurrentUserResponseDTO>('/auth/current-user');
      if (response.data.user) {
        setAuthState({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const login = async (credentials: LoginCredentials) => {
    // Business rule: rule-auth-form-validation - Email format and required fields are validated by the form
    const loginParams: LoginWithPasswordParamsDto = {
      email: credentials.email,
      password: credentials.password,
      returnToken: true,
    };

    const response = await Api.post<LoginWithPasswordResponseDto>('/auth/login', loginParams);
    
    // Business rule: rule-auth-token-management - Store JWT token
    if (response.data.token) {
      localStorage.setItem('jwt_token', response.data.token);
      // Update axios default headers
      Api.get('/auth/current-user').then((res) => {
        if (res.data.user) {
          setAuthState({
            user: res.data.user,
            isAuthenticated: true,
            isLoading: false,
          });
          
          // Business rule: rule-auth-redirect-after-login - Redirect to home page
          navigate('/');
        }
      });
    }
  };

  const logout = async () => {
    try {
      await Api.post('/auth/logout');
    } catch (error) {
      // Continue with local logout even if API call fails
    }
    
    // Business rule: rule-auth-token-management - Clear stored token
    localStorage.removeItem('jwt_token');
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    navigate('/');
  };

  useEffect(() => {
    // Business rule: rule-auth-persistent-session - Check auth status on mount
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider 
      value={{ 
        ...authState, 
        login, 
        logout, 
        checkAuth 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};