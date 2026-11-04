
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import Sidebar from '../componentes/sidebar'

import { listarEquipamentos } from '../servicos/equipamentoServico'
import { listarSetores } from '../servicos/setorServico'
import { listarLocalizacoes } from '../servicos/localizacaoServico'
import { listarFornecedores } from '../servicos/fornecedorServico'
import { listarManutencoes } from '../servicos/manutencaoServico'
import { calcularSaudeEquipamento } from '../servicos/pontuacaoServico'

import './Home.css'
import './EquipamentoDetalhes.css'

function InfoItem({ titulo, valor }) {
  return (
    <div className="det-info-item">
      <span>{titulo}</span>
      <strong>{valor || 'Não informado'}</strong>
    </div>
  )
}

function formatarData(data) {
  if (!data) return 'Não informada'

  const dataValida = new Date(`${data}T00:00:00`)

  if (Number.isNaN(dataValida.getTime())) return data

  return dataValida.toLocaleDateString('pt-BR')
}

function formatarValor(valor) {
  if (valor === undefined || valor === null || valor === '') {
    return 'Não informado'
  }

  return Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function normalizarStatus(status) {
  const valor = (status || '').toLowerCase()

  if (valor.includes('conclu') || valor.includes('resolvido') || valor.includes('encerrado')) {
    return 'Concluída'
  }

  if (valor.includes('andamento') || valor.includes('atendimento')) {
    return 'Em andamento'
  }

  if (valor.includes('abert')) {
    return 'Aberta'
  }

  return status || 'Não informado'
}

function classeClassificacaoSaude(classificacao) {
  const valor = (classificacao || '').toLowerCase()

  if (valor === 'excelente') return 'det-score--excelente'
  if (valor === 'boa') return 'det-score--boa'
  if (valor === 'atenção' || valor === 'atencao') return 'det-score--atencao'

  return 'det-score--critica'
}

function formatarPontos(valor) {
  const pontos = Number(valor || 0)
  const sinal = pontos > 0 ? '+' : ''
  return `${sinal}${pontos.toLocaleString('pt-BR', {
    maximumFractionDigits: 2,
  })} pts`
}

function IconeEquipamento({ equipamento }) {
  const tipo = (
    equipamento?.tipo ||
    equipamento?.categoria ||
    equipamento?.nome ||
    ''
  )
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

  let icone

  if (tipo.includes('notebook') || tipo.includes('laptop')) {
    icone = (
      <>
        <rect x="5" y="4" width="14" height="12" rx="1.5" />
        <path d="M2 20h20l-2-4H4l-2 4Z" />
      </>
    )
  } else if (tipo.includes('impressora')) {
    icone = (
      <>
        <path d="M6 9V3h12v6" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <path d="M6 14h12v7H6z" />
        <path d="M18 12h.01" />
      </>
    )
  } else if (tipo.includes('servidor')) {
    icone = (
      <>
        <rect x="4" y="3" width="16" height="8" rx="2" />
        <rect x="4" y="13" width="16" height="8" rx="2" />
        <path d="M8 7h.01M8 17h.01" />
        <path d="M12 7h5M12 17h5" />
      </>
    )
  } else if (
  tipo.includes('computador') ||
  tipo.includes('desktop')
) {
  // Computador desktop: monitor + gabinete
  icone = (
    <>
      <rect x="2" y="4" width="13" height="11" rx="1.5" />
      <path d="M6 19h5M8.5 15v4" />

      <rect x="17" y="5" width="5" height="15" rx="1" />
      <circle cx="19.5" cy="17" r="0.7" />
    </>
  )
} else if (tipo.includes('monitor')) {
  // Monitor
  icone = (
    <>
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </>
  )
  } else if (
    tipo.includes('monitor') ||
    tipo.includes('computador') ||
    tipo.includes('desktop')
  ) {
    icone = (
      <>
        <rect x="3" y="4" width="18" height="13" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </>
    )
  } else {
    icone = (
      <>
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M8 9h8M8 13h8M8 17h4" />
      </>
    )
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icone}
    </svg>
  )
}

export default function EquipamentoDetalhes() {
  const { id } = useParams()

  const [equipamento, setEquipamento] = useState(null)
  const [setores, setSetores] = useState([])
  const [localizacoes, setLocalizacoes] = useState([])
  const [fornecedores, setFornecedores] = useState([])
  const [manutencoes, setManutencoes] = useState([])

  const [abaAtiva, setAbaAtiva] = useState('visao-geral')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true)
        setErro('')

        const [
          equipamentosData,
          setoresData,
          localizacoesData,
          fornecedoresData,
          manutencoesData,
        ] = await Promise.all([
          listarEquipamentos(),
          listarSetores(),
          listarLocalizacoes(),
          listarFornecedores(),
          listarManutencoes(),
        ])

        const equipamentoEncontrado = equipamentosData.find(
          (item) => String(item.id) === String(id)
        )

        if (!equipamentoEncontrado) {
          setErro('Equipamento não encontrado.')
          return
        }

        setEquipamento(equipamentoEncontrado)
        setSetores(setoresData)
        setLocalizacoes(localizacoesData)
        setFornecedores(fornecedoresData)

        const historico = manutencoesData
          .filter((item) => String(item.equipamentoId) === String(id))
          .sort((a, b) => new Date(b.data) - new Date(a.data))

        setManutencoes(historico)
      } catch (error) {
        console.error('Erro ao carregar detalhes do equipamento:', error)
        setErro('Não foi possível carregar os dados do equipamento.')
      } finally {
        setCarregando(false)
      }
    }

    carregarDados()
  }, [id])

  const dadosRelacionados = useMemo(() => {
    if (!equipamento) return {}

    return {
      setor: setores.find(
        (item) => String(item.id) === String(equipamento.setorId)
      ),
      localizacao: localizacoes.find(
        (item) => String(item.id) === String(equipamento.localizacaoId)
      ),
      fornecedor: fornecedores.find(
        (item) => String(item.id) === String(equipamento.fornecedorId)
      ),
    }
  }, [equipamento, setores, localizacoes, fornecedores])

  const resumoSaude = useMemo(() => {
    const total = manutencoes.length

    const abertas = manutencoes.filter(
      (item) => normalizarStatus(item.status) === 'Aberta'
    ).length

    const emAndamento = manutencoes.filter(
      (item) => normalizarStatus(item.status) === 'Em andamento'
    ).length

    const concluidas = manutencoes.filter(
      (item) => normalizarStatus(item.status) === 'Concluída'
    ).length

    return {
      total,
      abertas,
      emAndamento,
      concluidas,
      ultimaManutencao: manutencoes[0] || null,
    }
  }, [manutencoes])

  // O Score é calculado a partir do equipamento e de seu histórico atual.
  // Assim, qualquer manutenção registrada passa a refletir no resultado.
  const resumoScore = useMemo(
    () => calcularSaudeEquipamento(equipamento, manutencoes),
    [equipamento, manutencoes]
  )

  function classeStatus(status) {
    const valor = (status || '').toLowerCase()

    if (valor.includes('ativo') && !valor.includes('inativo')) {
      return 'det-status--ativo'
    }

    if (valor.includes('manutenção')) {
      return 'det-status--manutencao'
    }

    return 'det-status--inativo'
  }

  if (carregando) {
    return (
      <div className="detalhes-layout">
        <Sidebar />
        <main className="detalhes-conteudo">
          <p className="det-mensagem">Carregando dados do equipamento...</p>
        </main>
      </div>
    )
  }

  if (erro || !equipamento) {
    return (
      <div className="detalhes-layout">
        <Sidebar />
        <main className="detalhes-conteudo">
          <div className="det-erro">
            <h2>Não foi possível abrir o equipamento</h2>
            <p>{erro || 'Equipamento não encontrado.'}</p>
            <Link to="/equipamentos" className="det-botao-voltar">
              Voltar para equipamentos
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const statusEquipamento = equipamento.status || 'Não informado'
  const pontuacaoAntesDosLimites = Number(
    (100 + resumoScore.pontosPositivos - resumoScore.pontosNegativos).toFixed(2)
  )

  return (
    <div className="dash">
      <Sidebar />

      <main className="detalhes-conteudo">

        {/* Cabeçalho */}
        <div className="det-cabecalho">
        <div>
            <div className="det-breadcrumb">
            <Link to="/equipamentos">Equipamentos</Link>
            <span>/</span>
            <span>Detalhes</span>
            </div>

            <h1>Detalhes do equipamento</h1>
            <p>Consulte as informações e acompanhe a saúde do ativo.</p>
        </div>

        <div className="det-acoes-cabecalho">

            <button
            type="button"
            className="det-botao-historico"
            onClick={() => setAbaAtiva('historico')}
            >
            <svg width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <path d="M3 3v5h5" />
            <path d="M12 7v5l3 2" />
            </svg>
            Histórico
            </button>

            <Link
            to={`/equipamentos/${equipamento.id}/editar`}
            className="det-botao-editar"
            >
            <svg width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
            </svg>
            Editar
            </Link>

            <Link to="/equipamentos" className="det-botao-voltar">
            Voltar
            </Link>

        </div>
        </div>

        {/* Identificação principal */}
        <section className="det-card det-identificacao">
            <div className="det-equipamento-icone">
                <IconeEquipamento equipamento={equipamento} />
            </div>

          <div className="det-identificacao-texto">
            <span className="det-patrimonio">
              Patrimônio {equipamento.patrimonio || 'Não informado'}
            </span>

            <h2>{equipamento.nome || 'Equipamento sem nome'}</h2>

            <div className="det-identificacao-legenda">
              <span>{equipamento.marca || 'Marca não informada'}</span>
              <span>•</span>
              <span>{equipamento.modelo || equipamento.tipo || 'Modelo não informado'}</span>
            </div>
          </div>

          <span className={`det-status ${classeStatus(statusEquipamento)}`}>
            {statusEquipamento}
          </span>
        </section>

        {/* Informações do equipamento */}
        <section className="det-secao">
          <div className="det-titulo-secao">
            <div>
              <h2>Informações do equipamento</h2>
              <p>Dados cadastrais e informações do ativo.</p>
            </div>
          </div>

          <div className="det-grade-informacoes">

            <div className="det-card">
              <h3>Identificação</h3>
              <div className="det-info-grade">
                <InfoItem titulo="Patrimônio" valor={equipamento.patrimonio} />
                <InfoItem titulo="Nome" valor={equipamento.nome} />
                <InfoItem titulo="Categoria" valor={equipamento.categoria || equipamento.tipo} />
                <InfoItem titulo="Marca" valor={equipamento.marca} />
                <InfoItem titulo="Modelo" valor={equipamento.modelo} />
                <InfoItem titulo="Número de série" valor={equipamento.numeroSerie} />
              </div>
            </div>

            <div className="det-card">
              <h3>Localização</h3>
              <div className="det-info-grade">
                <InfoItem
                  titulo="Setor"
                  valor={dadosRelacionados.setor?.nome}
                />
                <InfoItem
                  titulo="Localização"
                  valor={dadosRelacionados.localizacao?.nome}
                />
              </div>
            </div>

            <div className="det-card">
              <h3>Aquisição</h3>
              <div className="det-info-grade">
                <InfoItem
                  titulo="Fornecedor"
                  valor={
                    dadosRelacionados.fornecedor?.nomeFantasia ||
                    dadosRelacionados.fornecedor?.nome
                  }
                />
                <InfoItem
                  titulo="Nota fiscal"
                  valor={equipamento.notaFiscal}
                />
                <InfoItem
                  titulo="Valor de aquisição"
                  valor={formatarValor(equipamento.valor)}
                />
                <InfoItem
                  titulo="Data de aquisição"
                  valor={formatarData(equipamento.dataAquisicao)}
                />
                <InfoItem
                  titulo="Garantia"
                  valor={formatarData(equipamento.garantia)}
                />
              </div>
            </div>

            <div className="det-card">
              <h3>Observações</h3>
              <p className="det-observacao">
                {equipamento.observacao || 'Nenhuma observação cadastrada para este equipamento.'}
              </p>
            </div>

          </div>
        </section>

        {/* Saúde do equipamento */}
        <section className="det-saude">

          <div className="det-saude-cabecalho">
            <div>
              <span className="det-sobretitulo">ACOMPANHAMENTO DO ATIVO</span>
              <h2>Saúde do equipamento</h2>
              <p>Acompanhe o histórico e os indicadores de conservação.</p>
            </div>
          </div>

          {/* Menu interno da saúde */}
          <nav className="det-menu-saude">
            <button
              className={abaAtiva === 'visao-geral' ? 'ativo' : ''}
              onClick={() => setAbaAtiva('visao-geral')}
            >
              Visão geral
            </button>

            <button
              className={abaAtiva === 'historico' ? 'ativo' : ''}
              onClick={() => setAbaAtiva('historico')}
            >
              Histórico
            </button>

            <button
              className={abaAtiva === 'manutencoes' ? 'ativo' : ''}
              onClick={() => setAbaAtiva('manutencoes')}
            >
              Manutenções
            </button>

            <button
              className={abaAtiva === 'vida-util' ? 'ativo' : ''}
              onClick={() => setAbaAtiva('vida-util')}
            >
              Vida útil
            </button>
          </nav>

          {/* Visão geral */}
          {abaAtiva === 'visao-geral' && (
            <div className="det-saude-conteudo">

              {/* Score de saúde calculado pelo serviço pontuacaoServico.js */}
              <section className={`det-score-painel ${classeClassificacaoSaude(resumoScore.classificacao)}`}>
                <div className="det-score-cabecalho">
                  <div>
                    <span className="det-score-sobretitulo">INDICADOR CALCULADO</span>
                    <h3>Pontuação de saúde</h3>
                    <p>
                      O resultado considera os impactos das manutenções registradas
                      para este equipamento.
                    </p>
                  </div>
                  <span className="det-score-classificacao">
                    {resumoScore.classificacao}
                  </span>
                </div>

                <div className="det-score-corpo">
                  <div
                    className="det-score-circulo"
                    style={{ '--score-percentual': `${resumoScore.pontuacao}%` }}
                    role="img"
                    aria-label={`Pontuação ${resumoScore.pontuacao} de 100: ${resumoScore.classificacao}`}
                  >
                    <div>
                      <strong>{resumoScore.pontuacao}</strong>
                      <span>/ 100</span>
                    </div>
                  </div>

                  <div className="det-score-resumo">
                    <div className="det-score-metrica">
                      <span>Base inicial</span>
                      <strong>100 pts</strong>
                    </div>
                    <div className="det-score-metrica positivo">
                      <span>Bônus positivos aplicados</span>
                      <strong>{formatarPontos(resumoScore.pontosPositivos)}</strong>
                    </div>
                    <div className="det-score-metrica negativo">
                      <span>Penalizações acumuladas</span>
                      <strong>{formatarPontos(-resumoScore.pontosNegativos)}</strong>
                    </div>
                    <div className="det-score-formula">
                      <span>Fórmula utilizada</span>
                      <strong>
                        100 + {Number(resumoScore.pontosPositivos).toLocaleString('pt-BR')}
                        {' - '}
                        {Number(resumoScore.pontosNegativos).toLocaleString('pt-BR')}
                        {' = '}
                        {pontuacaoAntesDosLimites.toLocaleString('pt-BR')} pontos
                      </strong>
                      <small>
                        Após arredondamento e aplicação dos limites de 0 a 100, o Score final é {resumoScore.pontuacao}.
                        O bônus positivo acumulado é limitado a 15 pontos.
                      </small>
                    </div>
                  </div>
                </div>

                {resumoScore.pontosPositivosBrutos > resumoScore.pontosPositivos && (
                  <p className="det-score-observacao">
                    Foram identificados {resumoScore.pontosPositivosBrutos} pontos positivos,
                    mas somente {resumoScore.pontosPositivos} foram aplicados devido ao limite
                    de bônus do modelo.
                  </p>
                )}
              </section>

              <section className="det-score-detalhamento">
                <div className="det-score-detalhamento-cabecalho">
                  <div>
                    <h3>Como cada manutenção afetou a saúde</h3>
                    <p>Impacto individual calculado conforme tipo, prioridade e situação.</p>
                  </div>
                  <span>{resumoScore.totalManutencoes} registros</span>
                </div>

                {resumoScore.detalhamento.length === 0 ? (
                  <div className="det-score-vazio">
                    <strong>Sem impactos registrados</strong>
                    <p>O equipamento permanece com 100 pontos até que existam manutenções que alterem sua saúde.</p>
                  </div>
                ) : (
                  <div className="det-score-lista">
                    {resumoScore.detalhamento.map((item, indice) => {
                      const manutencaoOriginal = manutencoes.find(
                        (manutencao) => String(manutencao.id) === String(item.manutencaoId)
                      )

                      return (
                        <article className="det-score-item" key={item.manutencaoId ?? indice}>
                          <div className="det-score-item-principal">
                            <div>
                              <strong>{item.tipo}</strong>
                              <span>
                                {formatarData(manutencaoOriginal?.data)} · Prioridade: {item.prioridade}
                              </span>
                            </div>
                            <strong className={`det-score-impacto ${item.pontos > 0 ? 'positivo' : item.pontos < 0 ? 'negativo' : 'neutro'}`}>
                              {formatarPontos(item.pontos)}
                            </strong>
                          </div>
                          <div className="det-score-item-rodape">
                            <span>Status: {item.status}</span>
                            <p>{item.motivo}</p>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                )}
              </section>

              <details className="det-score-regras">
                <summary>Consultar regras e pesos utilizados no cálculo</summary>
                <div className="det-score-regras-grade">
                  <article>
                    <strong>Manutenção corretiva</strong>
                    <p>Aberta: -10 / -20 / -30 pontos conforme prioridade baixa, média ou alta.</p>
                    <p>Em andamento: aplica 60% da penalização. Concluída: mantém 20% como histórico da falha.</p>
                  </article>
                  <article>
                    <strong>Manutenção preventiva</strong>
                    <p>Aberta: 0 ponto. Em andamento: +2 pontos. Concluída: +6 pontos.</p>
                    <p>O bônus é aplicado quando a ação está em andamento ou concluída.</p>
                  </article>
                  <article>
                    <strong>Troca de peça</strong>
                    <p>Aberta: -5 / -9 / -14 pontos conforme prioridade baixa, média ou alta.</p>
                    <p>Em andamento: aplica 60% da penalização. Concluída: +5 pontos.</p>
                  </article>
                  <article>
                    <strong>Atualização</strong>
                    <p>Aberta: 0 ponto. Em andamento: +1 ponto. Concluída: +3 pontos.</p>
                  </article>
                </div>
                <p className="det-score-regras-observacao">
                  O cálculo começa em 100 pontos. Os bônus positivos são limitados a 15 pontos
                  no total, e o resultado final fica entre 0 e 100. Registros sem prioridade
                  recebem prioridade média; status ausente ou desconhecido é tratado como aberto.
                  “Em análise” e “Aguardando peça” mantêm a penalização integral nas ações corretivas
                  e trocas pendentes.
                </p>
              </details>

              <div className="det-saude-resumo">
                <div className="det-card det-saude-principal">
                  <span className="det-card-legenda">Situação atual</span>

                  <div className="det-saude-situacao">
                    <span className={`det-saude-ponto ${classeStatus(statusEquipamento)}`} />
                    <strong>{statusEquipamento}</strong>
                  </div>

                  <p>
                    Situação baseada no status cadastrado para o equipamento.
                  </p>
                </div>

                <div className="det-card det-indicador">
                  <span>Total de manutenções</span>
                  <strong>{resumoSaude.total}</strong>
                  <small>Registros associados ao ativo</small>
                </div>

                <div className="det-card det-indicador">
                  <span>Manutenções abertas</span>
                  <strong>{resumoSaude.abertas}</strong>
                  <small>Pendentes de conclusão</small>
                </div>

                <div className="det-card det-indicador">
                  <span>Manutenções concluídas</span>
                  <strong>{resumoSaude.concluidas}</strong>
                  <small>Registros finalizados</small>
                </div>
              </div>

              <div className="det-saude-inferior">
                <div className="det-card">
                  <h3>Última manutenção</h3>

                  {resumoSaude.ultimaManutencao ? (
                    <>
                      <strong>
                        {resumoSaude.ultimaManutencao.tipoManutencao || 'Manutenção'}
                      </strong>
                      <p>
                        {resumoSaude.ultimaManutencao.descricaoProblema ||
                          'Sem descrição cadastrada.'}
                      </p>
                      <small>
                        {formatarData(resumoSaude.ultimaManutencao.data)}
                      </small>
                    </>
                  ) : (
                    <p>Nenhuma manutenção registrada.</p>
                  )}
                </div>

                <div className="det-card">
                  <h3>Indicadores futuros</h3>
                  <div className="det-indicador-futuro">
                    <span>Próxima manutenção</span>
                    <strong>Não definida</strong>
                  </div>
                  <div className="det-indicador-futuro">
                    <span>Vida útil estimada</span>
                    <strong>Não cadastrada</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Histórico */}
          {abaAtiva === 'historico' && (
            <div className="det-card det-conteudo-aba">
              <h3>Histórico do equipamento</h3>

              {manutencoes.length === 0 ? (
                <p>Nenhum registro encontrado para este equipamento.</p>
              ) : (
                <div className="det-tabela-container">
                  <table className="det-tabela">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Tipo</th>
                        <th>Descrição</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {manutencoes.map((item) => (
                        <tr key={item.id}>
                          <td>{formatarData(item.data)}</td>
                          <td>{item.tipoManutencao || 'Não informado'}</td>
                          <td>{item.descricaoProblema || 'Sem descrição'}</td>
                          <td>{normalizarStatus(item.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Manutenções */}
          {abaAtiva === 'manutencoes' && (
            <div className="det-card det-conteudo-aba">
              <div className="det-aba-cabecalho">
                <div>
                  <h3>Manutenções registradas</h3>
                  <p>Registros vinculados a este equipamento.</p>
                </div>

                <Link
                  to="/manutencao/nova"
                  className="det-botao-adicionar"
                >
                  + Nova manutenção
                </Link>
              </div>

              {manutencoes.length === 0 ? (
                <p>Nenhuma manutenção cadastrada.</p>
              ) : (
                <div className="det-lista-manutencoes">
                  {manutencoes.map((item) => (
                    <div className="det-manutencao-item" key={item.id}>
                      <div>
                        <strong>{item.tipoManutencao || 'Manutenção'}</strong>
                        <p>{item.descricaoProblema || 'Sem descrição cadastrada.'}</p>
                        <small>{formatarData(item.data)}</small>
                      </div>

                      <span className="det-manutencao-status">
                        {normalizarStatus(item.status)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Vida útil */}
          {abaAtiva === 'vida-util' && (
            <div className="det-card det-conteudo-aba">
              <h3>Vida útil do equipamento</h3>

              <p>
                Esta área permitirá acompanhar a estimativa de vida útil,
                tempo de utilização e previsão de substituição do equipamento.
              </p>

              <div className="det-vida-util-grade">
                <div>
                  <span>Data de aquisição</span>
                  <strong>{formatarData(equipamento.dataAquisicao)}</strong>
                </div>

                <div>
                  <span>Tempo de garantia</span>
                  <strong>{formatarData(equipamento.garantia)}</strong>
                </div>

                <div>
                  <span>Vida útil estimada</span>
                  <strong>Não cadastrada</strong>
                </div>

                <div>
                  <span>Previsão de substituição</span>
                  <strong>Não definida</strong>
                </div>
              </div>
            </div>
          )}

        </section>

      </main>
    </div>
  )
}
