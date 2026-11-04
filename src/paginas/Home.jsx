
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from '../componentes/Sidebar'
import { listarEquipamentos } from '../servicos/equipamentoServico'
import { listarSetores } from '../servicos/setorServico'
import { listarManutencoes } from '../servicos/manutencaoServico'
import './Home.css'

// Normaliza textos para facilitar a comparação dos status.
function normalizar(texto = '') {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function formatarData(data) {
  if (!data) return '-'

  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

function Icone({ nome, tamanho = 40 }) {
  const formas = {
    semsinal: (
      <>
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4M3 3l18 18" />
      </>
    ),
    ok: (
      <>
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4M8.5 10l2.5 2.5L15.5 8" />
      </>
    ),
    x: (
      <>
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4M9.5 7.5l5 5M14.5 7.5l-5 5" />
      </>
    ),
    chave: (
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8V21h3.2l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.5-.5-.5-2.5z" />
    ),
    concluido: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12.5l2.7 2.7L16 9.5" />
      </>
    ),
    alerta: (
      <>
        <path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
        <path d="M12 9v4M12 17h.01" />
      </>
    ),
    usuario: (
      <>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="10" r="3" />
        <path d="M6.2 18.5c1.2-2.2 3.3-3.3 5.8-3.3s4.6 1.1 5.8 3.3" />
      </>
    ),
    lista: <path d="M4 7h16M4 12h16M4 17h16" />,
    seta: <path d="M9 5l7 7-7 7" />,
  }

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
      {formas[nome]}
    </svg>
  )
}

function Card({ cor, icone, valor, rotulo, tamanhoIcone }) {
  return (
    <div className={`dash-card dash-card--${cor}`}>
      <Icone nome={icone} tamanho={tamanhoIcone} />
      <div>
        <strong>{valor}</strong>
        <span>{rotulo}</span>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [equipamentos, setEquipamentos] = useState([])
  const [setores, setSetores] = useState([])
  const [manutencoes, setManutencoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  // Busca os dados das três coleções.
  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true)
        setErro('')

        const [dadosEquipamentos, dadosSetores, dadosManutencoes] =
          await Promise.all([
            listarEquipamentos(),
            listarSetores(),
            listarManutencoes(),
          ])

        setEquipamentos(dadosEquipamentos)
        setSetores(dadosSetores)
        setManutencoes(dadosManutencoes)
      } catch (error) {
        console.error('Erro ao carregar Dashboard:', error)
        setErro('Não foi possível carregar os dados do painel.')
      } finally {
        setCarregando(false)
      }
    }

    carregarDados()
  }, [])

  // Indicadores dos equipamentos.
  const resumoEquipamentos = useMemo(() => [
    {
      cor: 'laranja',
      icone: 'semsinal',
      valor: equipamentos.filter(
        (e) => normalizar(e.status) === 'em manutencao'
      ).length,
      rotulo: 'Em manutenção',
    },
    {
      cor: 'verde',
      icone: 'ok',
      valor: equipamentos.filter(
        (e) => normalizar(e.status) === 'ativo'
      ).length,
      rotulo: 'Ativos',
    },
    {
      cor: 'vermelho',
      icone: 'x',
      valor: equipamentos.filter(
        (e) => normalizar(e.status) === 'inativo'
      ).length,
      rotulo: 'Inativos',
    },
  ], [equipamentos])

  // Indicadores das manutenções.
  const resumoManutencoes = useMemo(() => [
    {
      cor: 'laranja',
      icone: 'chave',
      valor: manutencoes.length,
      rotulo: 'Total de manutenções',
    },
    {
      cor: 'amarelo',
      icone: 'concluido',
      valor: manutencoes.filter(
        (m) => normalizar(m.status) === 'concluida'
      ).length,
      rotulo: 'Manutenções concluídas',
    },
    {
      cor: 'vermelho',
      icone: 'alerta',
      valor: manutencoes.filter(
        (m) => normalizar(m.status) === 'aberta'
      ).length,
      rotulo: 'Abertas',
    },
  ], [manutencoes])

  // Relaciona manutenção, equipamento e setor.
  const ultimasManutencoes = useMemo(() => {
    return manutencoes
      .map((manutencao) => {
        const equipamento = equipamentos.find(
          (e) => Number(e.id) === Number(manutencao.equipamentoId)
        )

        const setor = setores.find(
          (s) => Number(s.id) === Number(equipamento?.setorId)
        )

        return {
          ...manutencao,
          patrimonio: equipamento?.patrimonio || '-',
          equipamento: equipamento?.nome || 'Equipamento não encontrado',
          setor: setor?.nome || '-',
        }
      })
      .sort((a, b) => new Date(b.data) - new Date(a.data))
      .slice(0, 4)
  }, [manutencoes, equipamentos, setores])

  return (
    <div className="dash">
      <Sidebar ativo="Página Inicial" />

      <main className="dash-conteudo">
        <h2 className="dash-titulo">Painel Principal</h2>

        <h3 className="dash-subtitulo">Resumo dos Equipamentos</h3>

        {carregando ? (
          <p>Carregando dados...</p>
        ) : erro ? (
          <p>{erro}</p>
        ) : (
          <>
            <section className="dash-resumo">
              {resumoEquipamentos.map((c) => (
                <Card key={c.rotulo} {...c} tamanhoIcone={50} />
              ))}
            </section>

            <div className="dash-inferior">
              <section>
                <header className="dash-tabela-cabecalho">
                  <h3>
                    <Icone nome="lista" tamanho={35} />
                    Últimas Manutenções
                  </h3>

                  <Link
                    to="/manutencoes"
                    className="dash-ver-todas"
                  >
                    Ver todas <Icone nome="seta" tamanho={20} />
                  </Link>
                </header>

                <div className="dash-tabela-caixa">
                  <table>
                    <thead>
                      <tr>
                        <th>Patrimônio</th>
                        <th>Equipamento</th>
                        <th>Setor</th>
                        <th>Data</th>
                        <th>Status</th>
                        <th />
                      </tr>
                    </thead>

                    <tbody>
                      {ultimasManutencoes.length > 0 ? (
                        ultimasManutencoes.map((m) => (
                          <tr key={m.id}>
                            <td>{m.patrimonio}</td>
                            <td>{m.equipamento}</td>
                            <td>{m.setor}</td>
                            <td>{formatarData(m.data)}</td>
                            <td>{m.status || 'Não informado'}</td>
                            <td>
                              <Link
                                to={`/manutencoes/${m.id}`}
                                className="dash-ver-detalhes"
                              >
                                Ver Detalhes
                              </Link>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6">
                            Nenhuma manutenção cadastrada.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <aside className="dash-lateral">
                {resumoManutencoes.map((c) => (
                  <Card key={c.rotulo} {...c} tamanhoIcone={50} />
                ))}
              </aside>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
