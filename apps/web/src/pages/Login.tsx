import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';
import api from '../lib/api';

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', { email, password });
      setAuth(data.user, data.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[360px] animate-slideDown">
      <form onSubmit={handleSubmit} className="bg-sv-surface border border-sv-border rounded-sv-lg p-8">
        <h1 className="text-[20px] font-bold text-sv-text mb-1" style={{ letterSpacing: '-0.4px' }}>
          Entrar na sua conta
        </h1>
        <p className="text-[13px] text-sv-secondary mb-7">Bem-vindo de volta.</p>

        {error && (
          <div
            className="mb-4 p-3 rounded-sv-md text-[13px] text-sv-error"
            style={{ background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.2)' }}
          >
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-[12px] font-medium text-sv-secondary mb-1.5">E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
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
            required
            className="w-full bg-sv-input border border-sv-border rounded-sv-md py-[9px] px-3 text-sv-text text-[13px] outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-sv-accent text-sv-accent-text font-bold text-[14px] py-[11px] rounded-sv-md border-none disabled:opacity-60"
        >
          {loading ? 'Entrando...' : 'Entrar →'}
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
