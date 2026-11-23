import { Settings, LockKeyhole, UsersRound } from 'lucide-react'

import Sidebar from '../componentes/sidebar'


import './css/Home.css'
import './css/Configuracoes.css'


const areas = [
  {
    tipo: 'sistema',
    icone: Settings,
    titulo: 'Configurações do sistema',
    descricao:
      'Área destinada às preferências gerais e aos parâmetros de funcionamento do VALORA.',
    detalhes: 'Centralização das configurações administrativas da aplicação.',
  },
  {
    tipo: 'acessos',
    icone: LockKeyhole,
    titulo: 'Acessos e permissões',
    descricao:
      'Área destinada ao gerenciamento dos acessos e das permissões disponíveis para cada usuário.',
    detalhes: 'Organização e controle do que cada perfil poderá visualizar e utilizar.',
  },
  {
    tipo: 'usuarios',
    icone: UsersRound,
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
            <h2 className="dash-titulo">Configurações</h2>
          </div>
          <span className="conf-etiqueta">Área administrativa</span>
        </header>

        <section className="conf-apresentacao" aria-labelledby="conf-apresentacao-titulo">
          <div className="conf-apresentacao-icone">
            <Settings size={30} strokeWidth={1.7} />
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
              {areas.map((area) => {
                const IconeArea = area.icone

                return (
                  <article className="conf-card" key={area.tipo}>
                    <div className="conf-card-icone">
                      <IconeArea
                        className="conf-card-icone-svg"
                        size={30}
                        strokeWidth={1.7}
                      />
                    </div>
                    <h4>{area.titulo}</h4>
                    <p>{area.descricao}</p>
                    <div className="conf-card-detalhe">
                      <span>FINALIDADE</span>
                      <p>{area.detalhes}</p>
                    </div>
                    <span className="conf-card-status">
                      Disponibilidade futura
                    </span>
                  </article>
                )
              })}
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
