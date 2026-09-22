const API_URL = 'http://localhost:3000'

export async function listarEquipamentos() {
  const response = await fetch(`${API_URL}/equipamentos`)

  if (!response.ok) {
    throw new Error('Erro ao buscar equipamentos')
  }

  return response.json()
}

export async function buscarEquipamento(id) {
  const response = await fetch(`${API_URL}/equipamentos/${id}`)

  if (!response.ok) {
    throw new Error('Equipamento não encontrado')
  }

  return response.json()
}

