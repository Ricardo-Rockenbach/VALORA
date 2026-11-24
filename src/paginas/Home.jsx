import { useEffect, useMemo, useState } from 'react'


import { Link } from 'react-router-dom'


import Sidebar from '../componentes/sidebar'
import GraficoSaude from '../componentes/graficos/saude-equipamentos'
import GraficoResumoManutencoes from '../componentes/graficos/resumo-manutencoes'

import { calcularDistribuicaoSaude, calcularResumoManutencoes, obterStatusManutencao }
 from '../servicos/IndicadoresServico'


import {  Boxes, Monitor, HeartPulse, CircleCheck, Wrench, TriangleAlert, ChevronRight, PackageOpen} from "lucide-react"


import { listarEquipamentos } from '../servicos/equipamentoServico'
import { listarSetores } from '../servicos/setorServico'
import { listarManutencoes } from '../servicos/manutencaoServico'
import { calcularSaudeEquipamento } from '../servicos/pontuacaoServico'
import './css/Home.css'

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



function Indicador({ icone, rotulo, valor, cor }) {
  return (
    <article className={`home-kpi home-kpi--${cor}`}>
    <span className="home-kpi-icone">
          {icone}
    </span>
      <div className="home-kpi-conteudo">
        <span className="home-kpi-rotulo">{rotulo}</span>
        <strong>{valor}</strong>
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

const distribuicaoSaude = useMemo(
  () => calcularDistribuicaoSaude(equipamentosComSaude),
  [equipamentosComSaude]
)

const resumoManutencoes = useMemo(
  () => calcularResumoManutencoes(manutencoes),
  [manutencoes]
)

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
            <p>"Visão geral dos ativos e suas manutenções.".</p>
          </div>
          <Link to="/equipamentos" className="home-acao-principal">
            <Monitor size={18} />
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
                </div>
                <span className="home-atualizacao">{resumoEquipamentos.total} equipamentos cadastrados</span>
              </div>

              <div className="home-kpis">
                <Indicador
                  icone={<Monitor size={24} />}
                  rotulo="Equipamentos cadastrados"
                  valor={resumoEquipamentos.total}
                  detalhe="Total de ativos registrados"
                  cor="neutro"
                />
                <Indicador
                  icone={<HeartPulse size={23} />}
                  rotulo="Saúde média"
                  valor={`${resumoEquipamentos.saudeMedia}/100`}
                  detalhe="Média do Score dos equipamentos"
                  cor="saude"
                />
                <Indicador
                  icone={<CircleCheck size={23} />}
                  rotulo="Ativos"
                  valor={resumoEquipamentos.ativos}
                  detalhe="Em operação"
                  cor="positivo"
                />
                <Indicador
                  icone={<Wrench size={23} />}
                  rotulo="Em manutenção"
                  valor={resumoEquipamentos.emManutencao}
                  detalhe="Com status de manutenção"
                  cor="aviso"
                />
                <Indicador
                  icone={<TriangleAlert size={23} />}
                  rotulo="Inativos"
                  valor={resumoEquipamentos.inativos}
                  detalhe="Fora de operação"
                  cor="critico"
                />
              </div>
            </section>

            <section className="home-paineis-resumo">
              <article className="home-painel home-painel-saude">

                <GraficoSaude dados={distribuicaoSaude} />
              </article>
              <article className="home-painel home-painel-manutencao">

                <div className="home-painel-cabecalho">

                  <div>
                    <h3>Resumo das manutenções</h3>
                  </div>

                  <Link
                    to="/manutencoes"
                    className="home-link-painel"
                  >
                    Ver todas <ChevronRight size={16} />
                  </Link>

                </div>

                <GraficoResumoManutencoes dados={resumoManutencoes} />

              </article>
            </section>

            <section className="home-paineis-listas">
              <article className="home-painel home-tabela-painel">
                <div className="home-painel-cabecalho">
                  <div>
                    <h3>Equipamentos cadastrados</h3>
                  </div>
                  <Link to="/equipamentos" className="home-link-painel">Ver equipamentos <ChevronRight size={16} /></Link>
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
                    <span className="home-vazio-icone"><PackageOpen size={22} /></span>
                    <strong>Nenhum equipamento cadastrado.</strong>
                    <p>Os ativos cadastrados aparecerão aqui com seu Score de saúde e status operacional.</p>
                  </div>
                )}
              </article>

              <article className="home-painel home-tabela-painel">
                <div className="home-painel-cabecalho">
                  <div>
                    <h3>Últimas manutenções</h3>
                  </div>
                  <Link to="/manutencoes" className="home-link-painel">Ver todas <ChevronRight size={16} /></Link>
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
