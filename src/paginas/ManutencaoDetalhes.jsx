
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {Wrench, Plus, Pencil, Trash2 } from 'lucide-react'

import Sidebar from '../componentes/sidebar'

import { listarManutencoes } from '../servicos/manutencaoServico'
import { listarEquipamentos } from '../servicos/equipamentoServico'
import {listarTarefas, cadastrarTarefa, atualizarTarefa, excluirTarefa, } from '../servicos/tarefaServico'

import './css/Home.css'
import './css/EquipamentoDetalhes.css'
import './css/ManutencaoDetalhes.css'

function normalizar(texto = '') {
  return String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function formatarStatus(status) {
  const valor = normalizar(status)

  const equivalencias = {
    aberta: 'Aberta',
    aberto: 'Aberta',
    'em andamento': 'Em Andamento',
    'em atendimento': 'Em Andamento',
    'em analise': 'Em Análise',
    'aguardando peca': 'Aguardando peça',
    concluida: 'Concluída',
    resolvido: 'Concluída',
    encerrado: 'Concluída',
  }

  return equivalencias[valor] || status || 'Não informado'
}

function formatarData(data) {
  if (!data) return 'Não informada'

  const [ano, mes, dia] = String(data).split('-')

  if (!ano || !mes || !dia) return data

  return `${dia}/${mes}/${ano}`
}

function classeStatus(status) {
  const classes = {
    Aberta: 'md-status--aberta',
    'Em Andamento': 'md-status--andamento',
    'Em Análise': 'md-status--analise',
    'Aguardando peça': 'md-status--aguardando',
    Concluída: 'md-status--concluida',
  }

  return classes[status] || ''
}

function classePrioridade(prioridade) {
  const classes = {
    Alta: 'md-prioridade--alta',
    Média: 'md-prioridade--media',
    Baixa: 'md-prioridade--baixa',
  }

  return classes[prioridade] || ''
}

function Info({ titulo, valor }) {
  return (
    <div className="md-info">
      <span>{titulo}</span>
      <strong>{valor || 'Não informado'}</strong>
    </div>
  )
}





export default function ManutencaoDetalhes() {
  const { id } = useParams()

  const [manutencao, setManutencao] = useState(null)
  const [equipamento, setEquipamento] = useState(null)

  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  // Controle das tarefas
  const [mostrarTarefa, setMostrarTarefa] = useState(false)
  const [novaTarefa, setNovaTarefa] = useState('')
  const [tarefas, setTarefas] = useState([])
  const [tarefaEditando, setTarefaEditando] = useState(null)

  const [salvandoTarefa, setSalvandoTarefa] = useState(false)
  const [erroTarefa, setErroTarefa] = useState('')
  const [excluindoTarefa, setExcluindoTarefa] = useState(null)

  // Carrega manutenção, equipamento e tarefas
  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true)
        setErro('')

        const [
          manutencoesData,
          equipamentosData,
          tarefasData,
        ] = await Promise.all([
          listarManutencoes(),
          listarEquipamentos(),
          listarTarefas(id),
        ])

        const encontrada = manutencoesData.find(
          (item) => String(item.id) === String(id)
        )

        if (!encontrada) {
          setManutencao(null)
          setEquipamento(null)
          setTarefas([])
          setErro('Manutenção não encontrada.')
          return
        }

        const equipamentoRelacionado = equipamentosData.find(
          (item) =>
            Number(item.id) === Number(encontrada.equipamentoId)
        )

        setManutencao(encontrada)
        setEquipamento(equipamentoRelacionado || null)
        setTarefas(Array.isArray(tarefasData) ? tarefasData : [])

      } catch (error) {
        console.error('Erro ao carregar detalhes da manutenção:', error)
        setErro('Não foi possível carregar os dados da manutenção.')
      } finally {
        setCarregando(false)
      }
    }

    carregarDados()
  }, [id])

  // Abre modal para uma nova tarefa
  function abrirNovaTarefa() {
    setTarefaEditando(null)
    setNovaTarefa('')
    setErroTarefa('')
    setMostrarTarefa(true)
  }

  // Abre modal para alterar uma tarefa existente
  function abrirEdicaoTarefa(tarefa) {
    setTarefaEditando(tarefa)
    setNovaTarefa(tarefa.descricao)
    setErroTarefa('')
    setMostrarTarefa(true)
  }

  // Salva nova tarefa ou alteração na API
  async function salvarTarefa() {
    const descricao = novaTarefa.trim()

    if (!descricao || !manutencao || salvandoTarefa) return

    try {
      setSalvandoTarefa(true)
      setErroTarefa('')

      if (tarefaEditando) {
        const tarefaAtualizada = await atualizarTarefa(
          tarefaEditando.id,
          { descricao }
        )

        setTarefas((anterior) =>
          anterior.map((tarefa) =>
            tarefa.id === tarefaEditando.id
              ? { ...tarefa, ...tarefaAtualizada, descricao }
              : tarefa
          )
        )

      } else {
        const tarefaCriada = await cadastrarTarefa({
          manutencaoId: Number(manutencao.id),
          descricao,
          dataCriacao: new Date().toISOString().slice(0, 10),
        })

        setTarefas((anterior) => [
          ...anterior,
          tarefaCriada,
        ])
      }

      setNovaTarefa('')
      setTarefaEditando(null)
      setMostrarTarefa(false)

    } catch (error) {
      console.error('Erro ao salvar tarefa:', error)
      setErroTarefa(
        'Não foi possível salvar a tarefa. Tente novamente.'
      )
    } finally {
      setSalvandoTarefa(false)
    }
  }

  // Exclui tarefa da API
  async function removerTarefa(tarefa) {
    if (excluindoTarefa !== null) return

    const confirmar = window.confirm(
      `Deseja realmente excluir a tarefa "${tarefa.descricao}"?`
    )

    if (!confirmar) return

    try {
      setExcluindoTarefa(tarefa.id)

      await excluirTarefa(tarefa.id)

      setTarefas((anterior) =>
        anterior.filter((item) => item.id !== tarefa.id)
      )

    } catch (error) {
      console.error('Erro ao excluir tarefa:', error)
      alert('Não foi possível excluir a tarefa. Tente novamente.')
    } finally {
      setExcluindoTarefa(null)
    }
  }

  // Fecha o modal
  function fecharModal() {
    if (salvandoTarefa) return

    setMostrarTarefa(false)
    setNovaTarefa('')
    setTarefaEditando(null)
    setErroTarefa('')
  }

  if (carregando) {
    return (
      <div className="dash">
        <Sidebar ativo="Manutenção" />

        <main className="dash-conteudo">
          <p>Carregando dados da manutenção...</p>
        </main>
      </div>
    )
  }

  if (erro || !manutencao) {
    return (
      <div className="dash">
        <Sidebar ativo="Manutenção" />

        <main className="dash-conteudo">
          <div className="md-erro">
            <h2>Não foi possível abrir a manutenção</h2>
            <p>{erro || 'Manutenção não encontrada.'}</p>

            <Link to="/manutencoes" className="md-botao-voltar">
              Voltar para manutenções
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const status = formatarStatus(manutencao.status)

  return (
    <div className="dash">
      <Sidebar ativo="Manutenção" />

      <main className="dash-conteudo md-conteudo">

        {/* Cabeçalho */}
        <header className="md-cabecalho">
          <div>
            <div className="md-breadcrumb">
              <Link to="/manutencoes">Manutenções</Link>
              <span>/</span>
              <span>Detalhes</span>
            </div>

            <h2 className="dash-titulo">
              Detalhes da manutenção
            </h2>

          </div>

          <div className="md-acoes-cabecalho">
            <Link
              to={`/manutencoes/${manutencao.id}/editar`}
              className="md-botao-alterar"
            >
              <Pencil size={16} strokeWidth={2} />
              Alterar
            </Link>

            <button
              type="button"
              className="md-botao-tarefa"
              onClick={abrirNovaTarefa}
            >
              <Plus size={16} strokeWidth={2} />
              Adicionar tarefa
            </button>

            <Link
              to="/manutencoes"
              className="md-botao-voltar"
            >
              Voltar
            </Link>
          </div>
        </header>

        {/* Identificação */}
        <section className="md-identificacao">
          <div className="md-icone">
            <Wrench size={30} strokeWidth={1.7} />
          </div>

          <div className="md-identificacao-texto">
            <span>CHAMADO #{manutencao.id}</span>

            <h2>
              {equipamento?.nome || 'Equipamento não encontrado'}
            </h2>

            <p>
              {equipamento?.patrimonio
                ? `Patrimônio: ${equipamento.patrimonio}`
                : 'Patrimônio não informado'}
            </p>
          </div>

          <span className={`md-status ${classeStatus(status)}`}>
            {status}
          </span>
        </section>

        {/* Resumo */}
        <section className="md-resumo">
          <div className="md-card-resumo">
            <span>Tipo de manutenção</span>
            <strong>
              {manutencao.tipoManutencao || 'Não informado'}
            </strong>
          </div>

          <div className="md-card-resumo">
            <span>Prioridade</span>
            <strong className={classePrioridade(manutencao.prioridade)}>
              {manutencao.prioridade || 'Não informada'}
            </strong>
          </div>

          <div className="md-card-resumo">
            <span>Data de abertura</span>
            <strong>{formatarData(manutencao.data)}</strong>
          </div>

          <div className="md-card-resumo">
            <span>Solicitante</span>
            <strong>
              {manutencao.solicitante || 'Não informado'}
            </strong>
          </div>
        </section>

        {/* Informações da manutenção */}
        <section className="md-secao">
          <div className="md-titulo-secao">
            <h2>Informações da manutenção</h2>
          </div>

          <div className="md-card">
            <div className="md-grade-info">
              <Info
                titulo="Número do chamado"
                valor={`#${manutencao.id}`}
              />

              <Info
                titulo="Tipo"
                valor={manutencao.tipoManutencao}
              />

              <Info
                titulo="Prioridade"
                valor={manutencao.prioridade}
              />

              <Info
                titulo="Data de abertura"
                valor={formatarData(manutencao.data)}
              />

              <Info
                titulo="Solicitante"
                valor={manutencao.solicitante}
              />

              <Info
                titulo="Status"
                valor={status}
              />
            </div>
          </div>
        </section>

        {/* Equipamento relacionado */}
        <section className="md-secao">
          <div className="md-titulo-secao">
            <h2>Equipamento relacionado</h2>
          </div>

          <div className="md-card">
            {equipamento ? (
              <>
                <div className="md-grade-info">
                  <Info
                    titulo="Equipamento"
                    valor={equipamento.nome}
                  />

                  <Info
                    titulo="Patrimônio"
                    valor={equipamento.patrimonio}
                  />

                  <Info
                    titulo="Categoria"
                    valor={equipamento.tipo}
                  />

                  <Info
                    titulo="Marca"
                    valor={equipamento.marca}
                  />

                  <Info
                    titulo="Modelo"
                    valor={equipamento.modelo}
                  />

                  <Info
                    titulo="Número de série"
                    valor={equipamento.numeroSerie}
                  />
                </div>

                <div className="md-link-equipamento">
                  <Link to={`/equipamentos/${equipamento.id}`}>
                    Consultar equipamento
                  </Link>
                </div>
              </>
            ) : (
              <p>O equipamento vinculado não foi encontrado.</p>
            )}
          </div>
        </section>

        {/* Descrição do problema */}
        <section className="md-secao">
          <div className="md-titulo-secao">
            <h2>Descrição do problema</h2>
          </div>

          <div className="md-card md-texto-card">
            <p>
              {manutencao.descricaoProblema ||
                'Nenhuma descrição cadastrada.'}
            </p>
          </div>
        </section>

        {/* Observações */}
        <section className="md-secao">
          <div className="md-titulo-secao">
            <h2>Observações</h2>
          </div>

          <div className="md-card md-texto-card">
            <p>
              {manutencao.observacao ||
                'Nenhuma observação cadastrada.'}
            </p>
          </div>
        </section>

        {/* Tarefas */}
        <section className="md-secao">
          <div className="md-titulo-secao">
            <h2>Tarefas da manutenção</h2>
          </div>

          <div className="md-card md-tarefas">
            <div className="md-tarefas-cabecalho">
              <strong>
                Atividades registradas ({tarefas.length})
              </strong>

              <button
                type="button"
                className="md-botao-tarefa"
                onClick={abrirNovaTarefa}
              >
                <Plus size={16} strokeWidth={2} />
                Adicionar tarefa
              </button>
            </div>

            {tarefas.length === 0 ? (
              <p className="md-tarefas-vazio">
                Nenhuma tarefa adicionada a esta manutenção.
              </p>
            ) : (
              <div className="md-lista-tarefas">
                {tarefas.map((tarefa) => (
                  <div
                    className="md-tarefa-item"
                    key={tarefa.id}
                  >
                    <div className="md-tarefa-descricao">
                      <span>{tarefa.descricao}</span>

                      <small>
                        Adicionada em {formatarData(tarefa.dataCriacao)}
                      </small>
                    </div>

                    <div className="md-tarefa-acoes">
                      <button
                        type="button"
                        className="md-tarefa-botao md-tarefa-editar"
                        onClick={() => abrirEdicaoTarefa(tarefa)}
                        title="Alterar tarefa"
                        disabled={excluindoTarefa !== null}
                      >
                        <Pencil size={16} strokeWidth={2} />
                        Alterar
                      </button>

                      <button
                        type="button"
                        className="md-tarefa-botao md-tarefa-excluir"
                        onClick={() => removerTarefa(tarefa)}
                        title="Excluir tarefa"
                        disabled={excluindoTarefa !== null}
                      >
                        <Trash2 size={16} strokeWidth={1.8} />
                        {excluindoTarefa === tarefa.id
                          ? 'Excluindo...'
                          : 'Excluir'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Modal de adicionar ou alterar tarefa */}
        {mostrarTarefa && (
          <div
            className="md-modal-fundo"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) fecharModal()
            }}
          >
            <div
              className="md-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="md-modal-titulo"
            >
              <h2 id="md-modal-titulo">
                {tarefaEditando
                  ? 'Alterar tarefa'
                  : 'Adicionar tarefa'}
              </h2>

              <p>
                {tarefaEditando
                  ? 'Altere a descrição da atividade.'
                  : 'Descreva a atividade que deverá ser realizada nesta manutenção.'}
              </p>

              <label
                className="md-modal-label"
                htmlFor="descricao-tarefa"
              >
                Descrição da tarefa
              </label>

              <textarea
                id="descricao-tarefa"
                value={novaTarefa}
                onChange={(e) => setNovaTarefa(e.target.value)}
                placeholder="Ex.: Verificar funcionamento do equipamento..."
                rows={4}
                autoFocus
                disabled={salvandoTarefa}
              />

              {erroTarefa && (
                <p className="md-erro-tarefa">
                  {erroTarefa}
                </p>
              )}

              <div className="md-modal-acoes">
                <button
                  type="button"
                  className="md-botao-voltar"
                  onClick={fecharModal}
                  disabled={salvandoTarefa}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="md-botao-tarefa"
                  onClick={salvarTarefa}
                  disabled={!novaTarefa.trim() || salvandoTarefa}
                >
                  {tarefaEditando ? (
                    <Pencil size={16} strokeWidth={2} />
                  ) : (
                    <Plus size={16} strokeWidth={2} />
                  )}

                  {salvandoTarefa
                    ? 'Salvando...'
                    : tarefaEditando
                      ? 'Salvar alterações'
                      : 'Adicionar'}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
