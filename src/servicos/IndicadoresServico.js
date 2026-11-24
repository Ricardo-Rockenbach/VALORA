// Padronização dos textos
function normalizar(texto = '') {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

// Padronização do status das manutenções
export function obterStatusManutencao(status) {
  const valor = normalizar(status)

  if (
    valor.includes('conclu') ||
    valor.includes('resolvido') ||
    valor.includes('encerrado')
  ) {
    return 'Concluída'
  }

  if (
    valor.includes('andamento') ||
    valor.includes('atendimento')
  ) {
    return 'Em andamento'
  }

  if (valor.includes('abert') || !valor) {
    return 'Aberta'
  }

  return status
}

// Distribuição da saúde dos equipamentos
export function calcularDistribuicaoSaude(equipamentosComSaude) {

  const faixas = [
    { nome: 'Excelente', classe: 'excelente' },
    { nome: 'Boa', classe: 'boa' },
    { nome: 'Atenção', classe: 'atencao' },
    { nome: 'Crítica', classe: 'critica' }
  ]

  return faixas.map((faixa, indice) => {

    const quantidade = equipamentosComSaude.filter((equipamento) => {

      const pontos = equipamento.saude.pontuacao

      if (indice === 0) return pontos >= 90

      if (indice === 1) return pontos >= 75 && pontos < 90

      if (indice === 2) return pontos >= 50 && pontos < 75

      return pontos < 50

    }).length

    return {
      ...faixa,
      quantidade,
      percentual: equipamentosComSaude.length
        ? Math.round(
            (quantidade / equipamentosComSaude.length) * 100
          )
        : 0
    }
  })
}

// Resumo das manutenções
export function calcularResumoManutencoes(manutencoes) {

  const abertas = manutencoes.filter((item) => {

    const status = obterStatusManutencao(item.status)

    return status !== 'Em andamento' &&
           status !== 'Concluída'

  }).length

  const emAndamento = manutencoes.filter(
    (item) => obterStatusManutencao(item.status) === 'Em andamento'
  ).length

  const concluidas = manutencoes.filter(
    (item) => obterStatusManutencao(item.status) === 'Concluída'
  ).length

  return {
    total: manutencoes.length,
    abertas,
    emAndamento,
    concluidas
  }
}

//grafico volume manutencoes
// Conversão de datas para o horário local
export function obterDataLocal(valor) {

  if (!valor) return null

  const texto = String(valor).slice(0, 10)
  const partes = texto.split('-')

  if (partes.length !== 3) return null

  const [ano, mes, dia] = partes.map(Number)

  if (!ano || !mes || !dia) return null

  const data = new Date(ano, mes - 1, dia)

  return Number.isNaN(data.getTime()) ? null : data

  
}


// Volume de manutenções por período
export function gerarSerieTemporal(manutencoes, periodo, hoje) {

  const serie = []

  if (periodo === '30') {

    const inicio = new Date(hoje)

    inicio.setHours(0, 0, 0, 0)
    inicio.setDate(inicio.getDate() - 29)

    for (let indice = 0; indice < 5; indice += 1) {

      const dataInicio = new Date(inicio)
      dataInicio.setDate(inicio.getDate() + indice * 6)

      const dataFim = new Date(dataInicio)
      dataFim.setDate(dataInicio.getDate() + 5)

      const quantidade = manutencoes.filter(item => {

        const data = obterDataLocal(item.data)

        return data && data >= dataInicio && data <= dataFim

      }).length

      const formatarDiaMes = data =>
        data.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit'
        })

      serie.push({
        label: `${formatarDiaMes(dataInicio)}–${formatarDiaMes(dataFim)}`,
        quantidade
      })
    }

    return serie
  }

  const quantidadeMeses = periodo === '90' ? 3 : 6

  const primeiroMes = new Date(
    hoje.getFullYear(),
    hoje.getMonth() - quantidadeMeses + 1,
    1
  )

  for (let indice = 0; indice < quantidadeMeses; indice += 1) {

    const inicioMes = new Date(
      primeiroMes.getFullYear(),
      primeiroMes.getMonth() + indice,
      1
    )

    const proximoMes = new Date(
      inicioMes.getFullYear(),
      inicioMes.getMonth() + 1,
      1
    )

    const quantidade = manutencoes.filter(item => {

      const data = obterDataLocal(item.data)

      return data && data >= inicioMes && data < proximoMes

    }).length

    serie.push({
      label: inicioMes.toLocaleDateString('pt-BR', {
        month: 'short'
      }).replace('.', ''),

      quantidade
    })
  }

  return serie
}


// Distribuição dos tipos de manutenção
export function calcularTiposManutencao(manutencoes) {

  const grupos = new Map()

  manutencoes.forEach(item => {

    const tipo = String(
      item.tipoManutencao || 'Não informada'
    ).trim() || 'Não informada'

    grupos.set(tipo, (grupos.get(tipo) || 0) + 1)

  })

  return [...grupos.entries()]
    .map(([nome, quantidade]) => ({
      nome,
      quantidade,
      percentual: Math.round(
        (quantidade / manutencoes.length) * 100
      )
    }))
    .sort((a, b) => b.quantidade - a.quantidade)
}

// Saúde média dos equipamentos por setor
export function calcularSaudePorSetor(equipamentos) {

  const grupos = new Map()

  equipamentos.forEach(item => {

    const atual = grupos.get(item.setorNome) || {
      nome: item.setorNome,
      quantidade: 0,
      somaSaude: 0
    }

    atual.quantidade += 1
    atual.somaSaude += item.saude.pontuacao

    grupos.set(item.setorNome, atual)

  })

  return [...grupos.values()]
    .map(item => ({
      nome: item.nome,
      quantidade: item.quantidade,
      saudeMedia: Math.round(
        item.somaSaude / item.quantidade
      )
    }))
    .sort((a, b) => a.saudeMedia - b.saudeMedia)
}