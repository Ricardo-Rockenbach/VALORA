import { apiRequest } from './api'

export async function listarTarefas(manutencaoId) {
  return apiRequest(`/tarefas?manutencaoId=${manutencaoId}`)
}

export async function cadastrarTarefa(dados) {
  return apiRequest('/tarefas', {
    method: 'POST',
    body: JSON.stringify(dados),
  })
}

export async function atualizarTarefa(id, dados) {
  return apiRequest(`/tarefas/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(dados),
  })
}

export async function excluirTarefa(id) {
  return apiRequest(`/tarefas/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}