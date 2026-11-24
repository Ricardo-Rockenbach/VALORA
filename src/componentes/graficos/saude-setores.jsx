import ReactECharts from 'echarts-for-react'
import { useRef } from 'react'
import MenuExportacao from '../menuExportar'

import '../../paginas/css/saude-equipamentos.css'

export default function GraficoSaudeSetores({
  dados,
  titulo = 'Saúde média por setor'
}) {

  const graficoRef = useRef(null)

  const options = {

    grid: {
      top: 10,
      bottom: 10,
      left: 220,
      right: 40
    },

    tooltip: {
      show: false
    },

    xAxis: {
      type: 'value',
      min: 0,
      max: 100,
      show: false
    },

    yAxis: {
      type: 'category',
      inverse: true,

      data: dados.map(item => item.nome),

      axisLine: { show: false },
      axisTick: { show: false },

      axisLabel: {
        interval: 0,
        align: 'left',
        margin: 220,
        width: 205,
        overflow: 'truncate',

        color: '#514438',
        fontSize: 12,
        fontWeight: 600,

        formatter: (nome, indice) => {
          return `${nome}\n{quantidade|${dados[indice].quantidade} equipamento(s)}`
        },

        rich: {
          quantidade: {
            fontSize: 10,
            fontWeight: 400,
            color: '#999087',
            lineHeight: 20
          }
        }
      }
    },

    series: [

      // Barras de saúde
      {
        type: 'bar',

        data: dados.map(item => item.saudeMedia),

        barWidth: 16,

        silent: true,

        emphasis: {
          disabled: true
        },

        showBackground: true,

        backgroundStyle: {
          color: '#F0EBE5',
          borderRadius: 5
        },

        itemStyle: {
          color: '#C84E00',
          borderRadius: 5
        }
      },

      // Série transparente para alinhar as pontuações
      {
        type: 'bar',

        data: dados.map(() => 100),

        barWidth: 16,
        barGap: '-100%',

        silent: true,

        emphasis: {
          disabled: true
        },

        itemStyle: {
          color: 'transparent'
        },

        label: {
          show: true,
          position: 'right',
          distance: 10,
          fontSize: 12,
          fontWeight: 700,

          formatter: ({ dataIndex }) => {

            const valor = dados[dataIndex].saudeMedia

            if (valor >= 90) return `{excelente|${valor}}`
            if (valor >= 75) return `{boa|${valor}}`
            if (valor >= 50) return `{atencao|${valor}}`

            return `{critica|${valor}}`
          },

          rich: {
            excelente: {
              color: '#278D52',
              width: 28,
              align: 'right'
            },

            boa: {
              color: '#85A63D',
              width: 28,
              align: 'right'
            },

            atencao: {
              color: '#D69C28',
              width: 28,
              align: 'right'
            },

            critica: {
              color: '#BE4545',
              width: 28,
              align: 'right'
            }
          }
        }
      }
    ]
  }

  return (
    <>
      <div className="grafico-cabecalho">

        <h3>{titulo}</h3>

        <MenuExportacao
          graficoRef={graficoRef}
          dados={dados}
          nomeArquivo="saude-media-setores"
        />

      </div>

      <ReactECharts
        ref={graficoRef}
        option={options}
        notMerge={true}
        opts={{ renderer: 'svg' }}
        style={{
          width: '100%',
          height: `${Math.max(250, dados.length * 55)}px`
        }}
      />
    </>
  )
}