
import { apiRequest } from './api'

export function listarEquipamentos() {
  return apiRequest('/equipamentos')
}

export function buscarEquipamento(id) {
  return apiRequest(`/equipamentos/${id}`)
}

export function cadastrarEquipamento(dados) {
  return apiRequest('/equipamentos', {
    method: 'POST',
    body: JSON.stringify(dados),
  })
}

export async function atualizarEquipamento(id, dados) {
  return apiRequest(`/equipamentos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dados),
  })
}

export function excluirEquipamento(id) {
  return apiRequest(`/equipamentos/${id}`, {
    method: 'DELETE',
  })
}


