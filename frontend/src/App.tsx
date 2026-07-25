import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Console from './pages/Console';
import Players from './pages/Players';
import Plugins from './pages/Plugins';
import Settings from './pages/Settings';
import Tasks from './pages/Tasks';
import FileManager from './pages/FileManager';
import Variables from './pages/Variables';
import { useAuthStore } from './store/authStore';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore((state) => state.token);
  return token ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="console" element={<Console />} />
          <Route path="players" element={<Players />} />
          <Route path="plugins" element={<Plugins />} />
          <Route path="files" element={<FileManager />} />
          <Route path="variables" element={<Variables />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
