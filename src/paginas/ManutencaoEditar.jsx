
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Sidebar from '../componentes/sidebar'

import {
  listarManutencoes,
  atualizarManutencao,
} from '../servicos/manutencaoServico'

import { listarEquipamentos } from '../servicos/equipamentoServico'

import './css/Home.css'
import './css/EquipamentoNovo.css'

const tiposManutencao = [
  'Corretiva',
  'Preventiva',
  'Preditiva',
]

const prioridades = [
  'Baixa',
  'Média',
  'Alta',
]

const statusOpcoes = [
  'Aberta',
  'Em Andamento',
  'Em Análise',
  'Aguardando peça',
  'Concluída',
]

const formularioVazio = {
  equipamentoId: '',
  tipoManutencao: '',
  data: '',
  descricaoProblema: '',
  observacao: '',
  prioridade: 'Média',
  solicitante: '',
  status: 'Aberta',
}

// Componente de campo
function Campo({
  rotulo,
  nome,
  valor,
  onChange,
  tipo = 'text',
  opcoes = [],
  obrigatorio = false,
  className = '',
  ...resto
}) {
  let controle

  if (tipo === 'select') {
    controle = (
      <select
        name={nome}
        value={valor}
        onChange={onChange}
        required={obrigatorio}
        {...resto}
      >
        <option value="">Selecione</option>

        {opcoes.map((opcao) => {
          const valorOpcao =
            typeof opcao === 'object' ? opcao.value : opcao

          const textoOpcao =
            typeof opcao === 'object' ? opcao.label : opcao

          return (
            <option key={valorOpcao} value={valorOpcao}>
              {textoOpcao}
            </option>
          )
        })}
      </select>
    )
  } else if (tipo === 'textarea') {
    controle = (
      <textarea
        name={nome}
        value={valor}
        onChange={onChange}
        required={obrigatorio}
        rows={4}
        {...resto}
      />
    )
  } else {
    controle = (
      <input
        type={tipo}
        name={nome}
        value={valor}
        onChange={onChange}
        required={obrigatorio}
        autoComplete="off"
        {...resto}
      />
    )
  }

  return (
    <label className={`nv-campo ${className}`}>
      <span className="nv-rotulo">
        {rotulo}
        {obrigatorio && <b className="nv-obrigatorio"> *</b>}
      </span>

      {controle}
    </label>
  )
}

export default function ManutencaoEditar() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [form, setForm] = useState(formularioVazio)
  const [equipamentos, setEquipamentos] = useState([])

  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  // Carrega manutenção e equipamentos
  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true)
        setErro('')

        const [manutencoesData, equipamentosData] = await Promise.all([
          listarManutencoes(),
          listarEquipamentos(),
        ])

        const manutencao = manutencoesData.find(
          (item) => String(item.id) === String(id)
        )

        if (!manutencao) {
          throw new Error('Manutenção não encontrada.')
        }

        setEquipamentos(equipamentosData)

        // Preenche o formulário com os dados existentes
        setForm({
          ...formularioVazio,
          ...manutencao,

          equipamentoId: manutencao.equipamentoId != null
            ? String(manutencao.equipamentoId)
            : '',

          tipoManutencao: manutencao.tipoManutencao ?? '',
          data: manutencao.data ?? '',
          descricaoProblema: manutencao.descricaoProblema ?? '',
          observacao: manutencao.observacao ?? '',
          prioridade: manutencao.prioridade ?? 'Média',
          solicitante: manutencao.solicitante ?? '',
          status: manutencao.status ?? 'Aberta',
        })
      } catch (error) {
        console.error('Erro ao carregar manutenção:', error)
        setErro(error.message || 'Não foi possível carregar a manutenção.')
      } finally {
        setCarregando(false)
      }
    }

    carregarDados()
  }, [id])

  // Atualiza os campos
  function alterar(evento) {
    const { name, value } = evento.target

    setForm((atual) => ({
      ...atual,
      [name]: value,
    }))
  }

  // Salva as alterações
  async function salvar(evento) {
    evento.preventDefault()

    try {
      setSalvando(true)
      setErro('')

      const manutencaoAtualizada = {
        equipamentoId: Number(form.equipamentoId),
        tipoManutencao: form.tipoManutencao,
        data: form.data,
        descricaoProblema: form.descricaoProblema.trim(),
        observacao: form.observacao.trim(),
        prioridade: form.prioridade,
        solicitante: form.solicitante.trim(),
        status: form.status,
      }

      await atualizarManutencao(id, manutencaoAtualizada)

      navigate(`/manutencoes/${id}`)
    } catch (error) {
      console.error('Erro ao atualizar manutenção:', error)
      setErro('Não foi possível salvar as alterações. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  const campo = (nome) => ({
    nome,
    valor: form[nome],
    onChange: alterar,
  })

  return (
    <div className="dash">
      <Sidebar ativo="Manutenção" />

      <main className="dash-conteudo">
        <h2 className="dash-titulo">Editar Manutenção</h2>

        <p>
          Atualize as informações e o andamento deste chamado.
        </p>

        {carregando ? (
          <p>Carregando dados da manutenção...</p>
        ) : erro && !form.descricaoProblema && !form.equipamentoId ? (
          <div className="nv-erro" role="alert">
            {erro}

            <button
              type="button"
              className="nv-cancelar"
              onClick={() => navigate('/manutencoes')}
            >
              Voltar
            </button>
          </div>
        ) : (
          <>
            {erro && (
              <p className="nv-erro" role="alert">
                {erro}
              </p>
            )}

            <form className="nv-form" onSubmit={salvar}>
              <div className="nv-campos">

                <Campo
                  rotulo="Equipamento:"
                  tipo="select"
                  opcoes={equipamentos.map((equipamento) => ({
                    value: equipamento.id,
                    label: `${equipamento.patrimonio || 'Sem patrimônio'} - ${equipamento.nome}`,
                  }))}
                  obrigatorio
                  {...campo('equipamentoId')}
                />

                <Campo
                  rotulo="Tipo de Manutenção:"
                  tipo="select"
                  opcoes={tiposManutencao}
                  obrigatorio
                  {...campo('tipoManutencao')}
                />

                <Campo
                  rotulo="Data de Abertura:"
                  tipo="date"
                  obrigatorio
                  {...campo('data')}
                />

                <Campo
                  rotulo="Prioridade:"
                  tipo="select"
                  opcoes={prioridades}
                  obrigatorio
                  {...campo('prioridade')}
                />

                <Campo
                  rotulo="Solicitante:"
                  obrigatorio
                  {...campo('solicitante')}
                />

                <Campo
                  rotulo="Status:"
                  tipo="select"
                  opcoes={statusOpcoes}
                  obrigatorio
                  {...campo('status')}
                />

                <Campo
                  rotulo="Descrição do Problema:"
                  tipo="textarea"
                  className="nv-campo--largo"
                  obrigatorio
                  {...campo('descricaoProblema')}
                />

                <Campo
                  rotulo="Observações:"
                  tipo="textarea"
                  className="nv-campo--largo"
                  {...campo('observacao')}
                />

              </div>

              <aside className="nv-lateral">
                <section className="nv-fiscal">
                  <h3>Resumo da manutenção:</h3>

                  <Campo
                    rotulo="Número do chamado:"
                    valor={`#${id}`}
                    nome="numeroChamado"
                    onChange={() => {}}
                    disabled
                  />

                  <Campo
                    rotulo="Equipamento selecionado:"
                    valor={
                      equipamentos.find(
                        (item) => String(item.id) === form.equipamentoId
                      )?.nome || 'Selecione um equipamento'
                    }
                    nome="equipamentoResumo"
                    onChange={() => {}}
                    disabled
                  />

                  <Campo
                    rotulo="Prioridade atual:"
                    valor={form.prioridade || 'Não definida'}
                    nome="prioridadeResumo"
                    onChange={() => {}}
                    disabled
                  />
                </section>

                <div className="nv-acoes">
                  <button
                    type="button"
                    className="nv-cancelar"
                    onClick={() => navigate(`/manutencoes/${id}`)}
                    disabled={salvando}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="nv-salvar"
                    disabled={salvando}
                  >
                    {salvando ? 'Salvando...' : 'Salvar alterações'}
                  </button>
                </div>
              </aside>
            </form>
          </>
        )}
      </main>
    </div>
  )
}
