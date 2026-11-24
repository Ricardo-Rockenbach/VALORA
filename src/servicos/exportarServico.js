import * as XLSX from 'xlsx'


// Função auxiliar para realizar downloads
function baixarArquivo(url, nomeArquivo) {

  const link = document.createElement('a')

  link.href = url
  link.download = nomeArquivo

  document.body.appendChild(link)

  link.click()
  link.remove()
}


// Exportação de dados em CSV
export function exportarCSV(dados, nomeArquivo) {

  if (!dados || !dados.length) return

  const colunas = Object.keys(dados[0])

  const escapar = (valor) =>
    `"${String(valor ?? '').replace(/"/g, '""')}"`

  const cabecalho = colunas
    .map(escapar)
    .join(';')

  const linhas = dados.map(item =>
    colunas.map(coluna =>
      escapar(item[coluna])
    ).join(';')
  )

  const conteudo = [
    cabecalho,
    ...linhas
  ].join('\r\n')

  const arquivo = new Blob(
    ['\uFEFF', conteudo],
    { type: 'text/csv;charset=utf-8;' }
  )

  const url = URL.createObjectURL(arquivo)

  baixarArquivo(url, `${nomeArquivo}.csv`)

  setTimeout(() => URL.revokeObjectURL(url), 1000)
}


// Exportação do gráfico em SVG
export function exportarSVG(grafico, nomeArquivo) {

  if (!grafico) return

  const url = grafico.getDataURL({
    type: 'svg',
    backgroundColor: '#ffffff'
  })

  baixarArquivo(url, `${nomeArquivo}.svg`)
}


// Exportação de dados em Excel
export function exportarExcel(dados, nomeArquivo) {

  if (!dados || !dados.length) return

  const planilha = XLSX.utils.json_to_sheet(dados)

  const pastaTrabalho = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(
    pastaTrabalho,
    planilha,
    'Dados'
  )

  XLSX.writeFile(
    pastaTrabalho,
    `${nomeArquivo}.xlsx`
  )
}