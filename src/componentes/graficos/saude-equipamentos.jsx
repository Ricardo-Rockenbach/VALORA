import ReactECharts from 'echarts-for-react'
import { useRef } from 'react'
import MenuExportacao from '../menuExportar'


import '../../paginas/css/saude-equipamentos.css'
const cores = {
  excelente: '#278D52',
  boa: '#85A63D',
  atencao: '#D69C28',
  critica: '#BE4545'
}

export default function GraficoSaude({
  dados,
  titulo = 'Distribuição da saúde'
}) {

  const graficoRef = useRef(null)

  const dadosExportacao = dados.map(item => ({
  classificacao: item.nome,
  quantidade: item.quantidade,
  percentual: item.percentual
  }))

  const options = {
    animationDuration: 600,


    grid: {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    },

    xAxis: {
      type: 'value',
      min: 0,
      max: 100,
      show: false
    },

    yAxis: {
      type: 'category',
      data: dados.map(faixa => faixa.nome),
      inverse: true,
      show: false
    },

    series: [
      {
        type: 'custom',

        data: dados.map((faixa, indice) => [
          indice,
          faixa.percentual,
          faixa.quantidade
        ]),

        encode: {
          x: 1,
          y: 0
        },

        renderItem: (params, api) => {

          const indice = api.value(0)
          const percentual = api.value(1)
          const quantidade = api.value(2)

          const faixa = dados[indice]
          const cor = cores[faixa.classe]

          const largura = params.coordSys.width
          const y = api.coord([0, indice])[1]

          return {
            type: 'group',

            children: [

              // Círculo colorido
              {
                type: 'circle',
                shape: {
                  cx: 5,
                  cy: y - 12,
                  r: 4.5
                },
                style: {
                  fill: cor
                }
              },

              // Nome da classificação
              {
                type: 'text',
                style: {
                  x: 18,
                  y: y - 12,
                  text: faixa.nome,
                  fill: '#514438',
                  fontSize: 13,
                  fontWeight: 600,
                  verticalAlign: 'middle'
                }
              },

              // Quantidade de equipamentos
              {
                type: 'text',
                style: {
                  x: largura - 48,
                  y: y - 12,
                  text: String(quantidade),
                  fill: '#514438',
                  fontSize: 13,
                  fontWeight: 700,
                  align: 'right',
                  verticalAlign: 'middle'
                }
              },

              // Porcentagem
              {
                type: 'text',
                style: {
                  x: largura,
                  y: y - 12,
                  text: `${percentual}%`,
                  fill: '#999087',
                  fontSize: 12,
                  align: 'right',
                  verticalAlign: 'middle'
                }
              },

              // Fundo da barra
              {
                type: 'rect',
                shape: {
                  x: 0,
                  y: y + 4,
                  width: largura,
                  height: 8,
                  r: 4
                },
                style: {
                  fill: '#EDE9E5'
                }
              },

              // Preenchimento da barra
              {
                type: 'rect',
                ignore: percentual === 0,
                shape: {
                  x: 0,
                  y: y + 4,
                  width: largura * percentual / 100,
                  height: 8,
                  r: 4
                },
                style: {
                  fill: cor
                }
              },

              
            ]
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
        dados={dadosExportacao}
        nomeArquivo="distribuicao-saude"
      />
      </div>

      <ReactECharts
        ref={graficoRef}
        option={options}
        opts={{ renderer: 'svg' }}
        style={{
          width: '100%',
          height: '188px'
        }}
      />

      <div className="home-legenda-score">

        <span className="home-legenda-titulo">
          Classificação da saúde
        </span>

        <div className="home-legenda-faixas">

          {[
            { nome: 'Excelente', faixa: '90–100' },
            { nome: 'Boa', faixa: '75–89' },
            { nome: 'Atenção', faixa: '50–74' },
            { nome: 'Crítica', faixa: '0–49' }
          ].map((item) => (
            <div className="home-legenda-item" key={item.nome}>
              <span>{item.nome}</span>
              <span>{item.faixa}</span>
            </div>
          ))}

        </div>

      </div>
    </>
  )
}