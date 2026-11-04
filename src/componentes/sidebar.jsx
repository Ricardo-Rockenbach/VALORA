import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
// Barra lateral compartilhada entre as páginas.
// Usa as classes "dash-*" que já estão no Dashboard.css.
//
// Props:
//   ativo         -> rótulo do item destacado (ex.: 'Cadastro')
//   abertoInicial -> rótulo do submenu que já começa aberto
//   nomeUsuario   -> nome mostrado na saudação

const menu = [
  { rotulo: 'Página Inicial', para: '/' },
  {
    rotulo: 'Cadastro',
    filhos: [
      { rotulo: 'Equipamentos', para: '/equipamentos' },
      { rotulo: 'Setores', para: '/setores' },
      { rotulo: 'Localizações', para: '/localizacoes' },
      { rotulo: 'Fornecedores', para: '/fornecedores' },
    ],
  },
  { rotulo: 'Manutenção', para: '/manutencoes' },
  { rotulo: 'Analytics', para: '/analytics' },
  {
    rotulo: 'Sistema',
    filhos: [{ rotulo: 'Configurações', para: '/configuracoes' }],
  },
]

function Svg({ tamanho, children }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

const IconeUsuario = () => (
  <Svg tamanho={58}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="10" r="3" />
    <path d="M6.2 18.5c1.2-2.2 3.3-3.3 5.8-3.3s4.6 1.1 5.8 3.3" />
  </Svg>
)

const IconeSeta = () => (
  <Svg tamanho={24}>
    <path d="M9 5l7 7-7 7" />
  </Svg>
)

export default function Sidebar({ ativo, abertoInicial = null, nomeUsuario = 'Pablo' }) {
  const [aberto, setAberto] = useState(abertoInicial)

  return (
    <aside className="dash-sidebar">

    <div className="dash-logo">
      <h1>VALORA</h1>
    </div>

      <div className="dash-usuario">
        <span className="dash-avatar">
          <IconeUsuario />
        </span>
        <p>Olá, {nomeUsuario}</p>
      </div>

      <nav>
        <ul>
          {menu.map((item) => {
            const classeBase = `dash-menu-item ${ativo === item.rotulo ? 'dash-menu-item--ativo' : ''}`

            // Item com submenu
            if (item.filhos) {
              const estaAberto = aberto === item.rotulo
              return (
                <li key={item.rotulo}>
                  <button
                    type="button"
                    className={`${classeBase} ${estaAberto ? 'dash-menu-item--aberto' : ''}`}
                    aria-expanded={estaAberto}
                    onClick={() => setAberto(estaAberto ? null : item.rotulo)}
                  >
                    {item.rotulo}
                    <span className={`dash-seta ${estaAberto ? 'dash-seta--aberta' : ''}`}>
                      <IconeSeta />
                    </span>
                  </button>

                  {estaAberto && (
                    <ul className="dash-submenu">
                      {item.filhos.map((filho) => (
                        <li key={filho.para}>
                          <NavLink
                            to={filho.para}
                            className={({ isActive }) =>
                              `dash-submenu-item ${isActive ? 'dash-submenu-item--ativo' : ''}`
                            }
                          >
                            {filho.rotulo}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            }

            // Item que leva a uma página
            if (item.para) {
              return (
                <li key={item.rotulo}>
                  <Link to={item.para} className={classeBase}>
                    {item.rotulo}
                  </Link>
                </li>
              )
            }

            // Item ainda sem página
            return (
              <li key={item.rotulo}>
                <button type="button" className={classeBase}>
                  {item.rotulo}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
