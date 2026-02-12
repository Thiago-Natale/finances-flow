import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Dashboard from "./pages/Dashboard";
import PerfilFinanceiro from "./pages/PerfilFinanceiro";
import Categorias from "./pages/Categorias";
import Movimentacoes from "./pages/Movimentacoes";
import EmprestimosPage from "./pages/Emprestimos";
import MinhaConta from "./pages/MinhaConta";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/perfil-financeiro" element={
              <ProtectedRoute>
                <PerfilFinanceiro />
              </ProtectedRoute>
            } />
            <Route path="/categorias" element={
              <ProtectedRoute>
                <Categorias />
              </ProtectedRoute>
            } />
            <Route path="/movimentacoes" element={
              <ProtectedRoute>
                <Movimentacoes />
              </ProtectedRoute>
            } />
            <Route path="/emprestimos" element={
              <ProtectedRoute>
                <EmprestimosPage />
              </ProtectedRoute>
            } />
            <Route path="/minha-conta" element={
              <ProtectedRoute>
                <MinhaConta />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
