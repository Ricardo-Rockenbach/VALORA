import ReactECharts from 'echarts-for-react'
import { useRef } from 'react'
import MenuExportacao from '../menuExportar'

import '../../paginas/css/saude-equipamentos.css'


export default function GraficoVolumeManutencoes({
  dados,
  titulo = 'Volume de manutenções'
}) {

  const graficoRef = useRef(null)

  const dadosExportacao = dados.map(item => ({
    periodo: item.label,
    quantidade: item.quantidade
  }))

  const options = {

    grid: {
      top: 25,
      bottom: 25,
      left: 10,
      right: 10
    },

    tooltip: {
      show: false
    },

    emphasis: {
        disable: true
    },


    xAxis: {
      type: 'category',
      data: dados.map(item => item.label),
      axisLine: { show: false },
      axisTick: { show: false }
    },

    yAxis: {
      type: 'value',
      minInterval: 1,
      show: false
    },

    series: [
      {
        name: 'Manutenções',
        type: 'bar',
        data: dados.map(item => item.quantidade),

        barMaxWidth: 35,

        itemStyle: {
          color: '#C84E00',
          borderRadius: [4, 4, 0, 0]
        },

        label: {
          show: true,
          position: 'top'
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
          dados={dadosExportacao}
          nomeArquivo="volume-manutencoes"
        />

      </div>

      <ReactECharts
        ref={graficoRef}
        option={options}
        opts={{ renderer: 'svg' }}
        style={{
          width: '100%',
          height: '250px'
        }}
      />
    </>
  )
}