
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Sidebar from '../componentes/sidebar'

import { listarFornecedores } from '../servicos/fornecedorServico'
import { listarEquipamentos } from '../servicos/equipamentoServico'

import './css/Home.css'
import './css/EquipamentoDetalhes.css'

function InfoItem({ titulo, valor }) {
  return (
    <div className="det-info-item">
      <span>{titulo}</span>
      <strong>{valor || 'Não informado'}</strong>
    </div>
  )
}

function IconeFornecedor() {
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
      <rect x="3" y="7" width="18" height="14" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 12h18" />
      <path d="M10 12v2h4v-2" />
    </svg>
  )
}

function classeStatus(status) {
  const valor = (status || '').toLowerCase()

  if (valor === 'ativo') {
    return 'det-status--ativo'
  }

  return 'det-status--inativo'
}

function formatarCnpj(cnpj) {
  if (!cnpj) return 'Não informado'

  const numeros = String(cnpj).replace(/\D/g, '')

  if (numeros.length !== 14) return cnpj

  return numeros.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  )
}

export default function FornecedorDetalhes() {
  const { id } = useParams()

  const [fornecedor, setFornecedor] = useState(null)
  const [equipamentos, setEquipamentos] = useState([])

  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  // Carrega os dados do fornecedor e dos equipamentos
  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true)
        setErro('')

        const [fornecedoresData, equipamentosData] = await Promise.all([
          listarFornecedores(),
          listarEquipamentos(),
        ])

        const fornecedorEncontrado = fornecedoresData.find(
          (item) => String(item.id) === String(id)
        )

        if (!fornecedorEncontrado) {
          setErro('Fornecedor não encontrado.')
          return
        }

        setFornecedor(fornecedorEncontrado)
        setEquipamentos(equipamentosData)
      } catch (error) {
        console.error('Erro ao carregar detalhes do fornecedor:', error)
        setErro('Não foi possível carregar os dados do fornecedor.')
      } finally {
        setCarregando(false)
      }
    }

    carregarDados()
  }, [id])

  // Filtra os equipamentos vinculados ao fornecedor
  const equipamentosFornecedor = useMemo(() => {
    if (!fornecedor) return []

    return equipamentos.filter(
      (item) => String(item.fornecedorId) === String(fornecedor.id)
    )
  }, [fornecedor, equipamentos])

  const resumo = useMemo(() => {
    const ativos = equipamentosFornecedor.filter(
      (item) => (item.status || '').toLowerCase() === 'ativo'
    ).length

    return {
      total: equipamentosFornecedor.length,
      ativos,
      inativos: equipamentosFornecedor.length - ativos,
    }
  }, [equipamentosFornecedor])

  if (carregando) {
    return (
      <div className="detalhes-layout">
        <Sidebar />
        <main className="detalhes-conteudo">
          <p className="det-mensagem">
            Carregando dados do fornecedor...
          </p>
        </main>
      </div>
    )
  }

  if (erro || !fornecedor) {
    return (
      <div className="detalhes-layout">
        <Sidebar />
        <main className="detalhes-conteudo">
          <div className="det-erro">
            <h2>Não foi possível abrir o fornecedor</h2>
            <p>{erro || 'Fornecedor não encontrado.'}</p>

            <Link to="/fornecedores" className="det-botao-voltar">
              Voltar para fornecedores
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const statusFornecedor = fornecedor.status || 'Não informado'

  return (
    <div className="dash">
      <Sidebar />

      <main className="detalhes-conteudo">

        {/* Cabeçalho */}
        <div className="det-cabecalho">
          <div>
            <div className="det-breadcrumb">
              <Link to="/fornecedores">Fornecedores</Link>
              <span>/</span>
              <span>Detalhes</span>
            </div>

            <h1>Detalhes do fornecedor</h1>
            <p>
              Consulte os dados cadastrais e os equipamentos vinculados a este fornecedor.
            </p>
          </div>

          <div className="det-acoes-cabecalho">
            <Link
              to={`/fornecedores/${fornecedor.id}/editar`}
              className="det-botao-editar"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
              </svg>
              Editar
            </Link>

            <Link to="/fornecedores" className="det-botao-voltar">
              Voltar
            </Link>
          </div>
        </div>

        {/* Identificação principal */}
        <section className="det-card det-identificacao">
          <div className="det-equipamento-icone">
            <IconeFornecedor />
          </div>

          <div className="det-identificacao-texto">
            <span className="det-patrimonio">
              Fornecedor #{fornecedor.id}
            </span>

            <h2>
              {fornecedor.nomeFantasia || fornecedor.razaoSocial || 'Fornecedor sem nome'}
            </h2>

            <div className="det-identificacao-legenda">
              <span>{fornecedor.razaoSocial || 'Razão social não informada'}</span>
              <span>•</span>
              <span>{formatarCnpj(fornecedor.cnpj)}</span>
            </div>
          </div>

          <span className={`det-status ${classeStatus(statusFornecedor)}`}>
            {statusFornecedor}
          </span>
        </section>

        {/* Informações cadastrais */}
        <section className="det-secao">
          <div className="det-titulo-secao">
            <div>
              <h2>Informações do fornecedor</h2>
              <p>Dados cadastrais e informações de contato.</p>
            </div>
          </div>

          <div className="det-grade-informacoes">

            <div className="det-card">
              <h3>Identificação</h3>

              <div className="det-info-grade">
                <InfoItem
                  titulo="Razão social"
                  valor={fornecedor.razaoSocial}
                />

                <InfoItem
                  titulo="Nome fantasia"
                  valor={fornecedor.nomeFantasia}
                />

                <InfoItem
                  titulo="CNPJ"
                  valor={formatarCnpj(fornecedor.cnpj)}
                />

                <InfoItem
                  titulo="Status"
                  valor={statusFornecedor}
                />
              </div>
            </div>

            <div className="det-card">
              <h3>Endereço</h3>

              <div className="det-info-grade">
                <InfoItem
                  titulo="Endereço"
                  valor={fornecedor.endereco}
                />
              </div>
            </div>

            <div className="det-card">
              <h3>Contato</h3>

              <div className="det-info-grade">
                <InfoItem
                  titulo="Telefone"
                  valor={fornecedor.telefone}
                />

                <InfoItem
                  titulo="E-mail"
                  valor={fornecedor.email}
                />
              </div>
            </div>

            <div className="det-card">
              <h3>Observações</h3>

              <p className="det-observacao">
                {fornecedor.descricao ||
                  'Nenhuma observação cadastrada para este fornecedor.'}
              </p>
            </div>

          </div>
        </section>

        {/* Equipamentos vinculados */}
        <section className="det-saude">
          <div className="det-saude-cabecalho">
            <div>
              <span className="det-sobretitulo">
                RELACIONAMENTO COM ATIVOS
              </span>

              <h2>Equipamentos fornecidos</h2>

              <p>
                Acompanhe os equipamentos vinculados a este fornecedor.
              </p>
            </div>
          </div>

          <div className="det-saude-conteudo">

            <div className="det-saude-resumo">

              <div className="det-card det-indicador">
                <span>Total de equipamentos</span>
                <strong>{resumo.total}</strong>
                <small>Equipamentos vinculados</small>
              </div>

              <div className="det-card det-indicador">
                <span>Equipamentos ativos</span>
                <strong>{resumo.ativos}</strong>
                <small>Em funcionamento</small>
              </div>

              <div className="det-card det-indicador">
                <span>Equipamentos inativos</span>
                <strong>{resumo.inativos}</strong>
                <small>Fora de operação</small>
              </div>

            </div>

            <div className="det-card det-conteudo-aba">
              <div className="det-aba-cabecalho">
                <div>
                  <h3>Equipamentos cadastrados</h3>
                  <p>
                    Ativos vinculados a {fornecedor.nomeFantasia || fornecedor.razaoSocial}.
                  </p>
                </div>
              </div>

              {equipamentosFornecedor.length === 0 ? (
                <p>
                  Nenhum equipamento vinculado a este fornecedor.
                </p>
              ) : (
                <div className="det-tabela-container">
                  <table className="det-tabela">
                    <thead>
                      <tr>
                        <th>Patrimônio</th>
                        <th>Equipamento</th>
                        <th>Categoria</th>
                        <th>Marca</th>
                        <th>Status</th>
                        <th>Ação</th>
                      </tr>
                    </thead>

                    <tbody>
                      {equipamentosFornecedor.map((item) => (
                        <tr key={item.id}>
                          <td>{item.patrimonio || '-'}</td>
                          <td>{item.nome || 'Sem nome'}</td>
                          <td>{item.tipo || item.categoria || '-'}</td>
                          <td>{item.marca || '-'}</td>
                          <td>{item.status || 'Não informado'}</td>
                          <td>
                            <Link
                              to={`/equipamentos/${item.id}`}
                              className="dash-ver-detalhes"
                            >
                              Ver detalhes
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </section>

      </main>
    </div>
  )
}
