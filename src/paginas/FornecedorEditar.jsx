
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Sidebar from '../componentes/sidebar'

import {
  listarFornecedores,
  atualizarFornecedor,
} from '../servicos/fornecedorServico'

import './Home.css'
import './EquipamentoNovo.css'

const formularioVazio = {
  razaoSocial: '',
  cnpj: '',
  nomeFantasia: '',
  endereco: '',
  telefone: '',
  email: '',
  descricao: '',
  status: 'Ativo',
}

const statusOpcoes = ['Ativo', 'Inativo']

function somenteDigitos(valor) {
  return valor.replace(/\D/g, '')
}

function mascararCnpj(valor) {
  return somenteDigitos(valor)
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

function Campo({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  options,
  required = false,
  rows = 3,
}) {
  return (
    <div className="nv-campo">
      <label className="nv-rotulo">
        {label}
        {required && <span> *</span>}
      </label>

      {options ? (
        <select
          value={value}
          onChange={onChange}
          required={required}
        >
          {options.map((opcao) => {
            const valor =
              typeof opcao === 'object' ? opcao.value : opcao

            const texto =
              typeof opcao === 'object' ? opcao.label : opcao

            return (
              <option key={valor} value={valor}>
                {texto}
              </option>
            )
          })}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          required={required}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
        />
      )}
    </div>
  )
}

export default function FornecedorEditar() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [form, setForm] = useState(formularioVazio)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [fornecedor, setFornecedor] = useState(null)

  useEffect(() => {
    async function carregarFornecedor() {
      try {
        setCarregando(true)
        setErro('')

        const fornecedores = await listarFornecedores()

        const encontrado = fornecedores.find(
          (item) => String(item.id) === String(id)
        )

        if (!encontrado) {
          setErro('Fornecedor não encontrado.')
          return
        }

        setFornecedor(encontrado)

        setForm({
          razaoSocial: encontrado.razaoSocial || '',
          cnpj: mascararCnpj(encontrado.cnpj || ''),
          nomeFantasia: encontrado.nomeFantasia || '',
          endereco: encontrado.endereco || '',
          telefone: encontrado.telefone || '',
          email: encontrado.email || '',
          descricao: encontrado.descricao || '',
          status: encontrado.status || 'Ativo',
        })
      } catch (error) {
        console.error('Erro ao carregar fornecedor:', error)
        setErro('Não foi possível carregar os dados do fornecedor.')
      } finally {
        setCarregando(false)
      }
    }

    carregarFornecedor()
  }, [id])

  function atualizarCampo(campo, valor) {
    setForm((anterior) => ({
      ...anterior,
      [campo]: valor,
    }))
  }

  async function salvar(event) {
    event.preventDefault()

    if (!form.razaoSocial.trim()) {
      setErro('Informe a razão social do fornecedor.')
      return
    }

    if (somenteDigitos(form.cnpj).length !== 14) {
      setErro('Informe um CNPJ válido com 14 números.')
      return
    }

    try {
      setSalvando(true)
      setErro('')

      const dadosAtualizados = {
        razaoSocial: form.razaoSocial.trim(),
        cnpj: somenteDigitos(form.cnpj),
        nomeFantasia: form.nomeFantasia.trim(),
        endereco: form.endereco.trim(),
        telefone: form.telefone.trim(),
        email: form.email.trim(),
        descricao: form.descricao.trim(),
        status: form.status,
      }

      await atualizarFornecedor(id, dadosAtualizados)

      navigate(`/fornecedores/${id}`)
    } catch (error) {
      console.error('Erro ao atualizar fornecedor:', error)
      setErro('Não foi possível salvar as alterações. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return (
      <div className="dash">
        <Sidebar ativo="Cadastro" abertoInicial="Cadastro" />
        <main className="dash-conteudo">
          <h2 className="dash-titulo">Editar Fornecedor</h2>
          <p>Carregando dados...</p>
        </main>
      </div>
    )
  }

  if (erro && !fornecedor) {
    return (
      <div className="dash">
        <Sidebar ativo="Cadastro" abertoInicial="Cadastro" />
        <main className="dash-conteudo">
          <h2 className="dash-titulo">Editar Fornecedor</h2>
          <p className="nv-erro">{erro}</p>

          <Link to="/fornecedores" className="nv-cancelar">
            Voltar para fornecedores
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="dash">
      <Sidebar ativo="Cadastro" abertoInicial="Cadastro" />

      <main className="dash-conteudo">
        <div className="nv-cabecalho">
          <div>
            <h2 className="dash-titulo">Editar Fornecedor</h2>
            <p>Atualize as informações cadastrais do fornecedor.</p>
          </div>

          <Link
            to={`/fornecedores/${id}`}
            className="nv-cancelar"
          >
            Voltar
          </Link>
        </div>

        <form className="nv-form" onSubmit={salvar}>
          <div className="nv-campos">

            <Campo
              label="Razão Social"
              value={form.razaoSocial}
              onChange={(e) =>
                atualizarCampo('razaoSocial', e.target.value)
              }
              placeholder="Digite a razão social"
              required
            />

            <Campo
              label="Nome Fantasia"
              value={form.nomeFantasia}
              onChange={(e) =>
                atualizarCampo('nomeFantasia', e.target.value)
              }
              placeholder="Digite o nome fantasia"
            />

            <Campo
              label="CNPJ"
              value={form.cnpj}
              onChange={(e) =>
                atualizarCampo('cnpj', mascararCnpj(e.target.value))
              }
              placeholder="00.000.000/0000-00"
              required
            />

            <Campo
              label="Telefone"
              value={form.telefone}
              onChange={(e) =>
                atualizarCampo('telefone', e.target.value)
              }
              placeholder="Digite o telefone"
            />

            <Campo
              label="E-mail"
              type="email"
              value={form.email}
              onChange={(e) =>
                atualizarCampo('email', e.target.value)
              }
              placeholder="Digite o e-mail"
            />

            <Campo
              label="Endereço"
              value={form.endereco}
              onChange={(e) =>
                atualizarCampo('endereco', e.target.value)
              }
              placeholder="Digite o endereço"
            />

            <Campo
              label="Descrição / Observações"
              type="textarea"
              value={form.descricao}
              onChange={(e) =>
                atualizarCampo('descricao', e.target.value)
              }
              placeholder="Informações adicionais sobre o fornecedor"
              rows={4}
            />

          </div>

          <aside className="nv-lateral">
            <section className="nv-fiscal">
              <h3>Situação do fornecedor</h3>

              <Campo
                label="Status"
                value={form.status}
                onChange={(e) =>
                  atualizarCampo('status', e.target.value)
                }
                options={statusOpcoes}
              />

              <p>
                Fornecedor #{fornecedor?.id}
              </p>
            </section>

            {erro && (
              <p className="nv-erro">{erro}</p>
            )}

            <div className="nv-acoes">
              <Link
                to={`/fornecedores/${id}`}
                className="nv-cancelar"
              >
                Cancelar
              </Link>

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
      </main>
    </div>
  )
}
