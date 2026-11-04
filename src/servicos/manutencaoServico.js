
import { apiRequest } from './api'

export function listarManutencoes() {
  return apiRequest('/manutencoes')
}

export function buscarManutencao(id) {
  return apiRequest(`/manutencoes/${id}`)
}

export function cadastrarManutencao(dados) {
  return apiRequest('/manutencoes', {
    method: 'POST',
    body: JSON.stringify(dados),
  })
}

export function atualizarManutencao(id, dados) {
  return apiRequest(`/manutencoes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dados),
  })
}

export function excluirManutencao(id) {
  return apiRequest(`/manutencoes/${id}`, {
    method: 'DELETE',
  })
}
