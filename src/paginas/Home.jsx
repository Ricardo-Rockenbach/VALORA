import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from '../componentes/sidebar'
import { listarEquipamentos } from '../servicos/equipamentoServico'
import { listarSetores } from '../servicos/setorServico'
import { listarManutencoes } from '../servicos/manutencaoServico'
import { calcularSaudeEquipamento } from '../servicos/pontuacaoServico'
import './Home.css'

// Padroniza textos para comparar status e classificações sem depender
// de acentos, maiúsculas ou espaços excedentes.
function normalizar(texto = '') {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function formatarData(data) {
  if (!data) return '-'

  const dataTexto = String(data).slice(0, 10)
  const [ano, mes, dia] = dataTexto.split('-')

  if (!ano || !mes || !dia) return data
  return `${dia}/${mes}/${ano}`
}

function obterStatusManutencao(status) {
  const valor = normalizar(status)

  if (valor.includes('conclu') || valor.includes('resolvido') || valor.includes('encerrado')) {
    return 'Concluída'
  }

  if (valor.includes('andamento') || valor.includes('atendimento')) {
    return 'Em andamento'
  }

  if (valor.includes('abert') || !valor) {
    return 'Aberta'
  }

  return status
}

function obterClasseStatusManutencao(status) {
  const valor = normalizar(status)

  if (valor.includes('conclu') || valor.includes('resolvido') || valor.includes('encerrado')) {
    return 'concluida'
  }

  if (valor.includes('andamento') || valor.includes('atendimento') || valor.includes('analise')) {
    return 'em-andamento'
  }

  return 'aberta'
}

function obterClasseStatusEquipamento(status) {
  const valor = normalizar(status)

  if (valor === 'ativo') return 'ativo'
  if (valor.includes('manutencao')) return 'manutencao'
  return 'inativo'
}

function obterClasseSaude(classificacao) {
  const valor = normalizar(classificacao)

  if (valor === 'excelente') return 'excelente'
  if (valor === 'boa') return 'boa'
  if (valor === 'atencao') return 'atencao'
  return 'critica'
}

function Icone({ nome, tamanho = 24 }) {
  const formas = {
    equipamentos: (
      <>
        <rect x="3" y="4" width="18" height="13" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </>
    ),
    saude: (
      <>
        <path d="M20.8 8.8c0 5.1-8.8 11-8.8 11s-8.8-5.9-8.8-11A4.8 4.8 0 0 1 12 6.2a4.8 4.8 0 0 1 8.8 2.6Z" />
        <path d="M7.5 12h3l1.5-3 2 6 1.5-3h1.5" />
      </>
    ),
    manutencao: (
      <>
        <path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8V21h3.2l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.5-.5-.5-2.5z" />
      </>
    ),
    ativos: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.5 2.5L16.5 9" />
      </>
    ),
    alerta: (
      <>
        <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4M12 17h.01" />
      </>
    ),
    lista: <path d="M4 7h16M4 12h16M4 17h16" />,
    seta: <path d="m9 5 7 7-7 7" />,
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

function Indicador({ icone, rotulo, valor, detalhe, cor }) {
  return (
    <article className={`home-kpi home-kpi--${cor}`}>
      <span className="home-kpi-icone">
        <Icone nome={icone} tamanho={23} />
      </span>
      <div className="home-kpi-conteudo">
        <span className="home-kpi-rotulo">{rotulo}</span>
        <strong>{valor}</strong>
        <small>{detalhe}</small>
      </div>
    </article>
  )
}

function StatusPill({ children, tipo }) {
  return <span className={`home-pill home-pill--${tipo}`}>{children}</span>
}

export default function Dashboard() {
  const [equipamentos, setEquipamentos] = useState([])
  const [setores, setSetores] = useState([])
  const [manutencoes, setManutencoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  // Carrega as coleções utilizadas nos indicadores e nas tabelas do painel.
  useEffect(() => {
    let ativo = true

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

        if (!ativo) return

        setEquipamentos(Array.isArray(dadosEquipamentos) ? dadosEquipamentos : [])
        setSetores(Array.isArray(dadosSetores) ? dadosSetores : [])
        setManutencoes(Array.isArray(dadosManutencoes) ? dadosManutencoes : [])
      } catch (error) {
        console.error('Erro ao carregar Dashboard:', error)
        if (ativo) setErro('Não foi possível carregar os dados do painel. Verifique a conexão com a API.')
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    carregarDados()

    return () => {
      ativo = false
    }
  }, [])

  // Agrupa o histórico por equipamento e utiliza o MESMO serviço de Score
  // utilizado na tela de detalhes, garantindo uma única regra de cálculo.
  const equipamentosComSaude = useMemo(() => {
    const manutencoesPorEquipamento = new Map()

    manutencoes.forEach((manutencao) => {
      const chave = String(manutencao.equipamentoId)
      const historico = manutencoesPorEquipamento.get(chave) || []
      historico.push(manutencao)
      manutencoesPorEquipamento.set(chave, historico)
    })

    return equipamentos.map((equipamento) => {
      const historico = manutencoesPorEquipamento.get(String(equipamento.id)) || []
      const saude = calcularSaudeEquipamento(equipamento, historico)

      return { ...equipamento, saude }
    })
  }, [equipamentos, manutencoes])

  // Indicadores gerais do patrimônio.
  const resumoEquipamentos = useMemo(() => {
    const ativos = equipamentos.filter(
      (equipamento) => obterClasseStatusEquipamento(equipamento.status) === 'ativo'
    ).length
    const emManutencao = equipamentos.filter(
      (equipamento) => obterClasseStatusEquipamento(equipamento.status) === 'manutencao'
    ).length
    const inativos = equipamentos.filter(
      (equipamento) => obterClasseStatusEquipamento(equipamento.status) === 'inativo'
    ).length

    const somaSaude = equipamentosComSaude.reduce(
      (total, equipamento) => total + equipamento.saude.pontuacao,
      0
    )
    const saudeMedia = equipamentosComSaude.length
      ? Math.round(somaSaude / equipamentosComSaude.length)
      : 0

    return { total: equipamentos.length, ativos, emManutencao, inativos, saudeMedia }
  }, [equipamentos, equipamentosComSaude])

  // Distribuição dos equipamentos por faixa de saúde.
  const distribuicaoSaude = useMemo(() => {
    const faixas = [
      { nome: 'Excelente', classe: 'excelente' },
      { nome: 'Boa', classe: 'boa' },
      { nome: 'Atenção', classe: 'atencao' },
      { nome: 'Crítica', classe: 'critica' },
    ]

    return faixas.map((faixa, indice) => {
      const quantidade = equipamentosComSaude.filter((equipamento) => {
        const pontos = equipamento.saude.pontuacao
        if (indice === 0) return pontos >= 90
        if (indice === 1) return pontos >= 75 && pontos < 90
        if (indice === 2) return pontos >= 50 && pontos < 75
        return pontos < 50
      }).length

      return {
        ...faixa,
        quantidade,
        percentual: equipamentosComSaude.length
          ? Math.round((quantidade / equipamentosComSaude.length) * 100)
          : 0,
      }
    })
  }, [equipamentosComSaude])

  // Resumo do fluxo de manutenção.
  const resumoManutencoes = useMemo(() => {
    const abertas = manutencoes.filter((item) => {
      const status = obterStatusManutencao(item.status)
      // Status não reconhecidos continuam como pendentes, assim como no Score.
      return status !== 'Em andamento' && status !== 'Concluída'
    }).length
    const emAndamento = manutencoes.filter(
      (item) => obterStatusManutencao(item.status) === 'Em andamento'
    ).length
    const concluidas = manutencoes.filter(
      (item) => obterStatusManutencao(item.status) === 'Concluída'
    ).length

    return { total: manutencoes.length, abertas, emAndamento, concluidas }
  }, [manutencoes])

  // Exibe todos os ativos, priorizando os menores Scores no início da tabela.
  const equipamentosOrdenados = useMemo(() => {
    return [...equipamentosComSaude].sort(
      (a, b) => a.saude.pontuacao - b.saude.pontuacao
    )
  }, [equipamentosComSaude])

  // Últimas manutenções com patrimônio, equipamento e setor relacionados.
  const ultimasManutencoes = useMemo(() => {
    return manutencoes
      .map((manutencao) => {
        const equipamento = equipamentos.find(
          (item) => String(item.id) === String(manutencao.equipamentoId)
        )
        const setor = setores.find(
          (item) => String(item.id) === String(equipamento?.setorId)
        )

        return {
          ...manutencao,
          patrimonio: equipamento?.patrimonio || '-',
          equipamento: equipamento?.nome || 'Equipamento não encontrado',
          equipamentoId: equipamento?.id ?? manutencao.equipamentoId,
          setor: setor?.nome || '-',
        }
      })
      .sort((a, b) => String(b.data || '').localeCompare(String(a.data || '')))
      .slice(0, 5)
  }, [manutencoes, equipamentos, setores])

  return (
    <div className="dash">
      <Sidebar ativo="Página Inicial" />

      <main className="dash-conteudo home-dashboard">
        <header className="home-cabecalho">
          <div>
            <span className="home-sobretitulo">GESTÃO DE ATIVOS DE TI</span>
            <h2 className="dash-titulo">Painel Principal</h2>
            <p>Acompanhe a situação dos equipamentos, a saúde dos ativos e as manutenções.</p>
          </div>
          <Link to="/equipamentos" className="home-acao-principal">
            <Icone nome="equipamentos" tamanho={18} />
            Consultar equipamentos
          </Link>
        </header>

        {carregando ? (
          <div className="home-estado home-estado--carregando">Carregando indicadores do VALORA...</div>
        ) : erro ? (
          <div className="home-estado home-estado--erro" role="alert">
            <strong>Não foi possível carregar o Dashboard.</strong>
            <span>{erro}</span>
          </div>
        ) : (
          <>
            <section className="home-secao">
              <div className="home-secao-cabecalho">
                <div>
                  <h3>Visão geral dos equipamentos</h3>
                  <p>Indicadores calculados a partir dos cadastros e históricos atuais.</p>
                </div>
                <span className="home-atualizacao">{resumoEquipamentos.total} equipamentos cadastrados</span>
              </div>

              <div className="home-kpis">
                <Indicador
                  icone="equipamentos"
                  rotulo="Equipamentos cadastrados"
                  valor={resumoEquipamentos.total}
                  detalhe="Total de ativos registrados"
                  cor="neutro"
                />
                <Indicador
                  icone="saude"
                  rotulo="Saúde média"
                  valor={`${resumoEquipamentos.saudeMedia}/100`}
                  detalhe="Média do Score dos equipamentos"
                  cor="saude"
                />
                <Indicador
                  icone="ativos"
                  rotulo="Ativos"
                  valor={resumoEquipamentos.ativos}
                  detalhe="Em operação"
                  cor="positivo"
                />
                <Indicador
                  icone="manutencao"
                  rotulo="Em manutenção"
                  valor={resumoEquipamentos.emManutencao}
                  detalhe="Com status de manutenção"
                  cor="aviso"
                />
                <Indicador
                  icone="alerta"
                  rotulo="Inativos"
                  valor={resumoEquipamentos.inativos}
                  detalhe="Fora de operação"
                  cor="critico"
                />
              </div>
            </section>

            <section className="home-paineis-resumo">
              <article className="home-painel home-painel-saude">
                <div className="home-painel-cabecalho">
                  <div>
                    <h3>Saúde dos equipamentos</h3>
                    <p>Distribuição por faixa de pontuação.</p>
                  </div>
                  <span className="home-painel-icone"><Icone nome="saude" tamanho={21} /></span>
                </div>

                <div className="home-distribuicao">
                  {distribuicaoSaude.map((faixa) => (
                    <div className="home-faixa" key={faixa.nome}>
                      <div className="home-faixa-topo">
                        <span className={`home-faixa-ponto home-faixa-ponto--${faixa.classe}`} />
                        <strong>{faixa.nome}</strong>
                        <span className="home-faixa-quantidade">{faixa.quantidade}</span>
                        <small>{faixa.percentual}%</small>
                      </div>
                      <div
                        className="home-barra"
                        role="progressbar"
                        aria-label={`${faixa.nome}: ${faixa.quantidade} equipamentos`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={faixa.percentual}
                      >
                        <span
                          className={`home-barra-preenchimento home-barra-preenchimento--${faixa.classe}`}
                          style={{ width: `${faixa.percentual}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="home-legenda-score">
                  <span>Excelente: 90–100</span>
                  <span>Boa: 75–89</span>
                  <span>Atenção: 50–74</span>
                  <span>Crítica: 0–49</span>
                </div>
              </article>

              <article className="home-painel home-painel-manutencao">
                <div className="home-painel-cabecalho">
                  <div>
                    <h3>Resumo das manutenções</h3>
                    <p>Acompanhamento das intervenções registradas.</p>
                  </div>
                  <Link to="/manutencoes" className="home-link-painel">Ver todas <Icone nome="seta" tamanho={16} /></Link>
                </div>

                <div className="home-manutencao-total">
                  <span>Total de registros</span>
                  <strong>{resumoManutencoes.total}</strong>
                </div>
                <div className="home-manutencao-status">
                  <div>
                    <span className="home-status-marcador home-status-marcador--aberta" />
                    <span>Abertas</span>
                    <strong>{resumoManutencoes.abertas}</strong>
                  </div>
                  <div>
                    <span className="home-status-marcador home-status-marcador--andamento" />
                    <span>Em andamento</span>
                    <strong>{resumoManutencoes.emAndamento}</strong>
                  </div>
                  <div>
                    <span className="home-status-marcador home-status-marcador--concluida" />
                    <span>Concluídas</span>
                    <strong>{resumoManutencoes.concluidas}</strong>
                  </div>
                </div>
              </article>
            </section>

            <section className="home-paineis-listas">
              <article className="home-painel home-tabela-painel">
                <div className="home-painel-cabecalho">
                  <div>
                    <h3>Equipamentos cadastrados</h3>
                    <p>Visão da saúde e da situação de todos os ativos. Menores Scores aparecem primeiro.</p>
                  </div>
                  <Link to="/equipamentos" className="home-link-painel">Ver equipamentos <Icone nome="seta" tamanho={16} /></Link>
                </div>

                {equipamentosOrdenados.length > 0 ? (
                  <div className="home-tabela-scroll">
                    <table className="home-tabela">
                      <thead>
                        <tr>
                          <th>Patrimônio</th>
                          <th>Equipamento</th>
                          <th>Saúde</th>
                          <th>Manutenções</th>
                          <th>Status</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {equipamentosOrdenados.map((equipamento) => (
                          <tr key={equipamento.id}>
                            <td>{equipamento.patrimonio || '-'}</td>
                            <td>{equipamento.nome || 'Sem nome'}</td>
                            <td>
                              <StatusPill tipo={obterClasseSaude(equipamento.saude.classificacao)}>
                                {equipamento.saude.pontuacao} · {equipamento.saude.classificacao}
                              </StatusPill>
                            </td>
                            <td>{equipamento.saude.totalManutencoes}</td>
                            <td>
                              <StatusPill tipo={obterClasseStatusEquipamento(equipamento.status)}>
                                {equipamento.status || 'Não informado'}
                              </StatusPill>
                            </td>
                            <td>
                              <Link to={`/equipamentos/${equipamento.id}`} className="home-link-detalhes">
                                Detalhes
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="home-vazio">
                    <span className="home-vazio-icone"><Icone nome="ativos" tamanho={22} /></span>
                    <strong>Nenhum equipamento cadastrado.</strong>
                    <p>Os ativos cadastrados aparecerão aqui com seu Score de saúde e status operacional.</p>
                  </div>
                )}
              </article>

              <article className="home-painel home-tabela-painel">
                <div className="home-painel-cabecalho">
                  <div>
                    <h3>Últimas manutenções</h3>
                    <p>Intervenções mais recentes registradas.</p>
                  </div>
                  <Link to="/manutencoes" className="home-link-painel">Ver todas <Icone nome="seta" tamanho={16} /></Link>
                </div>

                {ultimasManutencoes.length > 0 ? (
                  <div className="home-tabela-scroll">
                    <table className="home-tabela">
                      <thead>
                        <tr>
                          <th>Equipamento</th>
                          <th>Setor</th>
                          <th>Data</th>
                          <th>Status</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {ultimasManutencoes.map((manutencao) => (
                          <tr key={manutencao.id}>
                            <td>
                              <strong>{manutencao.patrimonio}</strong>
                              <small>{manutencao.equipamento}</small>
                            </td>
                            <td>{manutencao.setor}</td>
                            <td>{formatarData(manutencao.data)}</td>
                            <td>
                              <StatusPill tipo={obterClasseStatusManutencao(manutencao.status)}>
                                {obterStatusManutencao(manutencao.status)}
                              </StatusPill>
                            </td>
                            <td>
                              <Link to={`/equipamentos/${manutencao.equipamentoId}`} className="home-link-detalhes">
                                Ativo
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="home-vazio">
                    <strong>Nenhuma manutenção cadastrada.</strong>
                    <p>Os novos registros aparecerão aqui.</p>
                  </div>
                )}
              </article>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
