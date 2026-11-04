
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Sidebar from '../componentes/sidebar'

import { listarEquipamentos, atualizarEquipamento } from '../servicos/equipamentoServico'
import { listarSetores } from '../servicos/setorServico'
import { listarLocalizacoes } from '../servicos/localizacaoServico'
import { listarFornecedores } from '../servicos/fornecedorServico'
//USA CSS DO EQUIPAMENTO NOVO, POIS É O MESMO FORMULÁRIO, SÓ MUDANDO O TÍTULO E A FUNÇÃO DE SALVAR
import './css/Home.css'
import './css/EquipamentoNovo.css'

const tipos = [
  'Computador',
  'Notebook',
  'Impressora',
  'Monitor',
  'Nobreak',
  'Equipamento de rede',
]

const statusOpcoes = ['Ativo', 'Em manutenção', 'Inativo']

const formularioVazio = {
  patrimonio: '',
  nome: '',
  tipo: '',
  marca: '',
  modelo: '',
  numeroSerie: '',
  setorId: '',
  localizacaoId: '',
  fornecedorId: '',
  status: 'Ativo',
  observacao: '',
  notaFiscal: '',
  valor: '',
  dataAquisicao: '',
  garantia: '',
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

export default function EquipamentoEditar() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [form, setForm] = useState(formularioVazio)

  const [setores, setSetores] = useState([])
  const [localizacoes, setLocalizacoes] = useState([])
  const [fornecedores, setFornecedores] = useState([])

  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  // Carrega equipamento e opções do formulário
  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true)
        setErro('')

        const [
          equipamentos,
          dadosSetores,
          dadosLocalizacoes,
          dadosFornecedores,
        ] = await Promise.all([
          listarEquipamentos(),
          listarSetores(),
          listarLocalizacoes(),
          listarFornecedores(),
        ])

        const equipamento = equipamentos.find(
          (item) => String(item.id) === String(id)
        )

        if (!equipamento) {
          throw new Error('Equipamento não encontrado.')
        }

        setSetores(dadosSetores)
        setLocalizacoes(dadosLocalizacoes)
        setFornecedores(dadosFornecedores)

        // Preenche o formulário com os dados existentes
        setForm({
          ...formularioVazio,
          ...equipamento,
          patrimonio: equipamento.patrimonio ?? '',
          nome: equipamento.nome ?? '',
          tipo: equipamento.tipo ?? '',
          marca: equipamento.marca ?? '',
          modelo: equipamento.modelo ?? '',
          numeroSerie: equipamento.numeroSerie ?? '',
          setorId: equipamento.setorId != null
            ? String(equipamento.setorId)
            : '',
          localizacaoId: equipamento.localizacaoId != null
            ? String(equipamento.localizacaoId)
            : '',
          fornecedorId: equipamento.fornecedorId != null
            ? String(equipamento.fornecedorId)
            : '',
          valor: equipamento.valor != null
            ? String(equipamento.valor)
            : '',
          dataAquisicao: equipamento.dataAquisicao ?? '',
          garantia: equipamento.garantia ?? '',
          observacao: equipamento.observacao ?? '',
          notaFiscal: equipamento.notaFiscal ?? '',
          status: equipamento.status ?? 'Ativo',
        })
      } catch (error) {
        console.error('Erro ao carregar equipamento:', error)
        setErro(error.message || 'Não foi possível carregar o equipamento.')
      } finally {
        setCarregando(false)
      }
    }

    carregarDados()
  }, [id])

  // Filtra localizações de acordo com o setor selecionado
  const localizacoesDoSetor = localizacoes.filter(
    (localizacao) =>
      Number(localizacao.setorId) === Number(form.setorId)
  )

  // Atualiza os campos
  function alterar(evento) {
    const { name, value } = evento.target

    setForm((atual) => {
      const atualizado = {
        ...atual,
        [name]: value,
      }

      if (name === 'setorId') {
        atualizado.localizacaoId = ''
      }

      return atualizado
    })
  }

  // Envia as alterações para a API
  async function salvar(evento) {
    evento.preventDefault()

    try {
      setSalvando(true)
      setErro('')

      const equipamentoAtualizado = {
        patrimonio: form.patrimonio.trim(),
        nome: form.nome.trim(),
        tipo: form.tipo,
        marca: form.marca.trim(),
        modelo: form.modelo.trim(),
        numeroSerie: form.numeroSerie.trim(),
        setorId: Number(form.setorId),
        localizacaoId: form.localizacaoId
          ? Number(form.localizacaoId)
          : null,
        fornecedorId: form.fornecedorId
          ? Number(form.fornecedorId)
          : null,
        status: form.status,
        observacao: form.observacao.trim(),
        notaFiscal: form.notaFiscal.trim(),
        valor: form.valor === '' ? null : Number(form.valor),
        dataAquisicao: form.dataAquisicao || '',
        garantia: form.garantia || '',
      }

      await atualizarEquipamento(id, equipamentoAtualizado)

      navigate(`/equipamentos/${id}`)
    } catch (error) {
      console.error('Erro ao atualizar equipamento:', error)
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
      <Sidebar ativo="Equipamentos" />

      <main className="dash-conteudo">
        <h2 className="dash-titulo">Editar Equipamento</h2>

        {carregando ? (
          <p>Carregando dados do equipamento...</p>
        ) : erro && !form.patrimonio && !form.nome ? (
          <div className="nv-erro" role="alert">
            {erro}
            <button
              type="button"
              className="nv-cancelar"
              onClick={() => navigate('/equipamentos')}
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
                  rotulo="Patrimônio:"
                  obrigatorio
                  {...campo('patrimonio')}
                />

                <Campo
                  rotulo="Nome/Descrição:"
                  obrigatorio
                  {...campo('nome')}
                />

                <Campo
                  rotulo="Tipo de Equipamento:"
                  tipo="select"
                  opcoes={tipos}
                  obrigatorio
                  {...campo('tipo')}
                />

                <Campo rotulo="Marca:" {...campo('marca')} />

                <Campo rotulo="Modelo:" {...campo('modelo')} />

                <Campo
                  rotulo="Número de Série:"
                  {...campo('numeroSerie')}
                />

                <Campo
                  rotulo="Setor/Empresa:"
                  tipo="select"
                  opcoes={setores.map((setor) => ({
                    value: setor.id,
                    label: setor.nome,
                  }))}
                  obrigatorio
                  {...campo('setorId')}
                />

                <Campo
                  rotulo="Localização:"
                  tipo="select"
                  opcoes={localizacoesDoSetor.map((localizacao) => ({
                    value: localizacao.id,
                    label: localizacao.nome,
                  }))}
                  {...campo('localizacaoId')}
                  disabled={!form.setorId || localizacoesDoSetor.length === 0}
                />

                <Campo
                  rotulo="Status:"
                  tipo="select"
                  opcoes={statusOpcoes}
                  obrigatorio
                  {...campo('status')}
                />

                <Campo
                  rotulo="Observação:"
                  tipo="textarea"
                  className="nv-campo--largo"
                  {...campo('observacao')}
                />
              </div>

              <aside className="nv-lateral">
                <section className="nv-fiscal">
                  <h3>Informações Fiscais:</h3>

                  <Campo
                    rotulo="Nº da Nota Fiscal:"
                    {...campo('notaFiscal')}
                  />

                  <Campo
                    rotulo="Fornecedor:"
                    tipo="select"
                    opcoes={fornecedores.map((fornecedor) => ({
                      value: fornecedor.id,
                      label: fornecedor.nomeFantasia,
                    }))}
                    {...campo('fornecedorId')}
                  />

                  <Campo
                    rotulo="Valor:"
                    tipo="number"
                    min="0"
                    step="0.01"
                    {...campo('valor')}
                  />

                  <Campo
                    rotulo="Data de Aquisição:"
                    tipo="date"
                    {...campo('dataAquisicao')}
                  />

                  <Campo
                    rotulo="Garantia:"
                    tipo="date"
                    {...campo('garantia')}
                  />
                </section>

                <div className="nv-acoes">
                  <button
                    type="button"
                    className="nv-cancelar"
                    onClick={() => navigate(`/equipamentos/${id}`)}
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
