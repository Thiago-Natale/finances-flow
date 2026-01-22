import { AuthLayout } from '@/components/layout/AuthLayout';
import { RegisterForm } from '@/components/auth/RegisterForm';

export default function Cadastro() {
  return (
    <AuthLayout
      title="Crie sua conta"
      subtitle="Comece a organizar suas finanças hoje"
    >
      <RegisterForm />
    </AuthLayout>
  );
}
