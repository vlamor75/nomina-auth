import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

const PrivateRoute = ({ component: Component }: { component: React.FC }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get("http://localhost:3001/api/auth/me", { withCredentials: true });
        setIsAuthenticated(response.data.isAuthenticated);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  if (isAuthenticated === null) return <p>Cargando...</p>;
  return isAuthenticated ? <Component /> : <Navigate to="/login" />;
};

export default PrivateRoute;
