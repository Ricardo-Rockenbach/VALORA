import { useState } from 'react'
import { Download } from 'lucide-react'

import { exportarSVG, exportarCSV, exportarExcel } from '../servicos/exportarServico'

import '../paginas/css/menuExportar.css'

export default function MenuExportacao({
  graficoRef,
  dados,
  nomeArquivo
}) {

  const [aberto, setAberto] = useState(false)

  function exportar(formato) {

    if (formato === 'svg') {
      exportarSVG(
        graficoRef.current?.getEchartsInstance(),
        nomeArquivo
      )
    }

    if (formato === 'csv') {
      exportarCSV(dados, nomeArquivo)
    }

    if (formato === 'xlsx') {
      exportarExcel(dados, nomeArquivo)
    }

    setAberto(false)
  }

  return (
    <div className="menu-exportacao">

      <button
        type="button"
        className="menu-exportacao-botao"
        onClick={() => setAberto(!aberto)}
        aria-label="Exportar gráfico"
        aria-expanded={aberto}
      >
        <Download size={19} />
      </button>

      {aberto && (
        <div className="menu-exportacao-opcoes">

          <button onClick={() => exportar('svg')}>
            Exportar SVG
          </button>

          <button onClick={() => exportar('csv')}>
            Exportar CSV
          </button>

          <button onClick={() => exportar('xlsx')}>
            Exportar Excel
          </button>

        </div>
      )}

    </div>
  )
}