import { apiRequest } from './api'

export function listarFornecedores() {
  return apiRequest('/fornecedores')
}

export function buscarFornecedor(id) {
  return apiRequest(`/fornecedores/${id}`)
}

export function cadastrarFornecedor(dados) {
  return apiRequest('/fornecedores', {
    method: 'POST',
    body: JSON.stringify(dados),
  })
}

export async function atualizarFornecedor(id, dados) {
  return apiRequest(`/fornecedores/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dados),
  })
}

export function excluirFornecedor(id) {
  return apiRequest(`/fornecedores/${id}`, {
    method: 'DELETE',
  })
}