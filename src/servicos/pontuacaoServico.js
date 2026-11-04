// Regras de saúde do VALORA (MVP).
// O Score é recalculado a partir do histórico; não deve ser persistido no banco.
// Custo financeiro e status operacional do ativo são indicadores separados,
// para não confundir gasto/disponibilidade com saúde técnica nem duplicar penalidades.

const PONTOS_CORRETIVA = {
  baixa: 10,
  media: 20,
  alta: 30,
}

const PONTOS_TROCA_PECA = {
  baixa: 5,
  media: 9,
  alta: 14,
}

const FATOR_STATUS_PENALIDADE = {
  aberta: 1,
  'em andamento': 0.6,
  'em analise': 1,
  'aguardando peca': 1,
  concluida: 0.2,
}

const BONUS_PREVENTIVA = {
  aberta: 0,
  'em andamento': 2,
  'em analise': 0,
  'aguardando peca': 0,
  concluida: 6,
}

const BONUS_ATUALIZACAO = {
  aberta: 0,
  'em andamento': 1,
  'em analise': 0,
  'aguardando peca': 0,
  concluida: 3,
}

const BONUS_TROCA_PECA_CONCLUIDA = 5
const LIMITE_BONUS_POSITIVO = 15
const PONTUACAO_INICIAL = 100

function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function obterStatus(manutencao) {
  const status = normalizar(manutencao?.status)

  if (['concluida', 'resolvido', 'encerrado'].includes(status)) {
    return 'concluida'
  }

  if (['em andamento', 'em atendimento'].includes(status)) {
    return 'em andamento'
  }

  if (status === 'em analise') return 'em analise'
  if (status === 'aguardando peca') return 'aguardando peca'
  if (['aberta', 'aberto', ''].includes(status)) return 'aberta'

  // Status desconhecido é tratado conservadoramente como pendente.
  return 'aberta'
}

function obterPrioridade(manutencao) {
  const prioridade = normalizar(manutencao?.prioridade)

  if (prioridade === 'baixa') return 'baixa'
  if (prioridade === 'alta') return 'alta'

  // Registros antigos sem prioridade recebem peso médio.
  return 'media'
}

function calcularImpactoManutencao(manutencao) {
  const tipo = normalizar(manutencao?.tipoManutencao)
  const status = obterStatus(manutencao)
  const prioridade = obterPrioridade(manutencao)

  if (tipo === 'corretiva') {
    const peso = PONTOS_CORRETIVA[prioridade]
    const fator = FATOR_STATUS_PENALIDADE[status]
    const pontos = -(peso * fator)

    return {
      pontos,
      motivo:
        status === 'concluida'
          ? 'Falha corretiva resolvida; permanece um pequeno registro de desgaste histórico.'
          : 'Falha corretiva ainda não encerrada; impacto conforme prioridade e andamento.',
    }
  }

  if (tipo === 'preventiva') {
    const pontos = BONUS_PREVENTIVA[status]

    return {
      pontos,
      motivo:
        pontos > 0
          ? 'Manutenção preventiva executada ou em andamento; contribui para a conservação do ativo.'
          : 'Manutenção preventiva ainda não concluída; nenhum bônus é aplicado.',
    }
  }

  if (tipo === 'troca de peca') {
    if (status === 'concluida') {
      return {
        pontos: BONUS_TROCA_PECA_CONCLUIDA,
        motivo: 'Troca de peça concluída; contribuição positiva para a recuperação do equipamento.',
      }
    }

    const peso = PONTOS_TROCA_PECA[prioridade]
    const fator = FATOR_STATUS_PENALIDADE[status]

    return {
      pontos: -(peso * fator),
      motivo: 'Troca de peça pendente; impacto conforme prioridade e andamento.',
    }
  }

  if (tipo === 'atualizacao') {
    const pontos = BONUS_ATUALIZACAO[status]

    return {
      pontos,
      motivo:
        pontos > 0
          ? 'Atualização concluída ou em andamento; contribui para a manutenção do ativo.'
          : 'Atualização ainda não concluída; nenhum bônus é aplicado.',
    }
  }

  return {
    pontos: 0,
    motivo: 'Tipo de manutenção não reconhecido; não altera o Score.',
  }
}

function classificarSaude(pontuacao) {
  if (pontuacao >= 90) return 'Excelente'
  if (pontuacao >= 75) return 'Boa'
  if (pontuacao >= 50) return 'Atenção'
  return 'Crítica'
}

/**
 * Calcula a saúde estimada do equipamento e retorna o detalhamento das regras.
 * @param {object} equipamento Dados do ativo.
 * @param {Array<object>} manutencoes Histórico de manutenções do ativo.
 */
export function calcularSaudeEquipamento(equipamento, manutencoes = []) {
  const historico = Array.isArray(manutencoes) ? manutencoes : []

  const detalhamento = historico.map((manutencao) => {
    const impacto = calcularImpactoManutencao(manutencao)

    return {
      manutencaoId: manutencao?.id ?? null,
      tipo: manutencao?.tipoManutencao || 'Não informado',
      status: manutencao?.status || 'Aberta (assumido)',
      prioridade: manutencao?.prioridade || 'Média (assumida)',
      pontos: Number(impacto.pontos.toFixed(2)),
      motivo: impacto.motivo,
    }
  })

  const pontosPositivosBrutos = detalhamento
    .filter((item) => item.pontos > 0)
    .reduce((total, item) => total + item.pontos, 0)

  const pontosNegativos = detalhamento
    .filter((item) => item.pontos < 0)
    .reduce((total, item) => total + Math.abs(item.pontos), 0)

  // Evita que muitos registros positivos elevem artificialmente a saúde.
  const bonusAplicado = Math.min(
    pontosPositivosBrutos,
    LIMITE_BONUS_POSITIVO
  )

  const pontuacaoCalculada =
    PONTUACAO_INICIAL + bonusAplicado - pontosNegativos

  const pontuacao = Math.max(
    0,
    Math.min(100, Math.round(pontuacaoCalculada))
  )

  return {
    pontuacao,
    classificacao: classificarSaude(pontuacao),
    equipamentoId: equipamento?.id ?? null,
    patrimonio: equipamento?.patrimonio ?? null,
    totalManutencoes: historico.length,
    pontosPositivos: Number(bonusAplicado.toFixed(2)),
    pontosPositivosBrutos: Number(pontosPositivosBrutos.toFixed(2)),
    pontosNegativos: Number(pontosNegativos.toFixed(2)),
    detalhamento,
  }
}

// Mantém compatibilidade com o uso anterior: retorna somente o número do Score.
export function calcularPontuacao(equipamento, manutencoes = []) {
  return calcularSaudeEquipamento(equipamento, manutencoes).pontuacao
}