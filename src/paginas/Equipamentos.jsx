import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from '../componentes/sidebar'
import { listarEquipamentos } from '../servicos/equipamentoServico'
import { listarSetores } from '../servicos/setorServico'
import { listarFornecedores } from '../servicos/fornecedorServico'
import './Home.css' // layout, cards e sidebar compartilhados
import './Equipamentos.css'



const classeStatus = {
  Ativo: 'eq-status--ativo',
  'Em manutenção': 'eq-status--manutencao',
  Inativo: 'eq-status--inativo',
}

function Icone({ nome, tamanho = 18 }) {
  const formas = {
    busca: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </>
    ),
    chevron: <path d="M6 9l6 6 6-6" />,
    calendario: (
      <>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M3 10h18M8 2v4M16 2v4" />
      </>
    ),
    filtro: <path d="M4 6h16M7 12h10M10 18h4" />,
  }

  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {formas[nome]}
    </svg>
  )
}


function Filtro({ rotulo, valor, onChange, opcoes, icone }) {
  return (
    <label className="eq-filtro">
      <span className="eq-filtro-rotulo">
        {rotulo}
        {icone && <Icone nome={icone} tamanho={12} />}
      </span>
      <select value={valor} onChange={(e) => onChange(e.target.value)}>
        {opcoes.map((opcao) => (
          <option key={opcao} value={opcao === 'Todos' ? '' : opcao}>
            {opcao}
          </option>
        ))}
      </select>
      <span className="eq-filtro-seta">
        <Icone nome="chevron" tamanho={16} />
      </span>
    </label>
  )
}

export default function Equipamentos() {
  const [equipamentos, setEquipamentos] = useState([])
  const [setores, setSetores] = useState([])
  const [fornecedores, setFornecedores] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState('')
  const [prioridade, setPrioridade] = useState('')
  const [periodo, setPeriodo] = useState('')

  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true)
        setErro('')

        const [dadosEquipamentos, dadosSetores] = await Promise.all([
          listarEquipamentos(),
          listarSetores(),
        ])

        setEquipamentos(dadosEquipamentos)
        setSetores(dadosSetores)

      } catch (error) {
        console.error(error)
        setErro('Não foi possível carregar os equipamentos.')
      } finally {
        setCarregando(false)
      }
    }

    carregarDados()
  }, [])

  useEffect(() => {
  async function carregarFornecedores() {
    try {
      const dados = await listarFornecedores()
      setFornecedores(dados)
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error)
    }
  }

  carregarFornecedores()
}, [])

  // Filtragem dos equipamentos
      const listaFiltrada = useMemo(() => {
        const termo = busca.trim().toLowerCase()

        return equipamentos
          .map((e) => {
            const setor = setores.find(
              (s) => Number(s.id) === Number(e.setorId)
            )

            return {
              ...e,
              setorNome: setor?.nome || 'Setor não encontrado',
            }
          })
          .filter((e) => {
            const bateStatus = !status || e.status === status

            const bateBusca =
              !termo ||
              [
                e.patrimonio,
                e.nome,
                e.setorNome,
                e.tipo,
                e.marca,
              ].some((campo) =>
                String(campo ?? '').toLowerCase().includes(termo)
              )

            return bateStatus && bateBusca
          })
      }, [equipamentos, setores, busca, status])

      // Cards de resumo
      const resumo = [
        {
          rotulo: 'Total de equipamentos',
          valor: equipamentos.length,
          cor: 'laranja',
        },
        {
          rotulo: 'Ativos',
          valor: equipamentos.filter((e) => e.status === 'Ativo').length,
          cor: 'verde',
        },
        {
          rotulo: 'Em manutenção',
          valor: equipamentos.filter((e) => e.status === 'Em manutenção').length,
          cor: 'amarelo',
        },
        {
          rotulo: 'Inativos',
          valor: equipamentos.filter((e) => e.status === 'Inativo').length,
          cor: 'vermelho',
        },
      ]

  return (
    <div className="dash">
      <Sidebar ativo="Cadastro" abertoInicial="Cadastro" />

      <main className="dash-conteudo">
        <header className="eq-cabecalho">
          <h2 className="dash-titulo">Equipamentos</h2>
          <Link className="eq-adicionar" to="/equipamentos/novo">
            Adicionar
          </Link>
        </header>
        {/* Cards de resumo */}
        <section className="eq-cards" aria-label="Resumo dos equipamentos">
          {resumo.map((c) => (
            <div key={c.rotulo} className={`eq-card dash-card--${c.cor}`}>
              <strong>{c.valor}</strong>
              <span>{c.rotulo}</span>
            </div>
          ))}
        </section>
          {/* Busca e Filtros */}
        <section className="eq-filtros" aria-label="Filtros">
          <label className="eq-busca">
            <Icone nome="busca" />
            <input
              type="search"
              placeholder="buscar"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </label>

          <Filtro
            rotulo="Status"
            valor={status}
            onChange={setStatus}
            opcoes={['Todos', 'Ativo', 'Em manutenção', 'Inativo']}
          />
          <Filtro
            rotulo="Prioridade"
            valor={prioridade}
            onChange={setPrioridade}
            opcoes={['Todos', 'Baixa', 'Média', 'Alta']}
          />
          <Filtro
            rotulo="Período"
            icone="calendario"
            valor={periodo}
            onChange={setPeriodo}
            opcoes={['Todos', 'Últimos 7 dias', 'Últimos 30 dias', 'Últimos 12 meses']}
          />

          <button type="button" className="eq-botao-filtros">
            <Icone nome="filtro" /> Filtros
          </button>
        </section>
          {/* Tabela de Equipamentos */}
        <div className="eq-tabela-caixa">
          <table>
            <thead>
              <tr>
                <th>Patrimônio</th>
                <th>Equipamento</th>
                <th>Setor</th>
                <th>Tipo</th>
                <th>Marca</th>
                <th>Status</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
                {carregando ? (
                  <tr>
                    <td colSpan={7} className="eq-vazio">
                      Carregando equipamentos...
                    </td>
                  </tr>
                ) : erro ? (
                  <tr>
                    <td colSpan={7} className="eq-vazio">
                      {erro}
                    </td>
                  </tr>
                ) : listaFiltrada.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="eq-vazio">
                      Nenhum equipamento encontrado.
                    </td>
                  </tr>
                ) : (
                  listaFiltrada.map((e) => (
                    <tr key={e.id}>
                      <td>{e.patrimonio}</td>
                      <td>{e.nome}</td>
                      <td>{e.setorNome}</td>
                      <td>{e.tipo}</td>
                      <td>{e.marca}</td>
                      <td className={classeStatus[e.status]}>{e.status}</td>
                      <td className="eq-coluna-acao">
                        <Link
                          to={`/equipamentos/${e.id}`}
                          className="dash-ver-detalhes"
                        >
                          Ver Detalhes
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
