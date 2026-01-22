import { AuthLayout } from '@/components/layout/AuthLayout';
import { LoginForm } from '@/components/auth/LoginForm';

export default function Login() {
  return (
    <AuthLayout
      title="Bem-vindo de volta"
      subtitle="Entre na sua conta para continuar"
    >
      <LoginForm />
    </AuthLayout>
  );
}
