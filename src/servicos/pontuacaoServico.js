export function calcularPontuacao(equipamento, manutencoes) {
    let pontuacao = 100

    const quantidadeManutencoes = manutencoes.length

    const custoTotal = manutencoes.reduce(
        (total, manutencao) => total + Number(manutencao.custo || 0),
        0
    )

    // Regras Iniciais para mvp
    pontuacao -= quantidadeManutencoes * 3

    if (custoTotal > 1000) {
        pontuacao -= 10
    }

    if (custoTotal > 2000) {
        pontuacao -= 10
    }

    if (pontuacao < 0) {
        pontuacao = 0
    }

    return pontuacao

}