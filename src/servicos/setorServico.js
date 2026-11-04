import { apiRequest } from './api'

export function listarSetores() {
  return apiRequest('/setores')
}

export function buscarSetor(id) {
  return apiRequest(`/setores/${id}`)
}

export function cadastrarSetor(dados) {
  return apiRequest('/setores', {
    method: 'POST',
    body: JSON.stringify(dados),
  })
}

// Adicione esta função ao arquivo:
export async function atualizarSetor(id, dados) {
  return apiRequest(`/setores/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dados),
  })
}

export function excluirSetor(id) {
  return apiRequest(`/setores/${id}`, {
    method: 'DELETE',
  })
}