
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../componentes/sidebar'
import { listarSetores } from '../servicos/setorServico'
import { listarLocalizacoes } from '../servicos/localizacaoServico'
import { listarFornecedores } from '../servicos/fornecedorServico'
import { cadastrarEquipamento } from '../servicos/equipamentoServico'
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

export default function EquipamentoNovo() {
  const navigate = useNavigate()

  const [form, setForm] = useState(formularioVazio)

  const [setores, setSetores] = useState([])
  const [localizacoes, setLocalizacoes] = useState([])
  const [fornecedores, setFornecedores] = useState([])

  const [carregandoOpcoes, setCarregandoOpcoes] = useState(true)
  const [erroOpcoes, setErroOpcoes] = useState('')
  const [erroSalvar, setErroSalvar] = useState('')
  const [salvando, setSalvando] = useState(false)

  // Carrega os dados das três coleções da API
  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregandoOpcoes(true)
        setErroOpcoes('')

        const [
          dadosSetores,
          dadosLocalizacoes,
          dadosFornecedores,
        ] = await Promise.all([
          listarSetores(),
          listarLocalizacoes(),
          listarFornecedores(),
        ])

        setSetores(dadosSetores)
        setLocalizacoes(dadosLocalizacoes)
        setFornecedores(dadosFornecedores)
      } catch (error) {
        console.error('Erro ao carregar opções:', error)
        setErroOpcoes('Não foi possível carregar os dados do formulário.')
      } finally {
        setCarregandoOpcoes(false)
      }
    }

    carregarDados()
  }, [])

  // Mostra somente as localizações do setor selecionado
  const localizacoesDoSetor = localizacoes.filter(
    (localizacao) =>
      Number(localizacao.setorId) === Number(form.setorId)
  )

  // Altera os campos do formulário
  function alterar(evento) {
    const { name, value } = evento.target

    setForm((atual) => {
      const atualizado = {
        ...atual,
        [name]: value,
      }

      // Ao trocar o setor, limpa a localização anterior
      if (name === 'setorId') {
        atualizado.localizacaoId = ''
      }

      return atualizado
    })
  }

  // Salva os dados na API do VALORA.
  async function salvar(evento) {
    evento.preventDefault()

    const equipamento = {
      ...form,
      patrimonio: form.patrimonio.trim(),
      nome: form.nome.trim(),
      setorId: Number(form.setorId),
      localizacaoId: form.localizacaoId
        ? Number(form.localizacaoId)
        : null,
      fornecedorId: form.fornecedorId
        ? Number(form.fornecedorId)
        : null,
      valor: form.valor === '' ? null : Number(form.valor),
    }

    try {
      setSalvando(true)
      setErroSalvar('')
      await cadastrarEquipamento(equipamento)
      navigate('/equipamentos')
    } catch (error) {
      console.error('Erro ao cadastrar equipamento:', error)
      setErroSalvar('Não foi possível cadastrar o equipamento. Verifique se o patrimônio já existe e tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  // Dados de cada campo
  const campo = (nome) => ({
    nome,
    valor: form[nome],
    onChange: alterar,
  })

  return (
    <div className="dash">
      <Sidebar ativo="Cadastro" abertoInicial="Cadastro" />

      <main className="dash-conteudo">
        <h2 className="dash-titulo">Novo Equipamento</h2>

        {erroOpcoes && (
          <p role="alert">{erroOpcoes}</p>
        )}

        {erroSalvar && (
          <p role="alert">{erroSalvar}</p>
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
                opcoes={fornecedores
                  .filter((fornecedor) => fornecedor.status === 'Ativo')
                  .map((fornecedor) => ({
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
                inputMode="decimal"
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
                onClick={() => navigate('/equipamentos')}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="nv-salvar"
                disabled={carregandoOpcoes || !!erroOpcoes || salvando}
              >
                {carregandoOpcoes ? 'Carregando...' : salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </aside>
        </form>
      </main>
    </div>
  )
}
