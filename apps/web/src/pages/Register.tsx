import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';

export default function Register() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register(name || 'Andre Oliveira', email || 'andre@agencia.com.br', password);
    navigate('/dashboard');
  };

  return (
    <div className="w-full max-w-[360px] animate-slideDown">
      <form onSubmit={handleSubmit} className="bg-sv-surface border border-sv-border rounded-sv-lg p-8">
        <h1 className="text-[20px] font-bold text-sv-text mb-1" style={{ letterSpacing: '-0.4px' }}>
          Criar conta gratis
        </h1>
        <p className="text-[13px] text-sv-secondary mb-7">14 dias sem cartao de credito.</p>

        <div className="mb-4">
          <label className="block text-[12px] font-medium text-sv-secondary mb-1.5">Nome completo</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Andre Oliveira"
            className="w-full bg-sv-input border border-sv-border rounded-sv-md py-[9px] px-3 text-sv-text text-[13px] outline-none"
          />
        </div>

        <div className="mb-4">
          <label className="block text-[12px] font-medium text-sv-secondary mb-1.5">E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="w-full bg-sv-input border border-sv-border rounded-sv-md py-[9px] px-3 text-sv-text text-[13px] outline-none"
          />
        </div>

        <div className="mb-6">
          <label className="block text-[12px] font-medium text-sv-secondary mb-1.5">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimo 8 caracteres"
            className="w-full bg-sv-input border border-sv-border rounded-sv-md py-[9px] px-3 text-sv-text text-[13px] outline-none"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-sv-accent text-sv-accent-text font-bold text-[14px] py-[11px] rounded-sv-md border-none"
        >
          Criar conta &rarr;
        </button>
        <p className="text-[11px] text-sv-hint text-center mt-3.5 leading-relaxed">
          Ao criar conta voce aceita os <a href="#" className="text-sv-secondary">Termos de Uso</a> e a{' '}
          <a href="#" className="text-sv-secondary">Privacidade</a>.
        </p>
      </form>
      <p className="text-center text-[13px] text-sv-secondary mt-5">
        Ja tem conta?{' '}
        <Link to="/login" className="text-sv-accent font-medium">
          Entrar
        </Link>
      </p>
    </div>
  );
}
