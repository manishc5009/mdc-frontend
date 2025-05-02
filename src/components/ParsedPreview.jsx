import { useState } from 'react'

export default function ParsedPreview({ data }) {
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 20
  const totalPages = Math.ceil(data.length / rowsPerPage)

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  const startIndex = (currentPage - 1) * rowsPerPage
  const currentRows = data.slice(startIndex, startIndex + rowsPerPage)

  return (
    <div className="mt-6 bg-white p-4 rounded-md shadow">
      <h2 className="text-lg font-semibold mb-2 parsedHead">Parsed Data Preview:</h2>
      <h4 className='parsedSubHead'>Here is a quick glance at your extracted spreadsheet data.</h4>
      <div className="parsed-preview-wrapper">
        <div className="overflow-x-auto">
          <table className="parsed-preview-table">
            <thead>
              <tr>
                {Object.keys(data[0] || {}).map((key) => (
                  <th key={key} className="text-left font-medium text-gray-600 pr-4 pb-2">{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentRows.map((row, i) => (
                <tr key={startIndex + i}>
                  {Object.values(row).map((val, idx) => (
                    <td key={idx} className="pr-4 py-1 text-gray-700">{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex justify-between mt-4 items-center paginationPage">
        <button
          onClick={handlePrevPage}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="mx-4 self-center">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  )
}
