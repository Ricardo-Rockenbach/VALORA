
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Sidebar from '../componentes/sidebar'
import { listarEquipamentos } from '../servicos/equipamentoServico'
import { listarSetores } from '../servicos/setorServico'
import {
  listarManutencoes,
  cadastrarManutencao,
} from '../servicos/manutencaoServico'
import './css/Home.css'
import './css/ManutencaoNova.css'

const prioridades = ['Baixa', 'Média', 'Alta']
const tiposManutencao = ['Corretiva', 'Preventiva', 'Troca de peça', 'Atualização']

const formularioInicial = () => ({
  prioridade: '',
  tipo: '',
  data: new Date().toLocaleDateString('sv-SE'),
  solicitante: '',
  descricao: '',
  observacao: '',
})

// "2026-11-02" -> "02/11/2026"
function formatarData(iso) {
  if (!iso) return '-'

  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

function formatarStatus(status) {
  if (!status) return 'Não informado'

  const valor = status
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

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

  return equivalencias[valor] || status
}

function Icone({ nome, tamanho = 18 }) {
  const formas = {
    busca: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </>
    ),
    documento: (
      <>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5M9 13h6M9 17h6" />
      </>
    ),
    seta: <path d="M5 12h14M13 6l6 6-6 6" />,
  }

  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {formas[nome]}
    </svg>
  )
}

// Um campo do formulário: rótulo + input, select ou textarea.
function Campo({
  rotulo,
  nome,
  valor,
  onChange,
  tipo = 'text',
  opcoes = [],
  obrigatorio = false,
  className = '',
}) {
  let controle

  if (tipo === 'select') {
    controle = (
      <select
        name={nome}
        value={valor}
        onChange={onChange}
        required={obrigatorio}
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
      />
    )
  }

  return (
    <label className={`nm-campo ${className}`}>
      <span className="nm-rotulo">
        {rotulo}
        {obrigatorio && <b className="nm-obrigatorio"> *</b>}
      </span>

      {controle}
    </label>
  )
}

export default function ManutencaoNova() {
  const navigate = useNavigate()
  const caixaBuscaRef = useRef(null)
  const inputBuscaRef = useRef(null)

  const [textoBusca, setTextoBusca] = useState('')
  const [listaAberta, setListaAberta] = useState(false)
  const [selecionado, setSelecionado] = useState(null)
  const [erroEquipamento, setErroEquipamento] = useState('')
  const [form, setForm] = useState(formularioInicial)

  const [equipamentos, setEquipamentos] = useState([])
  const [setores, setSetores] = useState([])
  const [historico, setHistorico] = useState([])

  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  // Carrega equipamentos, setores e histórico da API.
  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true)
        setErro('')

        const [
          dadosEquipamentos,
          dadosSetores,
          dadosManutencoes,
        ] = await Promise.all([
          listarEquipamentos(),
          listarSetores(),
          listarManutencoes(),
        ])

        // Relaciona cada equipamento ao nome do seu setor.
        const equipamentosComSetor = dadosEquipamentos.map((equipamento) => {
          const setor = dadosSetores.find(
            (s) => Number(s.id) === Number(equipamento.setorId)
          )

          return {
            ...equipamento,
            setor: setor?.nome || '-',
            categoria: equipamento.categoria || equipamento.tipo || '-',
          }
        })

        setEquipamentos(equipamentosComSetor)
        setSetores(dadosSetores)
        setHistorico(dadosManutencoes)
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        setErro('Não foi possível carregar os dados. Verifique a conexão com a API.')
      } finally {
        setCarregando(false)
      }
    }

    carregarDados()
  }, [])

  // Fecha a lista de resultados ao clicar fora da caixa de busca.
  useEffect(() => {
    function aoClicarFora(evento) {
      if (
        caixaBuscaRef.current &&
        !caixaBuscaRef.current.contains(evento.target)
      ) {
        setListaAberta(false)
      }
    }

    document.addEventListener('mousedown', aoClicarFora)

    return () => document.removeEventListener('mousedown', aoClicarFora)
  }, [])

  // Resultados da busca nos equipamentos carregados da API.
  const resultados = useMemo(() => {
    const termo = textoBusca.trim().toLowerCase()

    if (!termo) return []

    return equipamentos
      .filter((e) =>
        [
          e.patrimonio,
          e.nome,
          e.marca,
          e.modelo,
          e.numeroSerie,
          e.setor,
          e.categoria,
          e.tipo,
        ].some((campo) =>
          String(campo || '').toLowerCase().includes(termo)
        )
      )
      .slice(0, 6)
  }, [textoBusca, equipamentos])

  // Últimas manutenções reais do equipamento escolhido.
  const ultimas = useMemo(() => {
    if (!selecionado) return []

    return historico
      .filter(
        (h) => Number(h.equipamentoId) === Number(selecionado.id)
      )
      .sort((a, b) => (b.data || '').localeCompare(a.data || ''))
      .slice(0, 2)
  }, [selecionado, historico])

  function digitarBusca(evento) {
    setTextoBusca(evento.target.value)
    setListaAberta(true)
    setSelecionado(null)
    setErroEquipamento('')
  }

  function escolherEquipamento(equipamento) {
    setSelecionado(equipamento)

    setTextoBusca(
      `${equipamento.patrimonio} - ${equipamento.nome}`
    )

    setListaAberta(false)
    setErroEquipamento('')
  }

  function alterar(evento) {
    const { name, value } = evento.target

    setForm((atual) => ({
      ...atual,
      [name]: value,
    }))
  }

  async function salvar(evento) {
    evento.preventDefault()

    if (!selecionado) {
      setErroEquipamento('Busque e selecione um equipamento.')
      inputBuscaRef.current?.focus()
      return
    }

    try {
      setSalvando(true)
      setErro('')

      // Estrutura enviada para o JSON Server.
      const novaManutencao = {
        equipamentoId: Number(selecionado.id),
        tipoManutencao: form.tipo,
        data: form.data,
        descricaoProblema: form.descricao.trim(),
        observacao: form.observacao.trim(),
        prioridade: form.prioridade,
        solicitante: form.solicitante.trim(),
        status: 'Aberta',
      }

      await cadastrarManutencao(novaManutencao)

      // Após cadastrar, retorna à listagem.
      navigate('/manutencoes')
    } catch (error) {
      console.error('Erro ao cadastrar manutenção:', error)
      setErro('Não foi possível salvar a manutenção. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  const campo = (nome) => ({
    nome,
    valor: form[nome],
    onChange: alterar,
  })

  // Dados vazios enquanto nenhum equipamento é escolhido.
  const exibido = selecionado ?? {
    nome: '-',
    patrimonio: '-',
    numeroSerie: '-',
    modelo: '-',
    categoria: '-',
    setor: '-',
    marca: '-',
    status: '-',
  }

  return (
    <div className="dash">
      <Sidebar ativo="Manutenção" />

      <main className="dash-conteudo nm-conteudo">
        <h2 className="dash-titulo">Nova Manutenção</h2>

        {carregando ? (
          <p>Carregando equipamentos...</p>
        ) : erro && equipamentos.length === 0 ? (
          <p className="nm-erro" role="alert">
            {erro}
          </p>
        ) : (
          <form className="nm-form" onSubmit={salvar}>
            <div className="nm-principal">
              {/* ---------- Equipamento ---------- */}
              <section>
                <h3 className="nm-subtitulo">Equipamento:</h3>

                <div className="nm-busca-caixa" ref={caixaBuscaRef}>
                  <div className="nm-busca">
                    <Icone nome="busca" tamanho={16} />

                    <input
                      ref={inputBuscaRef}
                      type="search"
                      value={textoBusca}
                      onChange={digitarBusca}
                      onFocus={() => setListaAberta(true)}
                      placeholder="Buscar, patrimônio, nome"
                      aria-label="Buscar equipamento"
                      role="combobox"
                      aria-expanded={listaAberta && textoBusca.trim() !== ''}
                      aria-controls="nm-resultados"
                      autoComplete="off"
                    />
                  </div>

                  {listaAberta &&
                    textoBusca.trim() !== '' &&
                    !selecionado && (
                      <ul
                        className="nm-resultados"
                        id="nm-resultados"
                        role="listbox"
                      >
                        {resultados.length === 0 && (
                          <li className="nm-resultados-vazio">
                            Nenhum equipamento encontrado.
                          </li>
                        )}

                        {resultados.map((e) => (
                          <li key={e.id}>
                            <button
                              type="button"
                              onClick={() => escolherEquipamento(e)}
                            >
                              <strong>
                                {e.patrimonio} - {e.nome}
                              </strong>

                              <small>
                                {e.categoria} · {e.setor}
                              </small>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                </div>

                {erroEquipamento && (
                  <p className="nm-erro" role="alert">
                    {erroEquipamento}
                  </p>
                )}

                <div
                  className={`nm-card-equipamento ${
                    selecionado ? '' : 'nm-card-equipamento--oculto'
                  }`}
                  aria-hidden={!selecionado}
                >
                  <h4>{exibido.nome}</h4>

                  <p className="nm-meta">
                    <span>patrimônio: {exibido.patrimonio}</span>
                    <span>Nº de Série: {exibido.numeroSerie}</span>
                    <span>Modelo: {exibido.modelo}</span>
                  </p>

                  <div className="nm-tags">
                    <div className="nm-tag">
                      <span className="nm-tag-rotulo">Categoria</span>
                      <strong>{exibido.categoria}</strong>
                    </div>

                    <div className="nm-tag">
                      <span className="nm-tag-rotulo">Setor</span>
                      <strong>{exibido.setor}</strong>
                    </div>

                    <div className="nm-tag">
                      <span className="nm-tag-rotulo">Marca</span>
                      <strong>{exibido.marca}</strong>
                    </div>

                    <div className="nm-tag">
                      <span className="nm-tag-rotulo">Status</span>
                      <strong>{exibido.status}</strong>
                    </div>
                  </div>
                </div>
              </section>

              {/* ---------- Dados da manutenção ---------- */}
              <section>
                <h3 className="nm-subtitulo">Dados da Manutenção:</h3>

                <div className="nm-campos">
                  <Campo
                    rotulo="Prioridade"
                    tipo="select"
                    opcoes={prioridades}
                    obrigatorio
                    {...campo('prioridade')}
                  />

                  <Campo
                    rotulo="Tipo da Manutenção"
                    tipo="select"
                    opcoes={tiposManutencao}
                    obrigatorio
                    {...campo('tipo')}
                  />

                  <Campo
                    rotulo="Data"
                    tipo="date"
                    obrigatorio
                    {...campo('data')}
                  />

                  <Campo
                    rotulo="Solicitante"
                    obrigatorio
                    {...campo('solicitante')}
                  />

                  <Campo
                    rotulo="Descrição do Problema"
                    tipo="textarea"
                    obrigatorio
                    {...campo('descricao')}
                  />

                  <Campo
                    rotulo="Observação"
                    tipo="textarea"
                    {...campo('observacao')}
                  />
                </div>
              </section>
            </div>

            {/* ---------- Coluna lateral ---------- */}
            <aside className="nm-lateral">
              {selecionado && (
                <section
                  className="nm-ultimas"
                  aria-label="Últimas manutenções do equipamento"
                >
                  <h3>
                    <Icone nome="documento" tamanho={20} />
                    Últimas Manutenções
                  </h3>

                  <div className="nm-ultimas-corpo">
                    {ultimas.length === 0 && (
                      <p className="nm-ultimas-vazio">
                        Nenhuma manutenção registrada para este equipamento.
                      </p>
                    )}

                    {ultimas.map((h) => (
                      <article
                        key={h.id}
                        className="nm-ultima-item"
                      >
                        <strong>
                          {formatarData(h.data)} · {h.tipoManutencao}
                        </strong>

                        <span>{h.descricaoProblema}</span>

                        <small>{formatarStatus(h.status)}</small>
                      </article>
                    ))}

                    <Link
                      to={`/manutencoes?busca=${encodeURIComponent(
                        selecionado.patrimonio
                      )}`}
                      className="nm-ver-todas"
                    >
                      Ver todas

                      <span className="nm-ver-todas-seta">
                        <Icone nome="seta" tamanho={18} />
                      </span>
                    </Link>
                  </div>
                </section>
              )}

              {erro && (
                <p className="nm-erro" role="alert">
                  {erro}
                </p>
              )}

              <div className="nm-acoes">
                <button
                  type="button"
                  className="nm-cancelar"
                  onClick={() => navigate('/manutencoes')}
                  disabled={salvando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="nm-salvar"
                  disabled={salvando}
                >
                  {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </aside>
          </form>
        )}
      </main>
    </div>
  )
}
