import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from '../componentes/sidebar'
import { listarSetores, cadastrarSetor } from '../servicos/setorServico'
import { listarLocalizacoes } from '../servicos/localizacaoServico'
import './css/Home.css' // layout e sidebar compartilhados (o mesmo CSS do Equipamentos.jsx)
import './css/Localizacoes.css'



const statusOpcoes = ['Ativo', 'Inativo']

const classeStatus = {
  Ativo: 'lc-status--ativo',
  Inativo: 'lc-status--inativo',
}

const formularioVazio = {
  nome: '',
  setorId: '',
  descricao: '',
  status: 'Ativo',
}

export default function Localizacoes() {
  const [localizacoes, setLocalizacoes] = useState([])
  const [setores, setSetores] = useState([])

  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  const [busca, setBusca] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState(formularioVazio)

    // Carrega localizações e setores da API
    useEffect(() => {
      async function carregarDados() {
        try {
          setCarregando(true)
          setErro('')

          const [dadosLocalizacoes, dadosSetores] = await Promise.all([
            listarLocalizacoes(),
            listarSetores(),
          ])

          setLocalizacoes(dadosLocalizacoes)
          setSetores(dadosSetores)
        } catch (error) {
          console.error('Erro ao carregar localizações:', error)
          setErro('Não foi possível carregar as localizações.')
        } finally {
          setCarregando(false)
        }
      }

      carregarDados()
    }, [])

      // Relaciona cada localização ao seu setor
    const listaFiltrada = useMemo(() => {
      const termo = busca.trim().toLowerCase()

      return localizacoes
        .map((localizacao) => {
          const setor = setores.find(
            (s) => Number(s.id) === Number(localizacao.setorId)
          )

          return {
            ...localizacao,
            setorNome: setor?.nome || 'Setor não encontrado',
          }
        })
        .filter((localizacao) => {
          return (
            !termo ||
            [
              localizacao.id,
              localizacao.nome,
              localizacao.setorNome,
            ].some((campo) =>
              String(campo ?? '').toLowerCase().includes(termo)
            )
          )
        })
    }, [localizacoes, setores, busca])

    function fecharModal() {
      setModalAberto(false)
      setForm(formularioVazio)
    }

    // Fecha o modal com a tecla Esc
    useEffect(() => {
      if (!modalAberto) return

      function aoTeclar(evento) {
        if (evento.key === 'Escape') fecharModal()
      }

      window.addEventListener('keydown', aoTeclar)

      return () => window.removeEventListener('keydown', aoTeclar)
    }, [modalAberto])

    function alterar(evento) {
      const { name, value } = evento.target

      setForm((atual) => ({
        ...atual,
        [name]: value,
      }))
    }

    // Cadastra a localização na API
    async function salvar(evento) {
      evento.preventDefault()

      try {
        setSalvando(true)
        setErro('')

        const novaLocalizacao = {
          nome: form.nome.trim(),
          setorId: Number(form.setorId),
          descricao: form.descricao.trim(),
          status: form.status,
        }

        const localizacaoCriada = await cadastrarLocalizacao(novaLocalizacao)

        setLocalizacoes((atual) => [
          ...atual,
          localizacaoCriada,
        ])

        fecharModal()
      } catch (error) {
        console.error('Erro ao cadastrar localização:', error)
        setErro('Não foi possível cadastrar a localização.')
      } finally {
        setSalvando(false)
      }
    } 

  return (
  <div className="dash">
      <Sidebar ativo="Cadastro" abertoInicial="Cadastro" />

      <main className="dash-conteudo">
        <h2 className="dash-titulo">Localizações</h2>

        <div className="lc-barra">
          <label className="lc-busca">
            <input
              type="search"
              placeholder="Buscar"
              aria-label="Buscar localização"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </label>

          <button
            type="button"
            className="lc-adicionar"
            onClick={() => setModalAberto(true)}
            disabled={setores.length === 0}
          >
            Adicionar
          </button>
        </div>

        <div className="lc-tabela-caixa">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Setor</th>
                <th>Descrição</th>
                <th>Status</th>
                <th aria-label="Ações" />
              </tr>
            </thead>

            <tbody>
              {carregando ? (
                <tr>
                  <td colSpan={4} className="lc-vazio">
                    Carregando localizações...
                  </td>
                </tr>
              ) : erro && localizacoes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="lc-vazio">
                    {erro}
                  </td>
                </tr>
              ) : listaFiltrada.length === 0 ? (
                <tr>
                  <td colSpan={4} className="lc-vazio">
                    Nenhuma localização encontrada.
                  </td>
                </tr>
              ) : (
                listaFiltrada.map((l) => (
                  <tr key={l.id}>
                    <td>{l.id}</td>
                    <td>{l.nome}</td>
                    <td>{l.setorNome}</td>
                    <td>{l.descricao || '-'}</td>
                    <td className={classeStatus[l.status]}>
                      {l.status}
                    </td>
                    <td className="lc-coluna-acao">
                      <Link
                        to={`/localizacoes/${l.id}`}
                        className="dash-ver-detalhes"
                      >
                        Ver Detalhes
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {modalAberto && (
        <div
          className="lc-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) fecharModal()
          }}
        >
          <div
            className="lc-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lc-modal-titulo"
          >
            <h3 id="lc-modal-titulo">Adicionar Localização</h3>

            
            <form onSubmit={salvar}>
              <label className="lc-campo">
                <span>Nome</span>
                <input
                  name="nome"
                  value={form.nome}
                  onChange={alterar}
                  required
                  autoFocus
                  autoComplete="off"
                  placeholder="Ex.: Sala de Servidores"
                />
              </label>

              <label className="lc-campo">
                <span>Setor</span>
                <select
                  name="setorId"
                  value={form.setorId}
                  onChange={alterar}
                  required
                >
                  <option value="">Selecione um setor</option>
                  {setores.map((setor) => (
                    <option key={setor.id} value={setor.id}>
                      {setor.nome}
                    </option>
                  ))}
                </select>
              </label>

              <label className="lc-campo">
                <span>Descrição</span>
                <textarea
                  name="descricao"
                  rows={3}
                  value={form.descricao}
                  onChange={alterar}
                  placeholder="Descreva a localização"
                />
              </label>

              <label className="lc-campo lc-campo--status">
                <span>Status</span>
                <select
                  name="status"
                  value={form.status}
                  onChange={alterar}
                >
                  {statusOpcoes.map((opcao) => (
                    <option key={opcao} value={opcao}>
                      {opcao}
                    </option>
                  ))}
                </select>
              </label>

              <div className="lc-modal-acoes">
                <button
                  type="button"
                  className="lc-cancelar"
                  onClick={fecharModal}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="lc-salvar"
                  disabled={salvando}
                >
                  {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}