import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PrivateRoute from "./components/PrivateRoute";
import Empresa from "./pages/Empresa";
import Persona from "./pages/Persona";
import Sede from "./pages/Sede";
import AsignacionSede from "./pages/AsignacionSede";
import Contrato from "./pages/Contrato";
import Deducciones from "./pages/Deducciones";
import Planilla from "./pages/Planilla";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<PrivateRoute component={Dashboard} />} />
        <Route path="/empresa" element={<PrivateRoute component={Empresa} />} />
        <Route path="/persona" element={<PrivateRoute component={Persona} />} />
        <Route path="/sede" element={<PrivateRoute component={Sede} />} />
        <Route path="/asignacion-sede" element={<PrivateRoute component={AsignacionSede} />} />
        <Route path="/contrato" element={<PrivateRoute component={Contrato} />} />
        <Route path="/deducciones" element={<PrivateRoute component={Deducciones} />} />
        <Route path="/planilla" element={<PrivateRoute component={Planilla} />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

export default App;
