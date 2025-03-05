import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const handleLogout = () => {
    window.location.href = "http://localhost:3001/logout"; // ✅ Redirige directamente al backend
  };

  return (
    <div>
      <h1>Bienvenido al Dashboard 🎉</h1>
      <button onClick={handleLogout}>Cerrar sesión</button>
    </div>
  );
};

export default Dashboard;
