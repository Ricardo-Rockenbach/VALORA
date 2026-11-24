
import ReactECharts from 'echarts-for-react'
import { useRef } from 'react'
import MenuExportacao from '../menuExportar'

import '../../paginas/css/saude-equipamentos.css'

export default function GraficoTiposManutencao({
  dados,
  titulo = 'Tipos de manutenção'
}) {

  const graficoRef = useRef(null)

  const total = dados.reduce(
    (soma, item) => soma + item.quantidade, 0
  )

  const cores = [
    '#C84E00',
    '#DF9D35',
    '#278D52',
    '#7489A3'
  ]

  const options = {

    color: cores,

    tooltip: {
      show: false
    },

    title: {
      text: String(total),
      subtext: 'Manutenções',
      left: 'center',
      top: '38%',

      textStyle: {
        fontSize: 26,
        color: '#514438'
      },

      subtextStyle: {
        fontSize: 12
      }
    },

    series: [
      {
        type: 'pie',

        radius: ['55%', '80%'],

        center: ['50%', '50%'],

        silent: true,

        emphasis: {
          disabled: true
        },

        label: {
          show: false
        },

        data: dados.map(item => ({
          name: item.nome,
          value: item.quantidade
        }))
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
          nomeArquivo="tipos-manutencao"
        />

      </div>

      <ReactECharts
        ref={graficoRef}
        option={options}
        opts={{ renderer: 'svg' }}
        style={{
          width: '100%',
          height: '220px'
        }}
      />

      <div className="analytics-tipos-lista">

        {dados.map((item, indice) => (

          <div
            className="analytics-tipo-item"
            key={item.nome}
          >

            <span
              className="analytics-tipo-marcador"
              style={{
                backgroundColor: cores[indice % cores.length]
              }}
            />

            <span>{item.nome}</span>

            <strong>{item.quantidade}</strong>

            <small>{item.percentual}%</small>

          </div>

        ))}

      </div>

      <div className="analytics-nota">
        Total considerado: {total} registro(s).
      </div>
    </>
  )
}