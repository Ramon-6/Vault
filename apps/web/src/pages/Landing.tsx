import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LogoIcon, ArrowRightIcon, ChevronDownIcon, ShieldIcon, ClockIcon, BellIcon, CheckIcon } from '../components/ui/Icons';

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const heroCanvasRef = useRef<HTMLCanvasElement>(null);
  const sphereCanvasRef = useRef<HTMLCanvasElement>(null);
  const pixelCanvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Hero canvas
  useEffect(() => {
    const canvas = heroCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = canvas.offsetWidth || window.innerWidth;
    const H = canvas.offsetHeight || window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    let t = 0;
    let mx = 0.5;
    let my = 0.45;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX / window.innerWidth;
      my = e.clientY / window.innerHeight;
    };
    window.addEventListener('mousemove', onMove);

    const COLS = 42;
    const ROWS = 28;

    const loop = () => {
      ctx.clearRect(0, 0, W, H);
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const nx = col / (COLS - 1);
          const ny = row / (ROWS - 1);
          const z3 = ny * 720 + 70;
          const sc = 360 / (360 + z3);
          const x3 = (nx - 0.5) * W * 1.55;
          const waveIn = col * 0.48 + row * 0.34 - t * 1.75 + (nx - mx) * 2.8 + (ny - my) * 2.2;
          const wave = Math.sin(waveIn) * 0.5 + 0.5;
          const sx = W * 0.5 + x3 * sc;
          const sy = H * 0.8 - ny * H * 0.58 + wave * 52 * sc;
          if (sx < -8 || sx > W + 8 || sy < -8 || sy > H + 8) continue;
          const r = Math.max(0.35, 3.0 * sc * (0.2 + wave * 0.8));
          const alpha = Math.min(0.42, 0.03 + sc * 0.28 * (0.08 + wave * 0.92));
          ctx.beginPath();
          ctx.arc(sx, sy, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(12,12,10,${alpha})`;
          ctx.fill();
        }
      }
      t += 0.011;
      framesRef.current.hero = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(framesRef.current.hero);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  // Sphere canvas
  useEffect(() => {
    const canvas = sphereCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = 460;
    const H = 460;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const N = 6;
    const RX = 0.42;
    let ry = 0.3;

    const loop = () => {
      ctx.clearRect(0, 0, W, H);
      const pts: { sx: number; sy: number; s: number; depth: number }[] = [];
      for (let ix = 0; ix < N; ix++) {
        for (let iy = 0; iy < N; iy++) {
          for (let iz = 0; iz < N; iz++) {
            const x = ix - (N - 1) / 2;
            const y = iy - (N - 1) / 2;
            const z = iz - (N - 1) / 2;
            const cosY = Math.cos(ry), sinY = Math.sin(ry);
            const x1 = x * cosY - z * sinY;
            const z1 = x * sinY + z * cosY;
            const cosX = Math.cos(RX), sinX = Math.sin(RX);
            const y1 = y * cosX - z1 * sinX;
            const z2 = y * sinX + z1 * cosX;
            const FOV = 300;
            const s = FOV / (FOV + z2 + N * 1.1);
            const SP = 48;
            pts.push({ sx: W / 2 + x1 * s * SP, sy: H / 2 + y1 * s * SP, s, depth: z2 });
          }
        }
      }
      pts.sort((a, b) => a.depth - b.depth);
      for (const p of pts) {
        const r = p.s * 6.5;
        if (r < 0.5) continue;
        const g = ctx.createRadialGradient(p.sx - r * 0.33, p.sy - r * 0.33, r * 0.04, p.sx, p.sy, r);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.32, 'rgba(210,210,210,0.9)');
        g.addColorStop(0.68, 'rgba(75,75,75,0.85)');
        g.addColorStop(1, 'rgba(6,6,6,0.95)');
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }
      ry += 0.0052;
      framesRef.current.sphere = requestAnimationFrame(loop);
    };
    loop();

    return () => cancelAnimationFrame(framesRef.current.sphere);
  }, []);

  // Pixel canvas
  useEffect(() => {
    const canvas = pixelCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = canvas.offsetWidth || 1200;
    const H = canvas.offsetHeight || 440;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.scale(dpr, dpr);

    const PS = 7;
    const GAP = 1;
    const cols = Math.ceil(W / PS);
    const rows = Math.ceil((H * 0.72) / PS);

    const px: { x: number; baseY: number; a: number; speed: number; phase: number; fall: boolean; delay: number }[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (Math.random() > 0.42) {
          px.push({
            x: Math.round(c * PS),
            baseY: Math.round(r * PS),
            a: 0.28 + Math.random() * 0.45,
            speed: 0.5 + Math.random() * 1.3,
            phase: Math.random() * Math.PI * 2,
            fall: Math.random() > 0.5,
            delay: Math.floor(Math.random() * 320),
          });
        }
      }
    }

    let frame = 0;
    const loop = () => {
      ctx.clearRect(0, 0, W, H);
      for (const p of px) {
        const f = Math.max(0, frame - p.delay);
        let yOff = 0;
        let alpha = p.a;
        if (p.fall && f > 0) {
          yOff = Math.pow(f * 0.014 * p.speed, 1.65);
          alpha = Math.max(0, p.a - f * 0.002);
        } else {
          yOff = Math.sin(f * 0.022 + p.phase) * 2;
          alpha = p.a * (0.6 + Math.sin(f * 0.028 + p.phase) * 0.25);
        }
        if (alpha < 0.02) continue;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#D8D6D0';
        ctx.fillRect(p.x, Math.round(p.baseY + yOff), PS - GAP, PS - GAP);
      }
      ctx.globalAlpha = 1;
      frame++;
      framesRef.current.pixel = requestAnimationFrame(loop);
    };
    loop();

    return () => cancelAnimationFrame(framesRef.current.pixel);
  }, []);

  return (
    <div className="bg-sv-page text-sv-text font-body text-[15px] leading-relaxed overflow-x-hidden" style={{ WebkitFontSmoothing: 'antialiased' }}>
      {/* NAV */}
      <nav
        className="fixed top-0 left-0 right-0 z-[100] px-10 py-[15px] flex items-center justify-between transition-all duration-400"
        style={{
          background: scrolled ? 'rgba(244,243,239,0.9)' : 'transparent',
          backdropFilter: scrolled ? 'blur(18px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(18px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(0,0,0,0.07)' : 'none',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-[30px] h-[30px] bg-sv-accent rounded-[7px] flex items-center justify-center flex-shrink-0 text-sv-accent-text">
            <LogoIcon size={16} />
          </div>
          <span className="font-display text-[17px] font-bold" style={{ letterSpacing: '-0.5px' }}>
            snapvault
          </span>
        </div>
        <div className="flex items-center gap-7">
          <a href="#features" className="text-[14px] text-sv-secondary font-medium hover:text-sv-text transition-colors">
            Como funciona
          </a>
          <a href="#pricing" className="text-[14px] text-sv-secondary font-medium hover:text-sv-text transition-colors">
            Precos
          </a>
          <a href="#" className="text-[14px] text-sv-secondary font-medium hover:text-sv-text transition-colors">
            Docs
          </a>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-[14px] text-sv-secondary font-medium hover:text-sv-text transition-colors">
            Entrar
          </Link>
          <Link
            to="/register"
            className="text-[14px] font-semibold py-[9px] px-5 rounded-sv-md hover:bg-[#1E1E1B] transition-colors"
            style={{ background: '#0C0C0A', color: '#F4F3EF' }}
          >
            Comecar gratis
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="min-h-screen relative overflow-hidden bg-sv-page flex items-center justify-center">
        <canvas ref={heroCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
        <div className="relative z-[2] text-center max-w-[840px] px-10 pt-[100px] pb-[60px]">
          <div
            className="inline-flex items-center gap-2 text-[12px] font-medium font-mono py-1.5 px-4 rounded-full mb-9"
            style={{ background: '#0C0C0A', color: '#B8F241' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sv-accent inline-block animate-pulse" />
            Rodando 24/7 — backups em andamento
          </div>

          <h1
            className="font-display font-extrabold leading-[1.0] text-sv-text mb-7"
            style={{ fontSize: 'clamp(54px, 7.5vw, 96px)', letterSpacing: '-3px' }}
          >
            Backup automatico
            <br />
            para bancos
            <br className="hidden" /> de dados.
          </h1>

          <p className="text-[18px] text-sv-secondary leading-[1.7] max-w-[500px] mx-auto mb-11">
            MySQL e PostgreSQL. Criptografado ponta a ponta. Alertas em tempo real. Configura em 3 minutos.
          </p>

          <div className="flex items-center justify-center gap-3.5 flex-wrap mb-[22px]">
            <Link
              to="/register"
              className="bg-sv-accent text-sv-accent-text text-[15px] font-bold py-3.5 px-[30px] rounded-[10px] inline-flex items-center gap-2 hover:opacity-85 transition-opacity"
            >
              Testar 14 dias gratis
              <ArrowRightIcon />
            </Link>
            <a
              href="#como-funciona"
              className="text-[15px] text-sv-secondary font-medium py-3.5 px-5 inline-flex items-center gap-1.5 hover:text-sv-text transition-colors"
            >
              Ver como funciona
              <ChevronDownIcon />
            </a>
          </div>

          <p className="font-mono text-[12px] text-sv-hint">
            // sem cartao &middot; cancela quando quiser &middot; configura em 3 min
          </p>
        </div>

        <div className="absolute bottom-[34px] left-1/2 flex flex-col items-center gap-[5px] animate-bounce">
          <span className="text-[10px] text-[#C4C2BD] uppercase font-medium" style={{ letterSpacing: '0.1em' }}>
            scroll
          </span>
          <ChevronDownIcon />
        </div>
      </section>

      {/* STATS BAR */}
      <div style={{ background: '#0D0D0B', borderBottom: '1px solid #1A1A17' }}>
        <div className="max-w-[1100px] mx-auto grid grid-cols-4 px-10">
          {[
            { value: '99.8%', label: 'backups bem-sucedidos', font: 'font-display', size: '46px' },
            { value: 'AES-256', label: 'criptografia de ponta a ponta', font: 'font-mono', size: '36px' },
            { value: '<2min', label: 'tempo medio de backup', font: 'font-display', size: '46px' },
            { value: '24/7', label: 'monitoramento ativo', font: 'font-display', size: '46px', lime: true },
          ].map((stat, i) => (
            <div
              key={stat.value}
              className="text-center py-11 px-5"
              style={{ borderRight: i < 3 ? '1px solid #1A1A17' : 'none' }}
            >
              <div
                className={`${stat.font} font-extrabold leading-none`}
                style={{
                  fontSize: stat.size,
                  color: stat.lime ? '#B8F241' : '#E8E6E1',
                  letterSpacing: stat.font === 'font-mono' ? '-1px' : '-2px',
                  fontWeight: stat.font === 'font-mono' ? 500 : 800,
                }}
              >
                {stat.value}
              </div>
              <div className="text-[13px] font-medium mt-[7px]" style={{ color: '#7A7A74' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section id="features" style={{ background: '#FDFCF9', padding: '108px 0' }}>
        <div className="max-w-[1100px] mx-auto px-10">
          <div className="flex items-center gap-2.5 mb-[18px]">
            <div className="w-1.5 h-1.5 rounded-full bg-sv-accent" />
            <span className="font-mono text-[11px] font-medium text-sv-hint uppercase" style={{ letterSpacing: '0.12em' }}>
              Por que Snapvault
            </span>
          </div>
          <h2
            className="font-display font-extrabold text-sv-text leading-[1.06] max-w-[560px] mb-[68px]"
            style={{ fontSize: 'clamp(38px, 4.5vw, 56px)', letterSpacing: '-1.8px' }}
          >
            Backup que funciona
            <br />
            enquanto voce dorme.
          </h2>

          <div className="grid grid-cols-3 gap-[2px] rounded-[18px] overflow-hidden" style={{ background: '#E6E4DE' }}>
            {[
              {
                icon: <ShieldIcon />,
                title: 'Seguro por padrao',
                desc: 'Criptografia AES-256-GCM antes do arquivo sair do servidor. Credenciais armazenadas cifradas, nunca em texto puro.',
              },
              {
                icon: <ClockIcon />,
                title: 'Configure uma vez',
                desc: 'Um comando no servidor do cliente. Backup automatico todo dia de madrugada. Voce nao precisa lembrar de nada.',
              },
              {
                icon: <BellIcon />,
                title: 'Alertas imediatos',
                desc: 'Falhou? Voce sabe antes do cliente perceber. E-mail ou WhatsApp em minutos, com o motivo exato.',
              },
            ].map((feat) => (
              <div key={feat.title} style={{ background: '#FDFCF9', padding: '44px 38px' }}>
                <div className="w-[46px] h-[46px] bg-sv-text rounded-sv-lg flex items-center justify-center mb-7">
                  {feat.icon}
                </div>
                <h3
                  className="font-display text-[21px] font-bold text-sv-text mb-3"
                  style={{ letterSpacing: '-0.4px' }}
                >
                  {feat.title}
                </h3>
                <p className="text-[14px] text-sv-secondary leading-[1.7]">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECURITY + SPHERE */}
      <section style={{ background: '#0D0D0B', padding: '108px 0', overflow: 'hidden' }}>
        <div className="max-w-[1100px] mx-auto px-10 flex items-center gap-[72px]">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-[18px]">
              <div className="w-1.5 h-1.5 rounded-full bg-sv-accent" />
              <span className="font-mono text-[11px] font-medium uppercase" style={{ color: '#7A7A74', letterSpacing: '0.12em' }}>
                Seguranca
              </span>
            </div>
            <h2
              className="font-display font-extrabold leading-[1.08] mb-6"
              style={{ fontSize: 'clamp(32px, 3.8vw, 48px)', color: '#E8E6E1', letterSpacing: '-1.4px' }}
            >
              Seus dados nunca
              <br />
              viajam em texto puro.
            </h2>
            <p className="text-[15px] leading-[1.8] mb-[38px] max-w-[420px]" style={{ color: '#9A9A94' }}>
              Cada backup e criptografado com AES-256-GCM antes de deixar o servidor. Chave armazenada
              separadamente, cifrada com a master key do sistema.
            </p>
            <div className="flex flex-col gap-[13px]">
              {[
                'Credenciais cifradas no banco de dados',
                'Arquivo cifrado antes do upload para Backblaze B2',
                'Checksum SHA-256 — integridade verificada',
                'URLs assinadas de 15min para download',
              ].map((item) => (
                <div key={item} className="flex items-center gap-[13px]">
                  <div
                    className="w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(184,242,65,0.1)', border: '1px solid rgba(184,242,65,0.2)' }}
                  >
                    <CheckIcon />
                  </div>
                  <span className="text-[14px]" style={{ color: '#9E9D97' }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-shrink-0" style={{ width: 460, height: 460 }}>
            <canvas ref={sphereCanvasRef} style={{ width: 460, height: 460, display: 'block' }} />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="como-funciona" className="bg-sv-page" style={{ padding: '108px 0' }}>
        <div className="max-w-[1100px] mx-auto px-10">
          <div className="flex items-center gap-2.5 mb-[18px]">
            <div className="w-1.5 h-1.5 rounded-full bg-sv-accent" />
            <span className="font-mono text-[11px] font-medium text-sv-hint uppercase" style={{ letterSpacing: '0.12em' }}>
              Como funciona
            </span>
          </div>
          <h2
            className="font-display font-extrabold text-sv-text leading-[1.06] mb-[72px]"
            style={{ fontSize: 'clamp(38px, 4.5vw, 56px)', letterSpacing: '-1.8px' }}
          >
            Tres passos.
            <br />
            Zero preocupacao.
          </h2>

          <div className="grid grid-cols-3 gap-[52px]">
            {[
              {
                n: '1',
                bg: '#B8F241',
                color: '#0A0E00',
                title: 'Adicione seu banco',
                desc: 'Informe host, usuario e senha no painel. Testamos a conexao antes de salvar qualquer dado.',
                showLine: true,
              },
              {
                n: '2',
                bg: '#0C0C0A',
                color: '#F4F3EF',
                title: 'Instale o agente',
                desc: 'Um comando npm no servidor do cliente. O agente configura o backup diario e envia confirmacao.',
                showLine: true,
              },
              {
                n: '3',
                bg: '#0C0C0A',
                color: '#F4F3EF',
                title: 'Relaxe',
                desc: 'Backup todo dia as 2h. Se falhar, alerta imediato. Se precisar restaurar, download em 1 clique.',
                showLine: false,
              },
            ].map((step) => (
              <div key={step.n}>
                <div className="flex items-center gap-0 mb-7">
                  <div
                    className="w-[52px] h-[52px] rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: step.bg }}
                  >
                    <span className="font-display text-[22px] font-extrabold" style={{ color: step.color }}>
                      {step.n}
                    </span>
                  </div>
                  {step.showLine && (
                    <div
                      className="h-px flex-1 ml-4"
                      style={{ background: 'linear-gradient(to right, #C8C6C0, transparent)' }}
                    />
                  )}
                </div>
                <h3 className="font-display text-[22px] font-bold text-sv-text mb-3" style={{ letterSpacing: '-0.4px' }}>
                  {step.title}
                </h3>
                <p className="text-[14px] text-sv-secondary leading-[1.7]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TERMINAL */}
      <section style={{ background: '#0D0D0B', padding: '88px 0' }}>
        <div className="max-w-[780px] mx-auto px-10">
          <div className="text-center mb-11">
            <div className="font-mono text-[11px] uppercase mb-3.5" style={{ color: '#7A7A74', letterSpacing: '0.12em' }}>
              Instalacao
            </div>
            <h2 className="font-display text-[34px] font-extrabold" style={{ color: '#E8E6E1', letterSpacing: '-1px' }}>
              Um comando. Pronto.
            </h2>
          </div>
          <div className="rounded-[14px] overflow-hidden" style={{ background: '#070706', border: '1px solid #1A1A17' }}>
            <div
              className="px-5 py-[13px] flex items-center justify-between"
              style={{ borderBottom: '1px solid #1A1A17' }}
            >
              <div className="flex gap-[7px]">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF5F56' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FFBD2E' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#27C93F' }} />
              </div>
              <span className="font-mono text-[11px]" style={{ color: '#7A7A74' }}>
                bash — servidor-do-cliente
              </span>
            </div>
            <div className="px-[30px] py-[26px] font-mono text-[13.5px]" style={{ lineHeight: 2 }}>
              <div style={{ color: '#5E5E58' }}># instala o agente no servidor</div>
              <div>
                <span style={{ color: '#B8F241' }}>$</span>{' '}
                <span style={{ color: '#E8E6E1' }}>npm install -g @snapvault/agent</span>
              </div>
              <div className="mt-2" style={{ color: '#5E5E58' }}>
                # conecta com o token da conta
              </div>
              <div>
                <span style={{ color: '#B8F241' }}>$</span>{' '}
                <span style={{ color: '#E8E6E1' }}>snapvault init --token sv_live_xk9mPq3...</span>
              </div>
              <div className="mt-2.5" style={{ color: '#8A8A84' }}>
                {'  '}Testando conexao com o banco...{'  '} <span style={{ color: '#B8F241' }}>&#10003;</span>
              </div>
              <div style={{ color: '#8A8A84' }}>
                {'  '}Agendando backup para 02:00...{'   '} <span style={{ color: '#B8F241' }}>&#10003;</span>
              </div>
              <div style={{ color: '#8A8A84' }}>
                {'  '}Executando backup inicial...{'     '} <span style={{ color: '#B8F241' }}>&#10003;</span>
              </div>
              <div className="mt-2" style={{ color: '#B8F241' }}>
                &#10003; Snapvault ativo. Proximo backup em 23h 47min.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ background: '#FDFCF9', padding: '108px 0' }}>
        <div className="max-w-[1100px] mx-auto px-10">
          <div className="flex items-center gap-2.5 mb-[18px]">
            <div className="w-1.5 h-1.5 rounded-full bg-sv-accent" />
            <span className="font-mono text-[11px] font-medium text-sv-hint uppercase" style={{ letterSpacing: '0.12em' }}>
              Precos
            </span>
          </div>
          <h2
            className="font-display font-extrabold text-sv-text leading-[1.06] mb-3.5"
            style={{ fontSize: 'clamp(38px, 4.5vw, 56px)', letterSpacing: '-1.8px' }}
          >
            Sem surpresa no boleto.
          </h2>
          <p className="text-[15px] text-sv-secondary mb-[60px]">Cancela quando quiser. Sem multa, sem fidelidade.</p>

          <div className="grid grid-cols-3 gap-4">
            {/* Starter */}
            <div className="rounded-[18px] p-9" style={{ background: '#F4F3EF', border: '1px solid #E6E4DE' }}>
              <div className="font-mono text-[11px] font-semibold text-sv-hint uppercase mb-[18px]" style={{ letterSpacing: '0.12em' }}>
                Starter
              </div>
              <div className="font-display text-[48px] font-extrabold text-sv-text leading-none mb-1.5" style={{ letterSpacing: '-2px' }}>
                R$29
                <span className="text-[16px] font-medium text-sv-hint" style={{ letterSpacing: 0 }}>
                  /mes
                </span>
              </div>
              <div className="text-[13px] text-sv-hint mb-7">Para comecar</div>
              <div className="h-px mb-6" style={{ background: '#E6E4DE' }} />
              <div className="flex flex-col gap-[11px] mb-9">
                {['1 banco de dados', 'Backup diario', 'Retencao 7 dias', 'Alertas por e-mail'].map((f) => (
                  <div key={f} className="flex gap-[11px] items-center">
                    <span className="text-sv-accent text-[15px] leading-none">&#10003;</span>
                    <span className="text-[14px] text-sv-text">{f}</span>
                  </div>
                ))}
                <div className="flex gap-[11px] items-center opacity-[0.35]">
                  <span className="text-[15px] leading-none">&#10007;</span>
                  <span className="text-[14px] text-sv-text">WhatsApp</span>
                </div>
              </div>
              <Link
                to="/register"
                className="block text-center text-[14px] font-semibold py-[13px] rounded-[10px] hover:bg-[#1E1E1B] transition-colors"
                style={{ background: '#0C0C0A', color: '#F4F3EF' }}
              >
                Comecar gratis
              </Link>
            </div>

            {/* Pro */}
            <div
              className="rounded-[18px] p-9 relative"
              style={{ background: '#0C0C0A', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}
            >
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 font-mono text-[10px] font-bold py-1 px-3.5 rounded-b-[10px] whitespace-nowrap"
                style={{ background: '#B8F241', color: '#0A0E00', letterSpacing: '0.07em' }}
              >
                MAIS USADO
              </div>
              <div className="font-mono text-[11px] font-semibold uppercase mb-[18px] mt-3" style={{ color: '#7A7A74', letterSpacing: '0.12em' }}>
                Pro
              </div>
              <div className="font-display text-[48px] font-extrabold leading-none mb-1.5" style={{ color: '#E8E6E1', letterSpacing: '-2px' }}>
                R$79
                <span className="text-[16px] font-medium" style={{ color: '#8A8A84', letterSpacing: 0 }}>
                  /mes
                </span>
              </div>
              <div className="text-[13px] mb-7" style={{ color: '#7A7A74' }}>
                Para agencias e freelancers
              </div>
              <div className="h-px mb-6" style={{ background: '#1A1A17' }} />
              <div className="flex flex-col gap-[11px] mb-9">
                {['5 bancos de dados', 'Backup diario', 'Retencao 30 dias', 'E-mail + WhatsApp', 'Painel completo'].map((f) => (
                  <div key={f} className="flex gap-[11px] items-center">
                    <span className="text-sv-accent text-[15px] leading-none">&#10003;</span>
                    <span className="text-[14px]" style={{ color: '#E8E6E1' }}>
                      {f}
                    </span>
                  </div>
                ))}
              </div>
              <Link
                to="/register"
                className="block text-center text-sv-accent-text text-[14px] font-bold py-[13px] rounded-[10px] hover:opacity-85 transition-opacity"
                style={{ background: '#B8F241' }}
              >
                Comecar gratis &rarr;
              </Link>
            </div>

            {/* Business */}
            <div className="rounded-[18px] p-9" style={{ background: '#F4F3EF', border: '1px solid #E6E4DE' }}>
              <div className="font-mono text-[11px] font-semibold text-sv-hint uppercase mb-[18px]" style={{ letterSpacing: '0.12em' }}>
                Business
              </div>
              <div className="font-display text-[48px] font-extrabold text-sv-text leading-none mb-1.5" style={{ letterSpacing: '-2px' }}>
                R$199
                <span className="text-[16px] font-medium text-sv-hint" style={{ letterSpacing: 0 }}>
                  /mes
                </span>
              </div>
              <div className="text-[13px] text-sv-hint mb-7">Para times e empresas</div>
              <div className="h-px mb-6" style={{ background: '#E6E4DE' }} />
              <div className="flex flex-col gap-[11px] mb-9">
                {['Bancos ilimitados', 'Backup a cada 6h', 'Retencao 90 dias', 'E-mail + WhatsApp', 'Suporte prioritario'].map((f) => (
                  <div key={f} className="flex gap-[11px] items-center">
                    <span className="text-sv-accent text-[15px] leading-none">&#10003;</span>
                    <span className="text-[14px] text-sv-text">{f}</span>
                  </div>
                ))}
              </div>
              <a
                href="#"
                className="block text-center text-[14px] font-semibold py-[13px] rounded-[10px] hover:bg-[#1E1E1B] transition-colors"
                style={{ background: '#0C0C0A', color: '#F4F3EF' }}
              >
                Falar com a gente
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA + PIXEL CANVAS */}
      <section className="relative overflow-hidden flex items-center justify-center" style={{ background: '#0D0D0B', minHeight: 440 }}>
        <canvas ref={pixelCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
        <div className="relative z-[2] text-center max-w-[640px] px-10 py-[88px]">
          <h2
            className="font-display font-extrabold leading-[1.05] mb-5"
            style={{ fontSize: 'clamp(38px, 5.5vw, 62px)', color: '#B8F241', letterSpacing: '-2px' }}
          >
            Seus dados merecem
            <br />
            um backup de verdade.
          </h2>
          <p className="text-[16px] leading-[1.7] mb-11" style={{ color: '#B8F241' }}>
            Comece agora. Configura em 3 minutos. Se perder dados, a culpa nunca e falta de backup.
          </p>
          <div className="flex items-center justify-center gap-3.5 flex-wrap">
            <Link
              to="/register"
              className="bg-sv-accent text-sv-accent-text text-[15px] font-bold py-3.5 px-8 rounded-[10px] hover:opacity-85 transition-opacity"
            >
              Comecar 14 dias gratis &rarr;
            </Link>
            <a href="#" className="text-[15px] font-medium py-3.5 px-5 hover:text-[#E8E6E1] transition-colors" style={{ color: '#ffffff' }}>
              Falar com a gente
            </a>
          </div>
          <p className="font-mono text-[12px] mt-[22px]" style={{ color: '#fdfdfd' }}>
            // sem cartao de credito &middot; cancela quando quiser
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#0D0D0B', borderTop: '1px solid #1A1A17', padding: '36px 0' }}>
        <div className="max-w-[1100px] mx-auto px-10 flex items-center justify-between">
          <div className="flex items-center gap-[9px]">
            <div className="w-6 h-6 bg-sv-accent rounded-[5px] flex items-center justify-center">
              <LogoIcon size={13} />
            </div>
            <span className="font-display text-[15px] font-bold" style={{ color: '#5E5E58', letterSpacing: '-0.3px' }}>
              snapvault
            </span>
          </div>
          <span className="text-[13px]" style={{ color: '#555550' }}>
            &copy; 2026 Snapvault. Feito no Brasil.
          </span>
          <div className="flex gap-[22px]">
            {['Privacidade', 'Termos', 'Status', 'Contato'].map((link) => (
              <a key={link} href="#" className="text-[13px] hover:text-[#6B6B66] transition-colors" style={{ color: '#555550' }}>
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
