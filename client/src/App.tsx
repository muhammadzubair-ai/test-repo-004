import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { AuthForm } from "@/components/AuthForm";
import { AuthProvider, useAuth } from "@/lib/auth";
import Notes from "@/pages/Notes";

function Home() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Notes /> : <Navigate to="/login" replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<AuthForm mode="login" />} />
      <Route path="/register" element={<AuthForm mode="register" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
