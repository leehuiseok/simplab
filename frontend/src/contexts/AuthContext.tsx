import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { apiGet, apiPost } from "../shared/api";

interface User {
  id: string;
  email: string;
  name: string;
  region?: string;
  school?: string;
  major?: string;
  job_field?: string;
  skills?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    region?: string
  ) => Promise<void>;
  logout: () => void;
  loading: boolean;
  updateUser: (updatedUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 토큰이 있으면 사용자 정보 조회
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
      // 토큰으로 사용자 정보 조회
      apiGet<{ success: boolean; data: { user: User } }>("/api/auth/me")
        .then((data) => {
          setUser(data.data.user);
        })
        .catch(() => {
          // 토큰이 유효하지 않으면 제거
          localStorage.removeItem("token");
          setToken(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiPost<{
      success: boolean;
      data: { user: User; token: string };
    }>("/api/auth/login", {
      email,
      password,
    });

    setUser(response.data.user);
    setToken(response.data.token);
    localStorage.setItem("token", response.data.token);
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    region?: string
  ) => {
    const response = await apiPost<{
      success: boolean;
      data: { user: User; token: string };
    }>("/api/auth/register", {
      email,
      password,
      name,
      region,
    });

    setUser(response.data.user);
    setToken(response.data.token);
    localStorage.setItem("token", response.data.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
  };

  const updateUser = (updatedUser: Partial<User>) => {
    setUser((prevUser) => {
      if (!prevUser) return null;
      return { ...prevUser, ...updatedUser };
    });
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
