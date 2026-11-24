import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, ChevronDown} from "lucide-react";

import Sidebar from '../componentes/sidebar'



import { listarEquipamentos } from '../servicos/equipamentoServico'
import { listarSetores } from '../servicos/setorServico'
import { listarFornecedores } from '../servicos/fornecedorServico'



import './css/Home.css' // layout, cards e sidebar compartilhados
import './css/Equipamentos.css'



const classeStatus = {
  Ativo: 'eq-status--ativo',
  'Em manutenção': 'eq-status--manutencao',
  Inativo: 'eq-status--inativo',
}




function Filtro({ rotulo, valor, onChange, opcoes }) {
  return (
    <label className="eq-filtro">

      <span className="eq-filtro-rotulo">
        {rotulo}
      </span>

      <select
        value={valor}
        onChange={(e) => onChange(e.target.value)}
      >
        {opcoes.map((opcao) => (
          <option
            key={opcao}
            value={opcao === 'Todos' ? '' : opcao}
          >
            {opcao}
          </option>
        ))}
      </select>

      <span className="eq-filtro-seta">
        <ChevronDown size={16} />
      </span>

    </label>
  )
}



export default function Equipamentos() {
  const [equipamentos, setEquipamentos] = useState([])
  const [setores, setSetores] = useState([])
  const [fornecedores, setFornecedores] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState('')
  const [tipo, setTipo] = useState('')

  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true)
        setErro('')

        const [dadosEquipamentos, dadosSetores] = await Promise.all([
          listarEquipamentos(),
          listarSetores(),
        ])

        setEquipamentos(dadosEquipamentos)
        setSetores(dadosSetores)

      } catch (error) {
        console.error(error)
        setErro('Não foi possível carregar os equipamentos.')
      } finally {
        setCarregando(false)
      }
    }

    carregarDados()
  }, [])

  useEffect(() => {
  async function carregarFornecedores() {
    try {
      const dados = await listarFornecedores()
      setFornecedores(dados)
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error)
    }
  }

  carregarFornecedores()
}, [])

// Filtragem dos equipamentos
// Filtragem dos equipamentos
const listaFiltrada = useMemo(() => {

  const termo = busca.trim().toLowerCase()

  return equipamentos
    .map((e) => {

      const setor = setores.find(
        (s) => Number(s.id) === Number(e.setorId)
      )

      return {
        ...e,
        setorNome: setor?.nome || 'Setor não encontrado',
      }
    })

    .filter((e) => {

      const bateStatus =
        !status || e.status === status

      const bateTipo =
        !tipo || e.tipo === tipo

      const bateBusca =
        !termo ||
        [
          e.patrimonio,
          e.nome,
          e.setorNome,
          e.tipo,
          e.marca,
        ].some((campo) =>
          String(campo ?? '').toLowerCase().includes(termo)
        )

      return (
        bateStatus &&
        bateTipo &&
        bateBusca
      )
    })

}, [equipamentos, setores, busca, status, tipo])

      // Cards de resumo
      const resumo = [
        {
          rotulo: 'Total de equipamentos',
          valor: equipamentos.length,
          cor: 'laranja',
        },
        {
          rotulo: 'Ativos',
          valor: equipamentos.filter((e) => e.status === 'Ativo').length,
          cor: 'verde',
        },
        {
          rotulo: 'Em manutenção',
          valor: equipamentos.filter((e) => e.status === 'Em manutenção').length,
          cor: 'amarelo',
        },
        {
          rotulo: 'Inativos',
          valor: equipamentos.filter((e) => e.status === 'Inativo').length,
          cor: 'vermelho',
        },
      ]

  return (
    <div className="dash">
      <Sidebar ativo="Cadastro" abertoInicial="Cadastro" />

      <main className="dash-conteudo">
        <header className="eq-cabecalho">
          <h2 className="dash-titulo">Equipamentos</h2>
          <Link className="eq-adicionar" to="/equipamentos/novo">
            Adicionar
          </Link>
        </header>
        {/* Cards de resumo */}
        <section className="eq-cards" aria-label="Resumo dos equipamentos">
          {resumo.map((c) => (
            <div key={c.rotulo} className={`eq-card dash-card--${c.cor}`}>
              <strong>{c.valor}</strong>
              <span>{c.rotulo}</span>
            </div>
          ))}
        </section>
          {/* Busca e Filtros */}
        <section className="eq-filtros" aria-label="Filtros">
          <label className="eq-busca">
            <Search size={18} />
            <input
              type="search"
              placeholder="buscar"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </label>

          <Filtro
            rotulo="Tipo"
            valor={tipo}
            onChange={setTipo}
            opcoes={[
              'Todos',
              ...new Set(
                equipamentos
                  .map((e) => e.tipo)
                  .filter(Boolean)
              ),
            ]}
          />
            <Filtro
              rotulo="Status"
              valor={status}
              onChange={setStatus}
              opcoes={['Todos', 'Ativo', 'Em manutenção', 'Inativo']}
            />

            <button
              type="button"
              className="eq-limpar-filtros"
              onClick={() => {
                setBusca('')
                setStatus('')
                setTipo('')
              }}
            >
              Limpar filtros
            </button>
        </section>
          {/* Tabela de Equipamentos */}
        <div className="eq-tabela-caixa">
          <table>
            <thead>
              <tr>
                <th>Patrimônio</th>
                <th>Equipamento</th>
                <th>Setor</th>
                <th>Tipo</th>
                <th>Marca</th>
                <th>Status</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
                {carregando ? (
                  <tr>
                    <td colSpan={7} className="eq-vazio">
                      Carregando equipamentos...
                    </td>
                  </tr>
                ) : erro ? (
                  <tr>
                    <td colSpan={7} className="eq-vazio">
                      {erro}
                    </td>
                  </tr>
                ) : listaFiltrada.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="eq-vazio">
                      Nenhum equipamento encontrado.
                    </td>
                  </tr>
                ) : (
                  listaFiltrada.map((e) => (
                    <tr key={e.id}>
                      <td>{e.patrimonio}</td>
                      <td>{e.nome}</td>
                      <td>{e.setorNome}</td>
                      <td>{e.tipo}</td>
                      <td>{e.marca}</td>
                      <td className={classeStatus[e.status]}>{e.status}</td>
                      <td className="eq-coluna-acao">
                        <Link
                          to={`/equipamentos/${e.id}`}
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
    </div>
  )
}
