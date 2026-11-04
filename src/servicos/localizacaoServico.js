import { apiRequest } from './api'

export function listarLocalizacoes() {
  return apiRequest('/localizacoes')
}

export function buscarLocalizacao(id) {
  return apiRequest(`/localizacoes/${id}`)
}

export function cadastrarLocalizacao(dados) {
  return apiRequest('/localizacoes', {
    method: 'POST',
    body: JSON.stringify(dados),
  })
}

export async function atualizarLocalizacao(id, dados) {
  return apiRequest(`/localizacoes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dados),
  })
}

export function excluirLocalizacao(id) {
  return apiRequest(`/localizacoes/${id}`, {
    method: 'DELETE',
  })
}