import { useEffect } from "react";

const Login = () => {
  useEffect(() => {
    window.location.href = "http://localhost:3001/login"; // Redirige al backend
  }, []);

  return <p>Redirigiendo a Cognito...</p>;
};

export default Login;
