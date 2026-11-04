
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Sidebar from '../componentes/sidebar'

import { listarLocalizacoes, atualizarLocalizacao } from '../servicos/localizacaoServico'
import { listarSetores } from '../servicos/setorServico'

// Utiliza o mesmo CSS da edição de equipamentos
import './css/Home.css'
import './css/EquipamentoNovo.css'

// Opções de status
const statusOpcoes = ['Ativo', 'Inativo']

// Formulário vazio
const formularioVazio = {
  nome: '',
  setorId: '',
  descricao: '',
  status: 'Ativo',
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

export default function LocalizacaoEditar() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [form, setForm] = useState(formularioVazio)
  const [setores, setSetores] = useState([])

  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  // Carrega os dados da localização e dos setores
  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true)
        setErro('')

        const [localizacoes, setoresData] = await Promise.all([
          listarLocalizacoes(),
          listarSetores(),
        ])

        const localizacao = localizacoes.find(
          (item) => String(item.id) === String(id)
        )

        if (!localizacao) {
          throw new Error('Localização não encontrada.')
        }

        setSetores(setoresData)

        // Preenche o formulário com os dados existentes
        setForm({
          ...formularioVazio,
          nome: localizacao.nome ?? '',
          setorId: String(localizacao.setorId ?? ''),
          descricao: localizacao.descricao ?? '',
          status: localizacao.status ?? 'Ativo',
        })
      } catch (error) {
        console.error('Erro ao carregar localização:', error)
        setErro(
          error.message || 'Não foi possível carregar a localização.'
        )
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

  // Salva as alterações na API
  async function salvar(evento) {
    evento.preventDefault()

    if (!form.nome.trim()) {
      setErro('Informe o nome da localização.')
      return
    }

    if (!form.setorId) {
      setErro('Selecione um setor para a localização.')
      return
    }

    try {
      setSalvando(true)
      setErro('')

      const localizacaoAtualizada = {
        nome: form.nome.trim(),
        setorId: Number(form.setorId),
        descricao: form.descricao.trim(),
        status: form.status,
      }

      await atualizarLocalizacao(id, localizacaoAtualizada)

      navigate(`/localizacoes/${id}`)
    } catch (error) {
      console.error('Erro ao atualizar localização:', error)
      setErro(
        'Não foi possível salvar as alterações. Tente novamente.'
      )
    } finally {
      setSalvando(false)
    }
  }

  // Prepara os valores dos campos
  const campo = (nome) => ({
    nome,
    valor: form[nome],
    onChange: alterar,
  })

  const setoresOpcoes = setores.map((setor) => ({
    value: String(setor.id),
    label: setor.nome,
  }))

  return (
    <div className="dash">
      <Sidebar ativo="Cadastro" />

      <main className="dash-conteudo">
        <h2 className="dash-titulo">Editar Localização</h2>

        {carregando ? (
          <p>Carregando dados da localização...</p>
        ) : erro && !form.nome ? (
          <div className="nv-erro" role="alert">
            {erro}

            <button
              type="button"
              className="nv-cancelar"
              onClick={() => navigate('/localizacoes')}
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
                  rotulo="Nome da Localização:"
                  obrigatorio
                  {...campo('nome')}
                />

                <Campo
                  rotulo="Setor:"
                  tipo="select"
                  opcoes={setoresOpcoes}
                  obrigatorio
                  {...campo('setorId')}
                />

                <Campo
                  rotulo="Descrição:"
                  tipo="textarea"
                  className="nv-campo--largo"
                  {...campo('descricao')}
                />

              </div>

              <aside className="nv-lateral">
                <section className="nv-fiscal">
                  <h3>Configurações da Localização:</h3>

                  <Campo
                    rotulo="Status:"
                    tipo="select"
                    opcoes={statusOpcoes}
                    obrigatorio
                    {...campo('status')}
                  />
                </section>

                <div className="nv-acoes">
                  <button
                    type="button"
                    className="nv-cancelar"
                    onClick={() => navigate(`/localizacoes/${id}`)}
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
