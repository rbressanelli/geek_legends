import {
  createContext,
  ReactNode,
  useContext,
  useState,
  useEffect,
} from "react";
import { useHistory } from "react-router-dom";
import api from "../../services/api";
import jwtDecode from "jwt-decode";
import { toast } from "react-toastify";

import { History } from "history";
interface AuthProps {
  children: ReactNode;
}
interface UserLoginData {
  email: string;
  password: string;
}

interface UserData {
  userId?: number;
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  preferences: string;
  aboutMe: string;
  decode?: DecodeData;
}

interface DecodeData {
  email: string;
  iat: number;
  exp: number;
  sub?: string;
}

interface HeadersTypes {
  Authorization: string;
}
interface RequestConfigTypes {
  headers: HeadersTypes;
}

interface AuthProviderData {
  userSignup: (userData: UserData) => void;
  userLogin: (userData: UserLoginData) => void;
  Logout: (history: History) => void;
  userProfileUpdate: (userId: UserData, userData: UserData) => void;
  getUsers: () => void;
  userId: any;
  user: UserData;
  setUserId: any;
  authorized: boolean;
  setAuthorized: any;
  accessToken: string;
  config: RequestConfigTypes;
  usersList: any;
}

const AuthContext = createContext<AuthProviderData>({} as AuthProviderData);

export const AuthProvider = ({ children }: AuthProps) => {
  const history = useHistory();

  const [user, setUser] = useState<UserData>({} as UserData);
  const [userId, setUserId] = useState<Number>(0);
  const [authorized, setAuthorized] = useState<boolean>(false);

  const [config, setConfig] = useState<RequestConfigTypes>(
    {} as RequestConfigTypes
  );

  const [checkMove, setCheckMove] = useState<boolean>(false);
  const [usersList, setUsersList] = useState<UserData[]>({} as UserData[]);
  const [accessToken, setAccessToken] = useState<string>(
    () => localStorage.getItem("token") || ""
  );

  const userSignup = (userData: UserData) => {
    api
      .post("/users", userData)
      .then((response) => {
        console.log("Conta criada com sucesso!");
        setUser(response.data);
        history.push("/dashboard");
      })
      .catch((err) => {
        console.log(`erro ao criar`);
      });
  };

  const userLogin = (userData: UserLoginData) => {
    api
      .post("/login", userData)
      .then((response) => {
        console.log(response.data);
        const { accessToken } = response.data;
        localStorage.setItem(
          "@geekLegends:access",
          JSON.stringify(accessToken)
        );
        setAccessToken(accessToken);
        setAuthorized(true);
        toast.success("Login efetuado com sucesso!");
        history.push("/dashboard");
      })
      .catch((err) => toast.error(`Falha! Senha ou email incorreto => ${err}`));
  };

  const getUsers = () => {
    api
      .get(`/users`, config)
      .then((response) => {
        console.log(response.data);
      })
      .catch((err) => console.log(userId));
  };

  useEffect(() => {
    const token = accessToken;
    if (token) {
      const decode: UserData = jwtDecode(token);
      setUser(decode);
      setUserId(Number(decode.decode?.sub));
      setAuthorized(true);
      getUsers();
    }
    // esse setConfig aparecia em outro useEffect, com [accessToken],
    // mudei para um só
    setConfig({
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }, [accessToken, checkMove]);

  const userProfileUpdate = (userId: UserData, userData: UserData) => {
    api
      .patch(
        `/users/${userId}/`,
        {
          name: userData.name,
          email: userData.email,
          password: userData.password,
          preferences: userData.preferences,
          aboutMe: userData.aboutMe,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )
      .then((response) => {
        setCheckMove(!checkMove);
        console.log(`Usuário alterado. Olá ${response.data.username}`);
      })
      .catch((err) => {
        console.log(err);
        console.log("Nome inválido");
      });
  };

  const Logout = (history: History) => {
    localStorage.clear();

    setAccessToken("");

    history.push("/login");

    console.log("Logout realizado");
  };

  return (
    <AuthContext.Provider
      value={{
        userSignup,
        Logout,
        userLogin,
        userId,
        user,
        setUserId,
        usersList,
        userProfileUpdate,
        authorized,
        setAuthorized,
        accessToken,
        config,
        getUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
