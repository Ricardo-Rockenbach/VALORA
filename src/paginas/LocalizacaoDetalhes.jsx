
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MapPin, Pencil } from 'lucide-react'

import Sidebar from '../componentes/sidebar'

import { listarLocalizacoes } from '../servicos/localizacaoServico'
import { listarSetores } from '../servicos/setorServico'
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


function classeStatus(status) {
  const valor = (status || '').toLowerCase()

  if (valor === 'ativo') {
    return 'det-status--ativo'
  }

  return 'det-status--inativo'
}

export default function LocalizacaoDetalhes() {
  const { id } = useParams()

  const [localizacao, setLocalizacao] = useState(null)
  const [setores, setSetores] = useState([])
  const [equipamentos, setEquipamentos] = useState([])

  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true)
        setErro('')

        const [
          localizacoesData,
          setoresData,
          equipamentosData,
        ] = await Promise.all([
          listarLocalizacoes(),
          listarSetores(),
          listarEquipamentos(),
        ])

        const localizacaoEncontrada = localizacoesData.find(
          (item) => String(item.id) === String(id)
        )

        if (!localizacaoEncontrada) {
          setErro('Localização não encontrada.')
          return
        }

        setLocalizacao(localizacaoEncontrada)
        setSetores(setoresData)
        setEquipamentos(equipamentosData)
      } catch (error) {
        console.error('Erro ao carregar detalhes da localização:', error)
        setErro('Não foi possível carregar os dados da localização.')
      } finally {
        setCarregando(false)
      }
    }

    carregarDados()
  }, [id])

  const dadosRelacionados = useMemo(() => {
    if (!localizacao) return {}

    return {
      setor: setores.find(
        (item) => String(item.id) === String(localizacao.setorId)
      ),
    }
  }, [localizacao, setores])

  const equipamentosLocalizacao = useMemo(() => {
    if (!localizacao) return []

    return equipamentos.filter(
      (item) => String(item.localizacaoId) === String(localizacao.id)
    )
  }, [localizacao, equipamentos])

  const resumo = useMemo(() => {
    const ativos = equipamentosLocalizacao.filter(
      (item) => (item.status || '').toLowerCase() === 'ativo'
    ).length

    const inativos = equipamentosLocalizacao.length - ativos

    return {
      total: equipamentosLocalizacao.length,
      ativos,
      inativos,
    }
  }, [equipamentosLocalizacao])

  if (carregando) {
    return (
      <div className="detalhes-layout">
        <Sidebar />
        <main className="detalhes-conteudo">
          <p className="det-mensagem">
            Carregando dados da localização...
          </p>
        </main>
      </div>
    )
  }

  if (erro || !localizacao) {
    return (
      <div className="detalhes-layout">
        <Sidebar />
        <main className="detalhes-conteudo">
          <div className="det-erro">
            <h2>Não foi possível abrir a localização</h2>
            <p>{erro || 'Localização não encontrada.'}</p>

            <Link to="/localizacoes" className="det-botao-voltar">
              Voltar para localizações
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const statusLocalizacao = localizacao.status || 'Não informado'

  return (
    <div className="dash">
      <Sidebar />

      <main className="detalhes-conteudo">

        {/* Cabeçalho */}
        <div className="det-cabecalho">
          <div>
            <div className="det-breadcrumb">
              <Link to="/localizacoes">Localizações</Link>
              <span>/</span>
              <span>Detalhes</span>
            </div>

            <h1>Detalhes da localização</h1>
            <p>
              Consulte as informações e os equipamentos vinculados a esta localização.
            </p>
          </div>

          <div className="det-acoes-cabecalho">
            <Link
              to={`/localizacoes/${localizacao.id}/editar`}
              className="det-botao-editar"
            >
              <Pencil size={16} strokeWidth={2} />
              Editar
            </Link>

            <Link to="/localizacoes" className="det-botao-voltar">
              Voltar
            </Link>
          </div>
        </div>

        {/* Identificação principal */}
        <section className="det-card det-identificacao">
          <div className="det-equipamento-icone">
            <MapPin size={28} strokeWidth={1.7} />
          </div>

          <div className="det-identificacao-texto">
            <span className="det-patrimonio">
              Localização #{localizacao.id}
            </span>

            <h2>{localizacao.nome || 'Localização sem nome'}</h2>

            <div className="det-identificacao-legenda">
              <span>
                {dadosRelacionados.setor?.nome || 'Setor não informado'}
              </span>
            </div>
          </div>

          <span className={`det-status ${classeStatus(statusLocalizacao)}`}>
            {statusLocalizacao}
          </span>
        </section>

        {/* Informações da localização */}
        <section className="det-secao">
          <div className="det-titulo-secao">
            <div>
              <h2>Informações da localização</h2>
              <p>Dados cadastrais e informações do ambiente.</p>
            </div>
          </div>

          <div className="det-grade-informacoes">
            <div className="det-card">
              <h3>Identificação</h3>

              <div className="det-info-grade">
                <InfoItem
                  titulo="ID"
                  valor={localizacao.id}
                />

                <InfoItem
                  titulo="Nome"
                  valor={localizacao.nome}
                />

                <InfoItem
                  titulo="Setor"
                  valor={dadosRelacionados.setor?.nome}
                />

                <InfoItem
                  titulo="Status"
                  valor={statusLocalizacao}
                />
              </div>
            </div>

            <div className="det-card">
              <h3>Descrição</h3>

              <p className="det-observacao">
                {localizacao.descricao ||
                  'Nenhuma descrição cadastrada para esta localização.'}
              </p>
            </div>
          </div>
        </section>

        {/* Resumo dos equipamentos */}
        <section className="det-saude">
          <div className="det-saude-cabecalho">
            <div>
              <span className="det-sobretitulo">
                AMBIENTE E EQUIPAMENTOS
              </span>

              <h2>Equipamentos da localização</h2>

              <p>
                Acompanhe os equipamentos cadastrados neste ambiente.
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

            {/* Lista de equipamentos */}
            <div className="det-card det-conteudo-aba">
              <div className="det-aba-cabecalho">
                <div>
                  <h3>Equipamentos cadastrados</h3>
                  <p>
                    Ativos vinculados à localização {localizacao.nome}.
                  </p>
                </div>
              </div>

              {equipamentosLocalizacao.length === 0 ? (
                <p>
                  Nenhum equipamento cadastrado nesta localização.
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
                      {equipamentosLocalizacao.map((item) => (
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
