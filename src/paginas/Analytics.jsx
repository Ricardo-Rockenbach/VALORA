import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Monitor, HeartPulse, Wrench, TriangleAlert } from 'lucide-react'

import Sidebar from '../componentes/sidebar'

//graficos
import GraficoSaude from '../componentes/graficos/saude-equipamentos'
import GraficoVolumeManutencoes from '../componentes/graficos/volume-manutencoes'
import GraficoTiposManutencoes from '../componentes/graficos/tipo-manutencao'
import GraficoSaudeSetores from '../componentes/graficos/saude-setores'


import { calcularDistribuicaoSaude, obterDataLocal, gerarSerieTemporal, calcularTiposManutencao, calcularSaudePorSetor } 
from '../servicos/IndicadoresServico'


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


function Indicador({ icone: Icone, rotulo, valor, detalhe, cor }) {
  return (
    <article className={`analytics-kpi analytics-kpi--${cor}`}>
      <span className="analytics-kpi-icone">
        <Icone size={21} strokeWidth={1.8} />
      </span>

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

  const distribuicaoSaude = useMemo(
  () => calcularDistribuicaoSaude(equipamentosFiltrados),
  [equipamentosFiltrados]
)

  const hojeSemHora = useMemo(() => {
    const data = new Date(hoje)
    data.setHours(0, 0, 0, 0)
    return data
  }, [hoje])

  const serieTemporal = useMemo(() => gerarSerieTemporal(manutencoesPeriodo, periodoFiltro, hojeSemHora), [manutencoesPeriodo, periodoFiltro, hojeSemHora])

const manutencoesPorTipo = useMemo(
  () => calcularTiposManutencao(manutencoesPeriodo),
  [manutencoesPeriodo]
)

  const resumoPorSetor = useMemo(
    () => calcularSaudePorSetor(equipamentosFiltrados),
    [equipamentosFiltrados]
  )

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
            <h2 className="dash-titulo">Analytics</h2>
            <p>Analise a saúde dos ativos e o comportamento das manutenções cadastradas.</p>
          </div>
          <Link to="/equipamentos" className="analytics-acao">
            <Monitor size={18} strokeWidth={1.8} />
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
            </div>

            <section className="analytics-kpis" aria-label="Indicadores gerais">
              <Indicador
                icone={Monitor}
                rotulo="Equipamentos analisados"
                valor={formatarNumero(resumo.totalEquipamentos)}
                cor="neutro"
              />

              <Indicador
                icone={HeartPulse}
                rotulo="Saúde média"
                valor={`${resumo.saudeMedia}/100`}
                cor="saude"
              />

              <Indicador
                icone={TriangleAlert}
                rotulo="Saúde em atenção ou crítica"
                valor={formatarNumero(resumo.emAtencao + resumo.criticos)}
                cor="alerta"
              />

              <Indicador
                icone={Wrench}
                rotulo="Manutenções no período"
                valor={formatarNumero(resumo.totalManutencoes)}
                cor="manutencao"
              />
            </section>

            <section className="analytics-grade-graficos">
              <article className="analytics-painel">
                <GraficoSaude dados={distribuicaoSaude}
                  titulo='Distribuição da saúde' />
              </article>

              <article className="analytics-painel">
                  <GraficoVolumeManutencoes
                    dados={serieTemporal}
                    titulo="Volume de manutenções"
                  />
              </article>
            </section>

            <section className="analytics-grade-secundaria">
              <article className="analytics-painel">
                  <GraficoTiposManutencoes
                      dados={manutencoesPorTipo}
                      titulo="Tipos de manutenção"
                    />
              </article>

              <article className="analytics-painel">
                  <GraficoSaudeSetores
                    dados={resumoPorSetor}
                    titulo="Saúde média por setor"
                  />
              </article>
            </section>

            <section className="analytics-grade-tabelas">
              <article className="analytics-painel">
                <div className="analytics-painel-cabecalho">
                  <div><h3>Equipamentos</h3></div>
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
                  <div><h3>Manutenções recentes</h3></div>
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
