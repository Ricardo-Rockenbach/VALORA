import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import Sidebar from '../componentes/sidebar'
import { listarEquipamentos } from '../servicos/equipamentoServico'
import { listarSetores } from '../servicos/setorServico'
import { listarManutencoes } from '../servicos/manutencaoServico'
import { calcularSaudeEquipamento } from '../servicos/pontuacaoServico'

import './css/Home.css'
import './css/Analytics.css'

function normalizar(texto = '') {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function obterStatusManutencao(status) {
  const valor = normalizar(status)

  if (valor.includes('conclu') || valor.includes('resolvido') || valor.includes('encerrado')) {
    return 'Concluída'
  }

  if (valor.includes('andamento') || valor.includes('atendimento')) {
    return 'Em andamento'
  }

  return 'Aberta'
}

function classeStatusManutencao(status) {
  const valor = obterStatusManutencao(status)
  if (valor === 'Concluída') return 'concluida'
  if (valor === 'Em andamento') return 'andamento'
  return 'aberta'
}

function classeSaude(classificacao) {
  const valor = normalizar(classificacao)
  if (valor === 'excelente') return 'excelente'
  if (valor === 'boa') return 'boa'
  if (valor === 'atencao') return 'atencao'
  return 'critica'
}

function obterDataLocal(valor) {
  if (!valor) return null
  const texto = String(valor).slice(0, 10)
  const partes = texto.split('-')
  if (partes.length !== 3) return null

  const [ano, mes, dia] = partes.map(Number)
  if (!ano || !mes || !dia) return null

  const data = new Date(ano, mes - 1, dia)
  return Number.isNaN(data.getTime()) ? null : data
}

function formatarData(valor) {
  const data = obterDataLocal(valor)
  return data ? data.toLocaleDateString('pt-BR') : '—'
}

function formatarNumero(valor) {
  return Number(valor || 0).toLocaleString('pt-BR')
}

function formatarPercentual(valor) {
  return `${Math.round(valor || 0)}%`
}

function obterInicioPeriodo(periodo, hoje) {
  if (periodo === 'all') return null

  const dias = Number(periodo)
  const inicio = new Date(hoje)
  inicio.setHours(0, 0, 0, 0)
  inicio.setDate(inicio.getDate() - (dias - 1))
  return inicio
}

function gerarSerieTemporal(manutencoes, periodo, hoje) {
  const serie = []

  if (periodo === '30') {
    const inicio = new Date(hoje)
    inicio.setHours(0, 0, 0, 0)
    inicio.setDate(inicio.getDate() - 29)

    for (let indice = 0; indice < 5; indice += 1) {
      const dataInicio = new Date(inicio)
      dataInicio.setDate(inicio.getDate() + indice * 6)
      const dataFim = new Date(dataInicio)
      dataFim.setDate(dataInicio.getDate() + 5)

      const quantidade = manutencoes.filter((item) => {
        const data = obterDataLocal(item.data)
        return data && data >= dataInicio && data <= dataFim
      }).length

      const formatarDiaMes = (data) => data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      serie.push({ label: `${formatarDiaMes(dataInicio)}–${formatarDiaMes(dataFim)}`, quantidade })
    }

    return serie
  }

  const quantidadeMeses = periodo === '90' ? 3 : 6
  const primeiroMes = new Date(hoje.getFullYear(), hoje.getMonth() - quantidadeMeses + 1, 1)

  for (let indice = 0; indice < quantidadeMeses; indice += 1) {
    const inicioMes = new Date(primeiroMes.getFullYear(), primeiroMes.getMonth() + indice, 1)
    const proximoMes = new Date(inicioMes.getFullYear(), inicioMes.getMonth() + 1, 1)
    const quantidade = manutencoes.filter((item) => {
      const data = obterDataLocal(item.data)
      return data && data >= inicioMes && data < proximoMes
    }).length

    serie.push({
      label: inicioMes.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      quantidade,
    })
  }

  return serie
}

function Icone({ nome, tamanho = 21 }) {
  const formas = {
    ativos: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></>,
    saude: <><path d="M20.8 8.8c0 5.1-8.8 11-8.8 11s-8.8-5.9-8.8-11A4.8 4.8 0 0 1 12 6.2a4.8 4.8 0 0 1 8.8 2.6Z" /><path d="M7.5 12h3l1.5-3 2 6 1.5-3h1.5" /></>,
    manutencao: <path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8V21h3.2l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.5-.5-.5-2.5z" />,
    alerta: <><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></>,
    tendencia: <><path d="M3 3v18h18" /><path d="m7 14 4-4 3 3 6-7" /><path d="M15 6h5v5" /></>,
  }

  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {formas[nome]}
    </svg>
  )
}

function Indicador({ icone, rotulo, valor, detalhe, cor }) {
  return (
    <article className={`analytics-kpi analytics-kpi--${cor}`}>
      <span className="analytics-kpi-icone"><Icone nome={icone} /></span>
      <div className="analytics-kpi-conteudo">
        <span>{rotulo}</span>
        <strong>{valor}</strong>
        <small>{detalhe}</small>
      </div>
    </article>
  )
}

function Estado({ children, erro = false }) {
  return <div className={`analytics-estado ${erro ? 'analytics-estado--erro' : ''}`}>{children}</div>
}

function GraficoBarras({ dados }) {
  const maiorValor = Math.max(1, ...dados.map((item) => item.quantidade))

  if (!dados.length || dados.every((item) => item.quantidade === 0)) {
    return <div className="analytics-grafico-vazio">Não há manutenções no período selecionado.</div>
  }

  return (
    <div className="analytics-barras" style={{ gridTemplateColumns: `repeat(${dados.length}, minmax(0, 1fr))` }} role="img" aria-label="Quantidade de manutenções por período">
      {dados.map((item) => (
        <div className="analytics-barra-coluna" key={item.label}>
          <strong>{item.quantidade}</strong>
          <div className="analytics-barra-trilho">
            <span style={{ height: `${Math.max(5, (item.quantidade / maiorValor) * 100)}%` }} />
          </div>
          <small>{item.label}</small>
        </div>
      ))}
    </div>
  )
}

function DistribuicaoSaude({ dados, total }) {
  return (
    <div className="analytics-distribuicao">
      {dados.map((item) => (
        <div className="analytics-distribuicao-item" key={item.nome}>
          <div className="analytics-distribuicao-topo">
            <span className={`analytics-ponto analytics-ponto--${item.classe}`} />
            <strong>{item.nome}</strong>
            <span className="analytics-distribuicao-valor">{item.quantidade}</span>
            <small>{formatarPercentual(total ? (item.quantidade / total) * 100 : 0)}</small>
          </div>
          <div className="analytics-progresso">
            <span className={`analytics-progresso-preenchimento analytics-progresso-preenchimento--${item.classe}`} style={{ width: `${total ? (item.quantidade / total) * 100 : 0}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Analytics() {
  const [equipamentos, setEquipamentos] = useState([])
  const [setores, setSetores] = useState([])
  const [manutencoes, setManutencoes] = useState([])
  const [setorFiltro, setSetorFiltro] = useState('todos')
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas')
  const [periodoFiltro, setPeriodoFiltro] = useState('180')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true

    async function carregarDados() {
      try {
        setCarregando(true)
        setErro('')

        const [dadosEquipamentos, dadosSetores, dadosManutencoes] = await Promise.all([
          listarEquipamentos(),
          listarSetores(),
          listarManutencoes(),
        ])

        if (!ativo) return
        setEquipamentos(Array.isArray(dadosEquipamentos) ? dadosEquipamentos : [])
        setSetores(Array.isArray(dadosSetores) ? dadosSetores : [])
        setManutencoes(Array.isArray(dadosManutencoes) ? dadosManutencoes : [])
      } catch (errorCarregamento) {
        console.error('Erro ao carregar Analytics:', errorCarregamento)
        if (ativo) setErro('Não foi possível carregar os dados analíticos. Verifique a conexão com a API.')
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    carregarDados()
    return () => { ativo = false }
  }, [])

  const hoje = useMemo(() => new Date(), [])
  const inicioPeriodo = useMemo(() => obterInicioPeriodo(periodoFiltro, hoje), [periodoFiltro, hoje])

  const equipamentosComSaude = useMemo(() => {
    const historicos = new Map()

    manutencoes.forEach((manutencao) => {
      const chave = String(manutencao.equipamentoId)
      const lista = historicos.get(chave) || []
      lista.push(manutencao)
      historicos.set(chave, lista)
    })

    return equipamentos.map((equipamento) => {
      const historico = historicos.get(String(equipamento.id)) || []
      const setor = setores.find((item) => String(item.id) === String(equipamento.setorId))
      return {
        ...equipamento,
        setorNome: setor?.nome || 'Sem setor',
        categoriaNome: equipamento.categoria || equipamento.tipo || 'Não informada',
        saude: calcularSaudeEquipamento(equipamento, historico),
        quantidadeManutencoes: historico.length,
      }
    })
  }, [equipamentos, setores, manutencoes])

  const equipamentosFiltrados = useMemo(() => equipamentosComSaude.filter((equipamento) => {
    const correspondeSetor = setorFiltro === 'todos' || String(equipamento.setorId) === setorFiltro
    const correspondeCategoria = categoriaFiltro === 'todas' || equipamento.categoriaNome === categoriaFiltro
    return correspondeSetor && correspondeCategoria
  }), [equipamentosComSaude, setorFiltro, categoriaFiltro])

  const idsEquipamentos = useMemo(() => new Set(equipamentosFiltrados.map((item) => String(item.id))), [equipamentosFiltrados])

  const manutencoesDosEquipamentos = useMemo(() => manutencoes.filter((item) => idsEquipamentos.has(String(item.equipamentoId))), [manutencoes, idsEquipamentos])

  const manutencoesPeriodo = useMemo(() => manutencoesDosEquipamentos.filter((item) => {
    const data = obterDataLocal(item.data)
    if (!data) return false
    if (inicioPeriodo && data < inicioPeriodo) return false
    const fimDoDia = new Date(hoje)
    fimDoDia.setHours(23, 59, 59, 999)
    return data <= fimDoDia
  }), [manutencoesDosEquipamentos, inicioPeriodo, hoje])

  const resumo = useMemo(() => {
    const totalEquipamentos = equipamentosFiltrados.length
    const somaSaude = equipamentosFiltrados.reduce((total, item) => total + item.saude.pontuacao, 0)
    const saudeMedia = totalEquipamentos ? Math.round(somaSaude / totalEquipamentos) : 0
    const emAtencao = equipamentosFiltrados.filter((item) => item.saude.pontuacao >= 50 && item.saude.pontuacao < 75).length
    const criticos = equipamentosFiltrados.filter((item) => item.saude.pontuacao < 50).length
    const abertas = manutencoesPeriodo.filter((item) => obterStatusManutencao(item.status) === 'Aberta').length
    const emAndamento = manutencoesPeriodo.filter((item) => obterStatusManutencao(item.status) === 'Em andamento').length
    const concluidas = manutencoesPeriodo.filter((item) => obterStatusManutencao(item.status) === 'Concluída').length

    return { totalEquipamentos, saudeMedia, emAtencao, criticos, totalManutencoes: manutencoesPeriodo.length, abertas, emAndamento, concluidas }
  }, [equipamentosFiltrados, manutencoesPeriodo])

  const distribuicaoSaude = useMemo(() => {
    const faixas = [
      { nome: 'Excelente', classe: 'excelente', teste: (pontos) => pontos >= 90 },
      { nome: 'Boa', classe: 'boa', teste: (pontos) => pontos >= 75 && pontos < 90 },
      { nome: 'Atenção', classe: 'atencao', teste: (pontos) => pontos >= 50 && pontos < 75 },
      { nome: 'Crítica', classe: 'critica', teste: (pontos) => pontos < 50 },
    ]

    return faixas.map((faixa) => ({
      ...faixa,
      quantidade: equipamentosFiltrados.filter((item) => faixa.teste(item.saude.pontuacao)).length,
    }))
  }, [equipamentosFiltrados])

  const hojeSemHora = useMemo(() => {
    const data = new Date(hoje)
    data.setHours(0, 0, 0, 0)
    return data
  }, [hoje])

  const serieTemporal = useMemo(() => gerarSerieTemporal(manutencoesPeriodo, periodoFiltro, hojeSemHora), [manutencoesPeriodo, periodoFiltro, hojeSemHora])

  const manutencoesPorTipo = useMemo(() => {
    const grupos = new Map()
    manutencoesPeriodo.forEach((item) => {
      const tipo = String(item.tipoManutencao || 'Não informada').trim() || 'Não informada'
      grupos.set(tipo, (grupos.get(tipo) || 0) + 1)
    })

    return [...grupos.entries()]
      .map(([nome, quantidade]) => ({ nome, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
  }, [manutencoesPeriodo])

  const resumoPorSetor = useMemo(() => {
    const grupos = new Map()
    equipamentosFiltrados.forEach((item) => {
      const atual = grupos.get(item.setorNome) || { nome: item.setorNome, quantidade: 0, somaSaude: 0 }
      atual.quantidade += 1
      atual.somaSaude += item.saude.pontuacao
      grupos.set(item.setorNome, atual)
    })

    return [...grupos.values()]
      .map((item) => ({ ...item, saudeMedia: Math.round(item.somaSaude / item.quantidade) }))
      .sort((a, b) => a.saudeMedia - b.saudeMedia)
  }, [equipamentosFiltrados])

  const equipamentosPrioritarios = useMemo(() => [...equipamentosFiltrados]
    .sort((a, b) => a.saude.pontuacao - b.saude.pontuacao)
    .slice(0, 5), [equipamentosFiltrados])

  const manutencoesRecentes = useMemo(() => [...manutencoesPeriodo]
    .sort((a, b) => String(b.data || '').localeCompare(String(a.data || '')))
    .slice(0, 5)
    .map((item) => {
      const equipamento = equipamentos.find((ativo) => String(ativo.id) === String(item.equipamentoId))
      return { ...item, equipamentoNome: equipamento?.nome || 'Equipamento não encontrado', patrimonio: equipamento?.patrimonio || '—' }
    }), [manutencoesPeriodo, equipamentos])

  const categoriasDisponiveis = useMemo(() => [...new Set(equipamentosComSaude.map((item) => item.categoriaNome))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [equipamentosComSaude])

  const periodoLegenda = periodoFiltro === 'all'
    ? 'Todo o histórico'
    : periodoFiltro === '30'
      ? 'Últimos 30 dias'
      : periodoFiltro === '90'
        ? 'Últimos 90 dias'
        : 'Últimos 6 meses'

  return (
    <div className="dash">
      <Sidebar ativo="Analytics" />

      <main className="dash-conteudo analytics-pagina">
        <header className="analytics-cabecalho">
          <div>
            <span className="analytics-sobretitulo">INTELIGÊNCIA E ACOMPANHAMENTO</span>
            <h2 className="dash-titulo">Analytics</h2>
            <p>Analise a saúde dos ativos e o comportamento das manutenções cadastradas.</p>
          </div>
          <Link to="/equipamentos" className="analytics-acao">
            <Icone nome="ativos" tamanho={18} />
            Consultar equipamentos
          </Link>
        </header>

        <section className="analytics-filtros" aria-label="Filtros dos indicadores">
          <div className="analytics-filtro">
            <label htmlFor="analytics-periodo">Período das manutenções</label>
            <select id="analytics-periodo" value={periodoFiltro} onChange={(evento) => setPeriodoFiltro(evento.target.value)}>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 90 dias</option>
              <option value="180">Últimos 6 meses</option>
              <option value="all">Todo o histórico</option>
            </select>
          </div>
          <div className="analytics-filtro">
            <label htmlFor="analytics-setor">Setor</label>
            <select id="analytics-setor" value={setorFiltro} onChange={(evento) => setSetorFiltro(evento.target.value)}>
              <option value="todos">Todos os setores</option>
              {setores.map((setor) => <option key={setor.id} value={String(setor.id)}>{setor.nome}</option>)}
            </select>
          </div>
          <div className="analytics-filtro">
            <label htmlFor="analytics-categoria">Categoria</label>
            <select id="analytics-categoria" value={categoriaFiltro} onChange={(evento) => setCategoriaFiltro(evento.target.value)}>
              <option value="todas">Todas as categorias</option>
              {categoriasDisponiveis.map((categoria) => <option key={categoria} value={categoria}>{categoria}</option>)}
            </select>
          </div>
          <button type="button" className="analytics-limpar-filtros" onClick={() => { setPeriodoFiltro('180'); setSetorFiltro('todos'); setCategoriaFiltro('todas') }}>
            Limpar filtros
          </button>
        </section>

        {carregando ? (
          <Estado>Carregando análises do VALORA...</Estado>
        ) : erro ? (
          <Estado erro>{erro}</Estado>
        ) : (
          <>
            <div className="analytics-contexto">
              <span>Resultados para <strong>{equipamentosFiltrados.length}</strong> equipamento(s)</span>
              <span>Manutenções: <strong>{periodoLegenda.toLowerCase()}</strong></span>
            </div>

            <section className="analytics-kpis" aria-label="Indicadores gerais">
              <Indicador icone="ativos" rotulo="Equipamentos analisados" valor={formatarNumero(resumo.totalEquipamentos)} detalhe="Ativos conforme filtros selecionados" cor="neutro" />
              <Indicador icone="saude" rotulo="Saúde média" valor={`${resumo.saudeMedia}/100`} detalhe="Score calculado com todo o histórico" cor="saude" />
              <Indicador icone="alerta" rotulo="Saúde em atenção ou crítica" valor={formatarNumero(resumo.emAtencao + resumo.criticos)} detalhe={`${resumo.criticos} em situação crítica`} cor="alerta" />
              <Indicador icone="manutencao" rotulo="Manutenções no período" valor={formatarNumero(resumo.totalManutencoes)} detalhe={`${resumo.abertas} abertas · ${resumo.emAndamento} em andamento`} cor="manutencao" />
            </section>

            <section className="analytics-grade-graficos">
              <article className="analytics-painel">
                <div className="analytics-painel-cabecalho">
                  <div><h3>Distribuição da saúde</h3><p>Classificação atual do Score por equipamento.</p></div>
                  <span className="analytics-painel-icone"><Icone nome="saude" /></span>
                </div>
                <DistribuicaoSaude dados={distribuicaoSaude} total={resumo.totalEquipamentos} />
                <div className="analytics-faixas-legenda">
                  <span>Excelente: 90–100</span><span>Boa: 75–89</span><span>Atenção: 50–74</span><span>Crítica: 0–49</span>
                </div>
              </article>

              <article className="analytics-painel">
                <div className="analytics-painel-cabecalho">
                  <div><h3>Volume de manutenções</h3><p>Registros por semana ou mês, conforme o período.</p></div>
                  <span className="analytics-painel-icone"><Icone nome="tendencia" /></span>
                </div>
                <GraficoBarras dados={serieTemporal} />
              </article>
            </section>

            <section className="analytics-grade-secundaria">
              <article className="analytics-painel">
                <div className="analytics-painel-cabecalho">
                  <div><h3>Tipos de manutenção</h3><p>Participação de cada tipo nos registros do período.</p></div>
                </div>
                {manutencoesPorTipo.length ? (
                  <div className="analytics-tipos-lista">
                    {manutencoesPorTipo.map((item, indice) => (
                      <div className="analytics-tipo-item" key={item.nome}>
                        <span className={`analytics-tipo-marcador analytics-tipo-marcador--${indice % 4}`} />
                        <span>{item.nome}</span>
                        <strong>{item.quantidade}</strong>
                        <small>{formatarPercentual((item.quantidade / resumo.totalManutencoes) * 100)}</small>
                      </div>
                    ))}
                  </div>
                ) : <div className="analytics-grafico-vazio">Sem manutenções para classificar neste período.</div>}
                <div className="analytics-nota">Total considerado: {resumo.totalManutencoes} registro(s).</div>
              </article>

              <article className="analytics-painel">
                <div className="analytics-painel-cabecalho">
                  <div><h3>Saúde média por setor</h3><p>Comparação dos equipamentos vinculados a cada setor.</p></div>
                </div>
                {resumoPorSetor.length ? (
                  <div className="analytics-setores-lista">
                    {resumoPorSetor.map((item) => (
                      <div className="analytics-setor-item" key={item.nome}>
                        <div><strong>{item.nome}</strong><small>{item.quantidade} equipamento(s)</small></div>
                        <div className="analytics-setor-medidor"><span style={{ width: `${item.saudeMedia}%` }} /></div>
                        <strong className={`analytics-setor-score analytics-score--${item.saudeMedia >= 90 ? 'excelente' : item.saudeMedia >= 75 ? 'boa' : item.saudeMedia >= 50 ? 'atencao' : 'critica'}`}>{item.saudeMedia}</strong>
                      </div>
                    ))}
                  </div>
                ) : <div className="analytics-grafico-vazio">Nenhum equipamento encontrado para os filtros selecionados.</div>}
              </article>
            </section>

            <section className="analytics-grade-tabelas">
              <article className="analytics-painel">
                <div className="analytics-painel-cabecalho">
                  <div><h3>Equipamentos que exigem atenção</h3><p>Ativos ordenados do menor para o maior Score.</p></div>
                  <Link to="/equipamentos" className="analytics-link">Ver todos</Link>
                </div>
                {equipamentosPrioritarios.length ? (
                  <div className="analytics-tabela-scroll">
                    <table className="analytics-tabela">
                      <thead><tr><th>Patrimônio</th><th>Equipamento</th><th>Setor</th><th>Saúde</th><th>Manutenções</th><th /></tr></thead>
                      <tbody>
                        {equipamentosPrioritarios.map((item) => (
                          <tr key={item.id}>
                            <td>{item.patrimonio || '—'}</td>
                            <td>{item.nome || 'Sem nome'}</td>
                            <td>{item.setorNome}</td>
                            <td><span className={`analytics-score-pill analytics-score--${classeSaude(item.saude.classificacao)}`}>{item.saude.pontuacao} · {item.saude.classificacao}</span></td>
                            <td>{item.quantidadeManutencoes}</td>
                            <td><Link to={`/equipamentos/${item.id}`}>Detalhes</Link></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <div className="analytics-grafico-vazio">Nenhum equipamento encontrado.</div>}
              </article>

              <article className="analytics-painel">
                <div className="analytics-painel-cabecalho">
                  <div><h3>Manutenções recentes</h3><p>Últimos registros dentro do período selecionado.</p></div>
                  <Link to="/manutencoes" className="analytics-link">Ver todas</Link>
                </div>
                {manutencoesRecentes.length ? (
                  <div className="analytics-recentes-lista">
                    {manutencoesRecentes.map((item) => (
                      <div className="analytics-recente-item" key={item.id}>
                        <div className="analytics-recente-data">{formatarData(item.data)}</div>
                        <div className="analytics-recente-descricao"><strong>{item.tipoManutencao || 'Manutenção'}</strong><span>{item.patrimonio} · {item.equipamentoNome}</span></div>
                        <span className={`analytics-status analytics-status--${classeStatusManutencao(item.status)}`}>{obterStatusManutencao(item.status)}</span>
                      </div>
                    ))}
                  </div>
                ) : <div className="analytics-grafico-vazio">Nenhuma manutenção encontrada no período.</div>}
              </article>
            </section>

            <p className="analytics-rodape-nota">A saúde dos equipamentos é recalculada com todo o histórico registrado, seguindo o serviço único de Score do VALORA. O filtro de período altera os indicadores e gráficos de manutenção, mas não apaga eventos anteriores do cálculo da saúde.</p>
          </>
        )}
      </main>
    </div>
  )
}
