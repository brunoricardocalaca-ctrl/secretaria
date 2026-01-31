import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  User,
  Settings,
  Sparkles,
  ShieldCheck,
  BrainCircuit,
  AlertTriangle,
  ChevronDown,
  Quote,
  CalendarCheck,
  MessageSquare
} from "lucide-react";
import Image from "next/image";
import AuthRedirectHandler from "./auth-redirect-handler";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white overflow-x-hidden font-sans selection:bg-purple-500/30">
      <AuthRedirectHandler />

      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 transition-all duration-300">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-2xl tracking-tighter">
            <span className="text-white">NEXUS</span>
            <span className="text-amber-500 font-light translate-y-[-1px] text-xl">|</span>
            <span className="text-amber-500 font-medium text-lg uppercase tracking-widest ml-1">secretar.ia</span>
          </div>
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-white/60">
              <a href="#features" className="hover:text-white transition-colors">Funcionalidades</a>
              <a href="#demo" className="hover:text-white transition-colors">Como Funciona</a>
              <a href="#testimonials" className="hover:text-white transition-colors">Depoimentos</a>
            </nav>
            <Link
              href="/login"
              className="text-sm font-medium px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all border border-white/5"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-4 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] -z-10" />

        <div className="container mx-auto text-center max-w-5xl relative z-10">
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-xl md:text-2xl font-medium text-purple-200 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/5 border border-purple-500/10">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
              </span>
              A melhor atendente de WhatsApp que sua clínica pode ter.
            </h2>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            <span className="text-white">NEXUS</span> <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-500 to-amber-200 animate-gradient font-bold uppercase tracking-[0.2em] text-4xl md:text-5xl lg:text-6xl block mt-4">
              secretar.ia
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/60 mb-10 max-w-3xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
            A <strong>Nexus | Secretar.ia</strong> não concorre com chatbot ou IA genérica. <br className="hidden md:block" />
            Ela opera em um nível acima: <strong>atendimento clínico de precisão, em tempo real, 24/7.</strong>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
            <CtaButton text="Teste a secretar.ia agora" size="lg" />
            <Link href="#demo" className="px-8 py-3 rounded-full border border-white/10 text-white/70 hover:bg-white/5 transition-colors text-sm font-medium">
              Ver demonstração
            </Link>
          </div>

          {/* Integration Strip */}
          <div className="mt-20 pt-10 border-t border-white/5 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
            <p className="text-sm text-white/30 uppercase tracking-widest mb-6">Integração Nativa Com</p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
              {/* Simple Text Logos for Context if Images are tricky, but using icons for now */}
              <div className="flex items-center gap-2 text-lg font-semibold"><MessageSquare className="w-6 h-6" /> WhatsApp</div>
              <div className="flex items-center gap-2 text-lg font-semibold"><CalendarCheck className="w-6 h-6" /> Google Calendar</div>
              <div className="flex items-center gap-2 text-lg font-semibold"><BrainCircuit className="w-6 h-6" /> OpenAI GPT-4</div>
            </div>
          </div>
        </div>
      </section>

      {/* THE TRUTH / PROBLEM SECTION */}
      <section className="py-24 bg-neutral-950 border-y border-white/5 relative" id="features">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-soft-light"></div>
        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Vamos falar a verdade que ninguém fala</h2>
            <p className="text-white/50 text-lg">Onde o atendimento humano falha e a IA genérica não alcança.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12 text-left">

            {/* O que humanos não conseguem */}
            <div className="p-8 rounded-3xl bg-[#0A0A0A] border border-white/5 hover:border-red-500/20 transition-all duration-300 group">
              <div className="flex items-center gap-3 mb-6 opacity-70 group-hover:opacity-100 transition-opacity">
                <div className="p-2 bg-red-500/10 rounded-lg"><User className="w-6 h-6 text-red-400" /></div>
                <h3 className="text-xl font-semibold text-red-100">Limitações Humanas</h3>
              </div>
              <ul className="space-y-4">
                <ComparisonItem icon="x" text="Responder todos os leads em < 30 segundos" color="red" />
                <ComparisonItem icon="x" text="Manter padrão comercial perfeito em 100% das conversas" color="red" />
                <ComparisonItem icon="x" text="Nunca esquecer regras, preços e exceções" color="red" />
                <ComparisonItem icon="x" text="Atender 24h sem custos trabalhistas extras" color="red" />
              </ul>
            </div>

            {/* O que IA genérica não consegue */}
            <div className="p-8 rounded-3xl bg-[#0A0A0A] border border-white/5 hover:border-yellow-500/20 transition-all duration-300 group">
              <div className="flex items-center gap-3 mb-6 opacity-70 group-hover:opacity-100 transition-opacity">
                <div className="p-2 bg-yellow-500/10 rounded-lg"><BrainCircuit className="w-6 h-6 text-yellow-400" /></div>
                <h3 className="text-xl font-semibold text-yellow-100">Limitações de IA Genérica</h3>
              </div>
              <ul className="space-y-4">
                <ComparisonItem icon="x" text="Entender a lógica comercial complexa de clínicas" color="yellow" />
                <ComparisonItem icon="x" text="Saber strategicamente quando passar (ou não) o preço" color="yellow" />
                <ComparisonItem icon="x" text="Conduzir para avaliação sem parecer 'empurrão'" color="yellow" />
                <ComparisonItem icon="x" text="Trabalhar com regras reais cheias de exceções" color="yellow" />
              </ul>
            </div>
          </div>

          <div className="mt-16 text-center max-w-4xl mx-auto p-8 rounded-2xl bg-gradient-to-r from-amber-900/10 via-amber-900/5 to-amber-900/10 border border-amber-500/20 backdrop-blur-sm">
            <p className="text-xl md:text-2xl text-amber-100 leading-relaxed font-light">
              "A <strong>Nexus | Secretar.ia</strong> elimina as limitações do humano e as fraquezas da IA genérica, entregando um nível de atendimento que nenhum dos dois alcança."
            </p>
          </div>
        </div>
      </section>

      {/* CONTEXT & INTELLIGENCE */}
      <section className="py-32 relative overflow-hidden bg-[#050505]">
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] -z-10" />

        <div className="container mx-auto px-4 max-w-6xl grid md:grid-cols-2 gap-16 items-center">
          <div className="order-2 md:order-1 relative">
            {/* Chat Simulation */}
            <div className="relative z-10 bg-[#0F0F0F] border border-white/10 rounded-3xl overflow-hidden shadow-2xl transform md:rotate-1 hover:rotate-0 transition-transform duration-500">
              {/* Header */}
              <div className="bg-[#1a1a1a] p-4 flex items-center gap-3 border-b border-white/5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-purple-500/20">
                  IA
                </div>
                <div>
                  <div className="text-sm font-bold text-white tracking-tighter">NEXUS | <span className="text-amber-500 font-medium">SECRETAR.IA</span></div>
                  <div className="text-xs text-green-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                    Online agora
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6 bg-[#0F0F0F] h-[400px] overflow-y-auto custom-scrollbar">

                {/* Message 1: Lead */}
                <div className="flex justify-end">
                  <div className="bg-[#1F1F1F] text-white/90 px-5 py-3 rounded-2xl rounded-tr-sm text-sm max-w-[85%] leading-relaxed">
                    Qual o valor do botox?
                  </div>
                </div>

                {/* AI Thinking Indicator */}
                <div className="flex gap-2 items-center text-xs text-purple-400 font-medium opacity-80 pl-2">
                  <Sparkles className="w-3 h-3" />
                  <span>Analisando regras de preço e histórico...</span>
                </div>

                {/* Message 2: AI */}
                <div className="flex justify-start">
                  <div className="bg-purple-600/10 text-purple-100 border border-purple-500/20 px-5 py-4 rounded-2xl rounded-tl-sm text-sm max-w-[90%] shadow-[0_4px_20px_rgba(147,51,234,0.1)] leading-relaxed">
                    <p>O valor depende da área, Maria. ✨</p>
                    <p className="mt-2">Mas aqui na clínica usamos o <strong className="text-white font-medium">Dysport</strong>, que tem uma durabilidade bem maior que os comuns.</p>
                    <p className="mt-2 text-white/80 border-t border-purple-500/20 pt-2 mt-2">Você já fez alguma vez ou seria a primeira?</p>
                  </div>
                </div>

                {/* Message 3: Lead (Added for depth) */}
                <div className="flex justify-end animate-in fade-in fill-mode-forwards slide-in-from-bottom-2 duration-700 delay-1000">
                  <div className="bg-[#1F1F1F] text-white/90 px-5 py-3 rounded-2xl rounded-tr-sm text-sm max-w-[85%] leading-relaxed">
                    Seria a primeira vez, tenho medo de ficar artificial...
                  </div>
                </div>

              </div>

              {/* Footer Input */}
              <div className="p-4 bg-[#1a1a1a] border-t border-white/5">
                <div className="h-12 rounded-full bg-white/5 border border-white/5 w-full flex items-center px-4 text-white/30 text-sm">
                  Digite uma mensagem...
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl -z-10 animate-pulse" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl -z-10" />
          </div>

          <div className="order-1 md:order-2">
            <h2 className="text-sm font-bold text-purple-400 tracking-widest uppercase mb-4">Inteligência Real</h2>
            <h3 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Isso não é atendimento automático. <br />
              <span className="text-white/40">É atendimento superior.</span>
            </h3>
            <p className="text-white/60 text-lg mb-8 leading-relaxed">
              A secretar.ia não responde mensagens. <strong>Ela pensa antes de responder.</strong> Enquanto humanos seguem script, a secretar.ia segue o contexto.
            </p>

            <div className="space-y-6">
              <IntelligenceItem title="Entende o não-dito" text="Lê nas entrelinhas o que o lead quer saber, mas não perguntou." />
              <IntelligenceItem title="Análise Emocional" text="Identifica o estágio de compra e a objeção escondida." />
              <IntelligenceItem title="Contexto Infinito" text="Lembra de tudo que já foi dito, adaptando a resposta sob medida." />
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS (SOCIAL PROOF) - NEW SECTION */}
      <section className="py-24 bg-neutral-950 border-y border-white/5" id="testimonials">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Resultados Clínicos Reais</h2>
            <p className="text-white/50">Você não precisa acreditar na gente. Acredite nos números.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard
              quote="Antes perdíamos muitos leads fora do horário. Hoje acordo com a agenda cheia."
              author="Dra. Camilla Rocha"
              role="Dermatologista"
              metric="+32% Agendamentos"
            />
            <TestimonialCard
              quote="A qualificação é perfeita. O lead já chega na cadeira sabendo o preço e querendo fazer."
              author="Dr. Lucas Ferraz"
              role="Cirurgião Plástico"
              metric="Tempo de reposta < 10s"
            />
            <TestimonialCard
              quote="Achei que seria robótico, mas os pacientes elogiam a educação da 'Julia' (nossa IA)."
              author="Mariana Sales"
              role="Gestora de Clínica"
              metric="Zero reclamações"
            />
          </div>
        </div>
      </section>

      {/* IMPLEMENTATION / CONFIG VISUALIZATION */}
      <section className="py-32 relative bg-[#050505]" id="demo">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-20 text-center md:text-left">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Implementação simples. <br />
              <span className="text-white/40">Sofisticação absurda.</span>
            </h2>
            <p className="text-white/60 text-lg max-w-2xl">
              Esqueça árvores de decisão complexas. Você só precisa dizer quem você é e o que você vende.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-start">

            {/* CONFIG STEP 1 */}
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center font-bold text-purple-400 border border-purple-500/20 shrink-0">1</div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Dados da Clínica</h3>
                  <p className="text-white/50">Configure a personalidade e as informações básicas em segundos.</p>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0F0F0F] overflow-hidden shadow-2xl hover:border-purple-500/30 transition-colors">
                <div className="h-8 bg-white/5 border-b border-white/5 flex items-center px-4 gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/20" />
                  <div className="ml-auto text-[10px] text-white/20">Configurações Gerais</div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Nome da Atendente</label>
                    <div className="h-10 rounded bg-white/5 border border-white/10 flex items-center px-3 text-sm text-white/80">Julia</div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Sobre a Clínica</label>
                    <div className="h-24 rounded bg-white/5 border border-white/10 p-3 text-sm text-white/80 leading-relaxed">
                      Somos referência em harmonização facial no Jardins. Focamos em resultados naturais e atendimento exclusivo...
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CONFIG STEP 2 */}
            <div className="space-y-8 relative lg:mt-20">
              <div className="hidden lg:block absolute -top-20 left-5 h-20 w-px border-l border-dashed border-white/10" />

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center font-bold text-purple-400 border border-purple-500/20 shrink-0">2</div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Serviços e Regras</h3>
                  <p className="text-white/50">Defina como cada serviço deve ser vendido.</p>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0F0F0F] overflow-hidden shadow-2xl hover:border-purple-500/30 transition-colors">
                <div className="h-8 bg-white/5 border-b border-white/5 flex items-center px-4 gap-2">
                  <div className="ml-auto text-[10px] text-white/20">Novo Serviço</div>
                </div>
                <div className="p-6 space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Nome do Serviço</label>
                    <div className="h-10 rounded bg-white/5 border border-white/10 flex items-center px-3 text-sm text-white/80">Protocolo Glow Up</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Preço Visível?</label>
                      <div className="h-10 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center px-3 gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm text-emerald-300">Sim, mostrar</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Avaliação?</label>
                      <div className="h-10 rounded bg-white/5 border border-white/10 flex items-center px-3 text-sm text-white/50">Opcional</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Regra de Venda (Prompt)</label>
                    <div className="rounded bg-white/5 border border-white/10 p-3 text-sm text-white/60 italic leading-relaxed">
                      "Focar na durabilidade do tratamento e mencionar que inclui retorno de 15 dias para retoque se necessário."
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ SECTION - NEW SECTION */}
      <section className="py-24 bg-neutral-950 border-t border-white/5">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold mb-12 text-center">Dúvidas Frequentes</h2>

          <div className="space-y-4">
            <FaqItem
              question="Ela se integra com meu sistema de agenda?"
              answer="Sim, a secretar.ia se conecta com Google Calendar e principais sistemas de gestão para verificar disponibilidade e agendar automaticamente."
            />
            <FaqItem
              question="E se o cliente perguntar algo que ela não sabe?"
              answer="Quando a IA detecta uma pergunta fora da sua base de conhecimento, ela transfere educadamente para um humano e notifica sua equipe."
            />
            <FaqItem
              question="Posso testar antes de contratar?"
              answer="Sim! Oferecemos um período de teste gratuito para você ver a mágica acontecer na sua própria clínica."
            />
            <FaqItem
              question="Preciso de um número novo de WhatsApp?"
              answer="Não, você pode conectar o número atual da sua clínica através da leitura de QR Code, similar ao WhatsApp Web."
            />
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-32 relative text-center px-4 overflow-hidden bg-[#050505]">
        <div className="relative z-10 max-w-4xl mx-auto space-y-8">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">
            Se sua clínica depende de WhatsApp para vender e você ainda usa humanos ou chatbots...
          </h2>
          <p className="text-xl md:text-2xl text-red-300 font-light">
            Você está operando abaixo do seu potencial.
          </p>

          <div className="pt-8 flex flex-col items-center">
            <Link
              href="/login"
              className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full bg-white h-16 px-12 text-lg text-black font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_0_50px_rgba(255,255,255,0.3)] mb-6"
            >
              <span className="relative z-10">Quero a secretar.ia na minha clínica</span>
              <ArrowRight className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-1" />
            </Link>
            <p className="text-sm text-white/30">
              A secretar.ia é o teto máximo de atendimento possível hoje.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 bg-neutral-950 text-white/20 text-sm">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <div className="font-bold text-lg text-white/40 mb-2">secretar.ia</div>
            <p>© {new Date().getFullYear()} Inteligência Artificial para Saúde e Estética.</p>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Termos</a>
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
            <a href="#" className="hover:text-white transition-colors">Contato</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

// --- SUBCOMPONENTS ---

function CtaButton({ text, size = "md" }: { text: string, size?: "md" | "lg" }) {
  const isLarge = size === "lg";
  return (
    <Link
      href="/login"
      className={`group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-white text-black font-semibold transition-all hover:bg-white/90 hover:scale-105 active:scale-95 ${isLarge ? "h-14 px-10 text-lg" : "h-12 px-8"}`}
    >
      <span className="relative z-10">{text}</span>
      <ArrowRight className="w-4 h-4 relative z-10 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

function ComparisonItem({ icon, text, color }: { icon: "x" | "check", text: string, color: "red" | "yellow" }) {
  const isRed = color === "red";
  return (
    <li className="flex items-start gap-3 text-white/60">
      <span className={`mt-1 font-bold ${isRed ? "text-red-500" : "text-yellow-500"}`}>
        {icon === "x" ? "✕" : "✓"}
      </span>
      <span>{text}</span>
    </li>
  )
}

function IntelligenceItem({ title, text }: { title: string, text: string }) {
  return (
    <div className="pl-6 border-l-2 border-white/10 hover:border-purple-500 transition-colors py-1 group">
      <h4 className="font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">{title}</h4>
      <p className="text-white/50 text-sm">{text}</p>
    </div>
  )
}

function TestimonialCard({ quote, author, role, metric }: { quote: string, author: string, role: string, metric: string }) {
  return (
    <div className="p-8 rounded-2xl bg-[#0F0F0F] border border-white/5 hover:border-purple-500/20 transition-all flex flex-col h-full">
      <Quote className="w-8 h-8 text-purple-500/20 mb-6" />
      <p className="text-white/80 text-lg mb-8 italic flex-grow">"{quote}"</p>
      <div className="mt-auto">
        <div className="flex items-center justify-between border-t border-white/5 pt-4">
          <div>
            <h4 className="font-bold text-white">{author}</h4>
            <p className="text-xs text-white/40">{role}</p>
          </div>
          <div className="text-right">
            <span className="block text-sm font-bold text-green-400">{metric}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function FaqItem({ question, answer }: { question: string, answer: string }) {
  return (
    <details className="group border border-white/5 bg-[#0F0F0F] rounded-xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer items-center justify-between gap-1.5 p-6 text-white font-medium hover:bg-white/5 transition-colors">
        <h3 className="text-lg">{question}</h3>
        <ChevronDown className="h-5 w-5 shrink-0 transition duration-300 group-open:-rotate-180 text-white/50" />
      </summary>
      <div className="px-6 pb-6 text-white/60 leading-relaxed">
        <p>{answer}</p>
      </div>
    </details>
  )
}
