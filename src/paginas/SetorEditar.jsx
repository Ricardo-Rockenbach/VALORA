
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Sidebar from '../componentes/sidebar'

import { listarSetores, atualizarSetor } from '../servicos/setorServico'

// Utiliza o mesmo CSS da edição de equipamentos
import './Home.css'
import './EquipamentoNovo.css'

// Opções de status
const statusOpcoes = ['Ativo', 'Inativo']

// Formulário vazio
const formularioVazio = {
  nome: '',
  descricao: '',
  status: 'Ativo',
}

// Componente de campo (mesmo padrão de EquipamentoEditar)
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

        {opcoes.map((opcao) => (
          <option key={opcao} value={opcao}>
            {opcao}
          </option>
        ))}
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

export default function SetorEditar() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [form, setForm] = useState(formularioVazio)

  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  // Carrega os dados do setor
  useEffect(() => {
    async function carregarSetor() {
      try {
        setCarregando(true)
        setErro('')

        const setores = await listarSetores()

        const setor = setores.find(
          (item) => String(item.id) === String(id)
        )

        if (!setor) {
          throw new Error('Setor não encontrado.')
        }

        // Preenche o formulário com os dados existentes
        setForm({
          ...formularioVazio,
          nome: setor.nome ?? '',
          descricao: setor.descricao ?? '',
          status: setor.status ?? 'Ativo',
        })
      } catch (error) {
        console.error('Erro ao carregar setor:', error)
        setErro(error.message || 'Não foi possível carregar o setor.')
      } finally {
        setCarregando(false)
      }
    }

    carregarSetor()
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
      setErro('Informe o nome do setor.')
      return
    }

    try {
      setSalvando(true)
      setErro('')

      const setorAtualizado = {
        nome: form.nome.trim(),
        descricao: form.descricao.trim(),
        status: form.status,
      }

      await atualizarSetor(id, setorAtualizado)

      navigate(`/setores/${id}`)
    } catch (error) {
      console.error('Erro ao atualizar setor:', error)
      setErro('Não foi possível salvar as alterações. Tente novamente.')
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

  return (
    <div className="dash">
      <Sidebar ativo="Cadastro" />

      <main className="dash-conteudo">
        <h2 className="dash-titulo">Editar Setor</h2>

        {carregando ? (
          <p>Carregando dados do setor...</p>
        ) : erro && !form.nome ? (
          <div className="nv-erro" role="alert">
            {erro}

            <button
              type="button"
              className="nv-cancelar"
              onClick={() => navigate('/setores')}
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
                  rotulo="Nome do Setor:"
                  obrigatorio
                  {...campo('nome')}
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
                  <h3>Configurações do Setor:</h3>

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
                    onClick={() => navigate(`/setores/${id}`)}
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
