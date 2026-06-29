import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('andre@agencia.com.br');
  const [password, setPassword] = useState('senha1234');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password);
    navigate('/dashboard');
  };

  return (
    <div className="w-full max-w-[360px] animate-slideDown">
      <form onSubmit={handleSubmit} className="bg-sv-surface border border-sv-border rounded-sv-lg p-8">
        <h1 className="text-[20px] font-bold text-sv-text mb-1" style={{ letterSpacing: '-0.4px' }}>
          Entrar na sua conta
        </h1>
        <p className="text-[13px] text-sv-secondary mb-7">Bem-vindo de volta.</p>

        <div className="mb-4">
          <label className="block text-[12px] font-medium text-sv-secondary mb-1.5">E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-sv-input border border-sv-border rounded-sv-md py-[9px] px-3 text-sv-text text-[13px] outline-none"
          />
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[12px] font-medium text-sv-secondary">Senha</label>
            <a href="#" className="text-[12px] text-sv-info">Esqueci a senha</a>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-sv-input border border-sv-border rounded-sv-md py-[9px] px-3 text-sv-text text-[13px] outline-none"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-sv-accent text-sv-accent-text font-bold text-[14px] py-[11px] rounded-sv-md border-none"
        >
          Entrar &rarr;
        </button>
      </form>
      <p className="text-center text-[13px] text-sv-secondary mt-5">
        Ainda nao tem conta?{' '}
        <Link to="/register" className="text-sv-accent font-medium">
          Criar conta gratis
        </Link>
      </p>
    </div>
  );
}
