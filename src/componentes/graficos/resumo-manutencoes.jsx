import ReactECharts from 'echarts-for-react'

export default function GraficoResumoManutencoes({ dados }) {

  const status = [
    {
      nome: 'Abertas',
      quantidade: dados.abertas,
      cor: '#C7443E'
    },
    {
      nome: 'Em andamento',
      quantidade: dados.emAndamento,
      cor: '#D99B25'
    },
    {
      nome: 'Concluídas',
      quantidade: dados.concluidas,
      cor: '#24934E'
    }
  ]

  const options = {

    graphic: [

      // Card do total de registros
      {
        type: 'rect',
        left: 0,
        right: 0,
        top: 0,

        shape: {
          height: 66,
          r: 5
        },

        style: {
          fill: '#F8F2EC'
        }
      },

      // Texto do total
      {
        type: 'text',
        left: 15,
        top: 26,

        style: {
          text: 'Total de registros',
          fontSize: 13,
          fontWeight: 600,
          fill: '#806D5D'
        }
      },

      // Quantidade total
      {
        type: 'text',
        right: 15,
        top: 18,

        style: {
          text: String(dados.total),
          fontSize: 28,
          fontWeight: 700,
          fill: '#603719'
        }
      },

      // Indicadores de manutenção
      ...status.flatMap((item, indice) => {

        const posicao = 92 + indice * 33

        return [

          // Círculo colorido
          {
            type: 'circle',
            left: 0,
            top: posicao - 4,

            shape: {
              r: 4.5
            },

            style: {
              fill: item.cor
            }
          },

          // Nome do status
          {
            type: 'text',
            left: 19,
            top: posicao - 7,

            style: {
              text: item.nome,
              fontSize: 13,
              fill: '#806D5D'
            }
          },

          // Quantidade
          {
            type: 'text',
            right: 0,
            top: posicao - 7,

            style: {
              text: String(item.quantidade),
              fontSize: 14,
              fontWeight: 700,
              fill: '#514438'
            }
          }

        ]
      })
    ]
  }

  return (
    <ReactECharts
      option={options}
      opts={{ renderer: 'svg' }}
      style={{
        width: '100%',
        height: '180px'
      }}
    />
  )
}