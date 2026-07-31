import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import { loginSchema, type LoginFormData } from '../schemas/login.schema';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        toast.error('E-mail ou senha incorretos.');
      } else {
        toast.error('Ocorreu um erro ao tentar entrar. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="E-mail"
        placeholder="seu@email.com"
        icon={<Mail size={18} />}
        error={errors.email?.message}
        {...register('email')}
      />

      <div className="relative">
        <Input
          label="Senha"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          icon={<Lock size={18} />}
          error={errors.password?.message}
          {...register('password')}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-[34px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
          <input
            type="checkbox"
            className="rounded border-border text-primary focus:ring-primary/20"
            {...register('rememberMe')}
          />
          Lembrar-me
        </label>
        <a href="#" className="text-sm font-medium text-primary hover:underline">
          Esqueci minha senha
        </a>
      </div>

      <Button type="submit" className="w-full" isLoading={isLoading}>
        Entrar
      </Button>

      {import.meta.env.VITE_ENABLE_TEST_USER === 'true' && (
        <Button 
          type="button" 
          variant="ghost" 
          className="w-full text-xs text-muted-foreground mt-2"
          onClick={async () => {
            setIsLoading(true);
            try {
              // Note: This is a client-side seed for DEV only.
              // In a real app, this would be a server-side script or admin-only action.
              toast.loading('Provisionando ambiente de teste...');
              
              // We need to create a user first. But we can't create one without being logged in or using admin SDK.
              // However, we can use createUserWithEmailAndPassword.
              const { createUserWithEmailAndPassword } = await import('firebase/auth');
              const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
              const { db } = await import('../../../lib/firebase');
              
              const userCred = await createUserWithEmailAndPassword(auth, 'teste@teste.com', '123456');
              
              // Create Company
              await setDoc(doc(db, 'companies', 'company_test_001'), {
                id: 'company_test_001',
                name: 'iContábil Demo',
                cnpj: '00.000.000/0001-00',
                plan: 'enterprise',
                active: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                createdBy: 'system',
                updatedBy: 'system',
              });

              // Create User Doc
              await setDoc(doc(db, 'users', userCred.user.uid), {
                id: userCred.user.uid,
                companyId: 'company_test_001',
                name: 'Administrador Teste',
                email: 'teste@teste.com',
                phone: '(91) 98402-7568',
                role: 'global_admin',
                status: 'active',
                active: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                createdBy: 'system',
                updatedBy: 'system',
              });

              toast.dismiss();
              toast.success('Ambiente de teste configurado! Agora você pode entrar.');
            } catch (err: any) {
              toast.dismiss();
              if (err.code === 'auth/email-already-in-use') {
                toast.error('Usuário de teste já existe. Tente fazer login.');
              } else {
                console.error(err);
                toast.error('Erro ao configurar: ' + err.message);
              }
            } finally {
              setIsLoading(false);
            }
          }}
        >
          Configurar Ambiente de Teste (Dev Only)
        </Button>
      )}

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border"></span>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Ou continue com</span>
        </div>
      </div>

      <Button type="button" variant="outline" className="w-full gap-2">
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Google
      </Button>
    </form>
  );
}
