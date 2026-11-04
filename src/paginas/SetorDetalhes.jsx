
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Sidebar from '../componentes/Sidebar'

import { listarSetores } from '../servicos/setorServico'
import { listarEquipamentos } from '../servicos/equipamentoServico'
import { listarLocalizacoes } from '../servicos/localizacaoServico'

import './Home.css'
import './SetorDetalhes.css'

function classeStatus(status) {
  if (status === 'Ativo') return 'sd-status sd-status--ativo'
  return 'sd-status sd-status--inativo'
}

export default function SetorDetalhes() {
  const { id } = useParams()

  const [setor, setSetor] = useState(null)
  const [equipamentos, setEquipamentos] = useState([])
  const [localizacoes, setLocalizacoes] = useState([])

  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true)
        setErro('')

        const [
          dadosSetores,
          dadosEquipamentos,
          dadosLocalizacoes,
        ] = await Promise.all([
          listarSetores(),
          listarEquipamentos(),
          listarLocalizacoes(),
        ])

        const setorEncontrado = dadosSetores.find(
          (item) => String(item.id) === String(id)
        )

        if (!setorEncontrado) {
          throw new Error('Setor não encontrado.')
        }

        setSetor(setorEncontrado)

        setEquipamentos(
          dadosEquipamentos.filter(
            (equipamento) =>
              Number(equipamento.setorId) === Number(id)
          )
        )

        setLocalizacoes(
          dadosLocalizacoes.filter(
            (localizacao) =>
              Number(localizacao.setorId) === Number(id)
          )
        )
      } catch (error) {
        console.error('Erro ao carregar detalhes do setor:', error)
        setErro(error.message || 'Não foi possível carregar os dados do setor.')
      } finally {
        setCarregando(false)
      }
    }

    carregarDados()
  }, [id])

  const equipamentosAtivos = useMemo(
    () =>
      equipamentos.filter(
        (equipamento) => equipamento.status === 'Ativo'
      ).length,
    [equipamentos]
  )

  if (carregando) {
    return (
      <div className="dash">
        <Sidebar ativo="Cadastro" abertoInicial="Cadastro" />
        <main className="dash-conteudo">
          <h2 className="dash-titulo">Detalhes do Setor</h2>
          <p>Carregando informações do setor...</p>
        </main>
      </div>
    )
  }

  if (erro || !setor) {
    return (
      <div className="dash">
        <Sidebar ativo="Cadastro" abertoInicial="Cadastro" />
        <main className="dash-conteudo">
          <h2 className="dash-titulo">Detalhes do Setor</h2>

          <p className="sd-erro">
            {erro || 'Setor não encontrado.'}
          </p>

          <Link to="/setores" className="sd-voltar">
            Voltar para setores
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="dash">
      <Sidebar ativo="Cadastro" abertoInicial="Cadastro" />

      <main className="dash-conteudo sd-conteudo">
        {/* Cabeçalho */}
        <div className="sd-cabecalho">
          <div>
            <div className="sd-breadcrumb">
              <Link to="/setores">Setores</Link>
              <span>/</span>
              <span>Detalhes</span>
            </div>

            <h2 className="dash-titulo">Detalhes do Setor</h2>
          </div>

          <div className="sd-acoes">
            <Link
              to={`/setores/${setor.id}/editar`}
              className="sd-editar"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
              </svg>
              Editar
            </Link>

            <Link to="/setores" className="sd-voltar">
              Voltar
            </Link>
          </div>
        </div>

        {/* Identificação do setor */}
        <section className="sd-identificacao">
          <div className="sd-icone">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 21h18" />
              <path d="M5 21V7l8-4v18" />
              <path d="M13 10h6v11" />
              <path d="M8 9v.01M8 12v.01M8 15v.01M8 18v.01" />
              <path d="M16 14v.01M16 17v.01" />
            </svg>
          </div>

          <div className="sd-identificacao-info">
            <span className="sd-identificacao-label">
              Setor #{setor.id}
            </span>

            <h1>{setor.nome}</h1>

            <span className={classeStatus(setor.status)}>
              {setor.status}
            </span>
          </div>
        </section>

        {/* Indicadores */}
        <section className="sd-indicadores">
          <article className="sd-indicador">
            <div className="sd-indicador-icone sd-icone-equipamentos">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="4" width="18" height="13" rx="2" />
                <path d="M8 21h8M12 17v4" />
              </svg>
            </div>

            <div>
              <span>Total de equipamentos</span>
              <strong>{equipamentos.length}</strong>
            </div>
          </article>

          <article className="sd-indicador">
            <div className="sd-indicador-icone sd-icone-ativos">
                <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                >
                <circle cx="12" cy="12" r="9" />
                <path d="m8.5 12 2.3 2.3 4.8-5" />
                </svg>
            </div>

            <div>
              <span>Equipamentos ativos</span>
              <strong>{equipamentosAtivos}</strong>
            </div>
          </article>

          <article className="sd-indicador">
            <div className="sd-indicador-icone sd-icone-localizacoes">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
            </div>

            <div>
              <span>Localizações</span>
              <strong>{localizacoes.length}</strong>
            </div>
          </article>
        </section>

        {/* Informações gerais */}
        <section className="sd-card">
          <div className="sd-titulo-secao">
            <div>
              <h3>Informações do setor</h3>
              <p>Dados gerais e identificação do setor.</p>
            </div>
          </div>

          <div className="sd-informacoes">
            <div className="sd-info-item">
              <span>Nome do setor</span>
              <strong>{setor.nome || '-'}</strong>
            </div>

            <div className="sd-info-item">
              <span>Código de identificação</span>
              <strong>#{setor.id}</strong>
            </div>

            <div className="sd-info-item">
              <span>Status</span>
              <strong className={classeStatus(setor.status)}>
                {setor.status || '-'}
              </strong>
            </div>

            <div className="sd-info-item sd-info-descricao">
              <span>Descrição</span>
              <strong>{setor.descricao || 'Nenhuma descrição cadastrada.'}</strong>
            </div>
          </div>
        </section>

        {/* Equipamentos vinculados */}
        <section className="sd-card sd-card-equipamentos">
          <div className="sd-titulo-secao">
            <div>
              <h3>Equipamentos vinculados</h3>
              <p>Equipamentos cadastrados neste setor.</p>
            </div>

            <span className="sd-contador">
              {equipamentos.length} {equipamentos.length === 1 ? 'equipamento' : 'equipamentos'}
            </span>
          </div>

          <div className="sd-tabela-caixa">
            <table>
              <thead>
                <tr>
                  <th>Patrimônio</th>
                  <th>Equipamento</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {equipamentos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="sd-vazio">
                      Nenhum equipamento vinculado a este setor.
                    </td>
                  </tr>
                ) : (
                  equipamentos.map((equipamento) => (
                    <tr key={equipamento.id}>
                      <td>{equipamento.patrimonio || '-'}</td>
                      <td>{equipamento.nome || '-'}</td>
                      <td>{equipamento.tipo || '-'}</td>
                      <td>
                        <span
                          className={
                            equipamento.status === 'Ativo'
                              ? 'sd-status sd-status--ativo'
                              : equipamento.status === 'Em manutenção'
                                ? 'sd-status sd-status--manutencao'
                                : 'sd-status sd-status--inativo'
                          }
                        >
                          {equipamento.status || '-'}
                        </span>
                      </td>
                      <td className="sd-coluna-acao">
                        <Link
                          to={`/equipamentos/${equipamento.id}`}
                          className="sd-link-detalhes"
                        >
                          Ver detalhes
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}
