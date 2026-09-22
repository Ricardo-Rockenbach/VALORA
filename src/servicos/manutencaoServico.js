const API_URL = 'http://localhost:3000'

export async function listarManutencoes() {
    const response = await fetch(`${API_URL}/manutencoes`)

    if (!response.ok) {
        throw new Error('Erro ao buscar manutenções')
    }
    
    return response.json()
}

export async function listarManutencoesPorEquipamento(equipamentoId) {
    const response = await fetch( `${API_URL}/manutencoes?equipamento_id=${equipamentoId}`)
    
    if (!response.ok) {
        throw new Error('Erro ao buscar histórico')
    }

    return response.json()
}

export async function criarManutencao(manutencao) {
    const response = await fetch(`${API_URL}/manutencoes`, {
        method: 'POST',
        headers: {
            'Content-type': 'application/json',
        },
        body: JSON.stringify(manutencao),
    })
    
    if (!response.ok) {
        throw new Error('Erro ao registrar manutenção')
    }

    return response.json()
}