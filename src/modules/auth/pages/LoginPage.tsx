import React from 'react';
import { LoginForm } from '../components/LoginForm';

export function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-primary/20">
            iC
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
            iContábil CRM
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Acesse sua conta para gerenciar seu escritório
          </p>
        </div>

        <div className="bg-card p-8 rounded-2xl shadow-xl border border-border">
          <LoginForm />
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Ainda não tem uma conta?{' '}
          <a href="#" className="font-medium text-primary hover:underline">
            Solicite acesso
          </a>
        </p>
      </div>
    </div>
  );
}
