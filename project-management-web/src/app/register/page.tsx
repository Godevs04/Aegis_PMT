import React from 'react';
import RegisterForm from '@/features/auth/components/register-form';

export default function RegisterPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden py-12 px-4 sm:px-6 lg:px-8 bg-zinc-950">
      {/* Premium background glowing effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* Logo */}
        <div className="flex items-center space-x-2 mb-8 select-none">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">
            A
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Aegis</span>
        </div>
        
        <RegisterForm />
      </div>
    </div>
  );
}
export const metadata = {
  title: 'Create Account - Aegis',
};
