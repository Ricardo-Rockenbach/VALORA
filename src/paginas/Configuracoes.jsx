import Sidebar from '../componentes/sidebar'
import './css/Home.css'
import './css/Configuracoes.css'

function Icone({ tipo }) {
  const formas = {
    sistema: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="m19.4 15 .1.1a1.7 1.7 0 1 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 1 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 1 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9H4a1.7 1.7 0 1 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 1 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2V2a1.7 1.7 0 1 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 1 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 1 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9Z" />
      </>
    ),
    acessos: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 1 1 8 0v3M12 14v3" />
      </>
    ),
    usuarios: (
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20a6.5 6.5 0 0 1 13 0M17 11a3 3 0 1 0 0-6M18 14a5 5 0 0 1 3.5 6" />
      </>
    ),
  }

  return (
    <svg
      className="conf-card-icone-svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {formas[tipo]}
    </svg>
  )
}

const areas = [
  {
    tipo: 'sistema',
    titulo: 'Configurações do sistema',
    descricao:
      'Área destinada às preferências gerais e aos parâmetros de funcionamento do VALORA.',
    detalhes: 'Centralização das configurações administrativas da aplicação.',
  },
  {
    tipo: 'acessos',
    titulo: 'Acessos e permissões',
    descricao:
      'Área destinada ao gerenciamento dos acessos e das permissões disponíveis para cada usuário.',
    detalhes: 'Organização e controle do que cada perfil poderá visualizar e utilizar.',
  },
  {
    tipo: 'usuarios',
    titulo: 'Criação e gestão de usuários',
    descricao:
      'Área destinada ao cadastro, à consulta e à manutenção dos usuários que utilizarão o VALORA.',
    detalhes: 'Centralização das contas de usuário e respectivas informações de acesso.',
  },
]

export default function Configuracoes() {
  return (
    <div className="dash conf-layout">
      <Sidebar ativo="Sistema" abertoInicial="Sistema" />

      <main className="dash-conteudo conf-conteudo">
        <header className="conf-cabecalho">
          <div>
            <span className="conf-sobretitulo">ADMINISTRAÇÃO DO VALORA</span>
            <h2 className="dash-titulo">Configurações</h2>
            <p>
              Área destinada às configurações do sistema, ao gerenciamento de
              acessos e à criação de usuários.
            </p>
          </div>
          <span className="conf-etiqueta">Área administrativa</span>
        </header>

        <section className="conf-apresentacao" aria-labelledby="conf-apresentacao-titulo">
          <div className="conf-apresentacao-icone">
            <Icone tipo="sistema" />
          </div>
          <div>
            <h3 id="conf-apresentacao-titulo">Central de configurações</h3>
            <p>
              Este espaço reunirá os recursos necessários para administrar o
              ambiente do VALORA, controlar os acessos e organizar os usuários
              da aplicação.
            </p>
          </div>
        </section>

        <section className="conf-secao" aria-labelledby="conf-recursos-titulo">
          <div className="conf-secao-cabecalho">
            <div>
              <h3 id="conf-recursos-titulo">Áreas previstas</h3>
              <p>Funcionalidades que serão disponibilizadas nesta seção.</p>
            </div>
            <span className="conf-status-planejamento">Em planejamento</span>
          </div>

          <div className="conf-grade">
            {areas.map((area) => (
              <article className="conf-card" key={area.tipo}>
                <div className="conf-card-icone">
                  <Icone tipo={area.tipo} />
                </div>
                <h4>{area.titulo}</h4>
                <p>{area.descricao}</p>
                <div className="conf-card-detalhe">
                  <span>FINALIDADE</span>
                  <p>{area.detalhes}</p>
                </div>
                <span className="conf-card-status">Disponibilidade futura</span>
              </article>
            ))}
          </div>
        </section>

        <aside className="conf-aviso" aria-label="Aviso sobre a página">
          <strong>Área informativa</strong>
          <p>
            Nesta versão, a página apresenta a finalidade do módulo. As opções
            de configuração, gerenciamento de permissões e cadastro de usuários
            ainda não estão habilitadas.
          </p>
        </aside>
      </main>
    </div>
  )
}
