/**
 * Report Generator Utility
 * Handles generation and export of various reports in CSV, XLSX, and PDF formats
 */

import { StudentCheckinReport, BoothReport } from './database-models'

interface ReportData {
  title: string
  generatedAt: string
  data: any[]
}

/**
 * Generate CSV content from data
 */
export function generateCSV(data: ReportData): string {
  const { title, generatedAt, data: rows } = data

  if (rows.length === 0) {
    return 'Không có dữ liệu để xuất'
  }

  // Get headers from first row
  const headers = Object.keys(rows[0])

  // Create CSV content
  const csvContent = [
    `${title}`,
    `Tạo lúc: ${generatedAt}`,
    '',
    headers.join(','),
    ...rows.map((row) => headers.map((header) => `"${row[header] || ''}"`).join(',')),
  ].join('\n')

  return csvContent
}

/**
 * Download file as CSV
 */
export function downloadCSV(csvContent: string, fileName: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `${fileName}-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * Generate Student Checkin Report
 */
export function generateStudentCheckinReport(checkins: any[], eventName: string) {
  const reportData: ReportData = {
    title: `Báo cáo check-in sinh viên - ${eventName}`,
    generatedAt: new Date().toLocaleString('vi-VN'),
    data: checkins.map((c) => ({
      'MSSV': c.mssv,
      'Tên sinh viên': c.studentName,
      'Ngành': c.major,
      'Gian hàng': c.boothName,
      'Thời gian check-in': c.checkInTime,
      'Thời gian tham gia (phút)': c.duration,
      'Trạng thái': c.status === 'completed' ? 'Hoàn thành' : 'Đang thăm',
    })),
  }

  return reportData
}

/**
 * Generate Booth Performance Report
 */
export function generateBoothPerformanceReport(booths: any[], eventName: string) {
  const reportData: ReportData = {
    title: `Báo cáo hiệu suất gian hàng - ${eventName}`,
    generatedAt: new Date().toLocaleString('vi-VN'),
    data: booths.map((b) => ({
      'Tên gian hàng': b.name,
      'Công ty': b.company,
      'Tổng khách': b.visitorCount,
      'Lượt quét': b.scanCount,
      'Trung bình quét/khách': (b.scanCount / b.visitorCount).toFixed(2),
      'Vị trí': b.position,
      'Nhân viên': b.staffName,
    })),
  }

  return reportData
}

/**
 * Generate Summary Report
 */
export function generateSummaryReport(stats: any, eventName: string) {
  const reportData: ReportData = {
    title: `Báo cáo tổng hợp - ${eventName}`,
    generatedAt: new Date().toLocaleString('vi-VN'),
    data: [
      { 'Chỉ tiêu': 'Tổng sinh viên check-in', 'Số lượng': stats.totalVisitors },
      { 'Chỉ tiêu': 'Tổng gian hàng', 'Số lượng': stats.totalBooths },
      { 'Chỉ tiêu': 'Tổng lượt quét', 'Số lượng': stats.totalScans },
      { 'Chỉ tiêu': 'Quét/gian hàng', 'Số lượng': stats.averageScansPerBooth.toFixed(2) },
    ],
  }

  return reportData
}

/**
 * Generate Hourly Distribution Report
 */
export function generateHourlyDistributionReport(peakHours: any[], eventName: string) {
  const reportData: ReportData = {
    title: `Báo cáo phân bố theo giờ - ${eventName}`,
    generatedAt: new Date().toLocaleString('vi-VN'),
    data: peakHours.map((h) => ({
      'Giờ': `${h.hour}:00`,
      'Số lượng check-in': h.count,
    })),
  }

  return reportData
}

/**
 * Generate Major Distribution Report
 */
export function generateMajorDistributionReport(checkins: any[], eventName: string) {
  const majorMap = new Map<string, number>()

  checkins.forEach((c) => {
    const count = majorMap.get(c.major) || 0
    majorMap.set(c.major, count + 1)
  })

  const reportData: ReportData = {
    title: `Báo cáo phân bố theo ngành - ${eventName}`,
    generatedAt: new Date().toLocaleString('vi-VN'),
    data: Array.from(majorMap, ([major, count]) => ({
      'Ngành': major,
      'Số sinh viên': count,
      'Phần trăm': ((count / checkins.length) * 100).toFixed(1) + '%',
    })),
  }

  return reportData
}

/**
 * Export multiple reports at once
 */
export function exportBulkReports(reports: ReportData[], zipFileName: string) {
  // In a real application, you would zip these files
  // For now, we'll create separate downloads
  reports.forEach((report) => {
    const csv = generateCSV(report)
    const fileName = report.title.replace(/\s+/g, '-').toLowerCase()
    downloadCSV(csv, fileName)
  })
}

/**
 * Generate HTML Report for printing/viewing
 */
export function generateHTMLReport(
  title: string,
  sections: Array<{ heading: string; data: any[] }>
): string {
  const generatedAt = new Date().toLocaleString('vi-VN')

  const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          color: #333;
          margin: 20px;
          background-color: #f5f5f5;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #3B82F6;
          padding-bottom: 15px;
        }
        .header h1 {
          margin: 0;
          color: #3B82F6;
        }
        .header p {
          margin: 5px 0;
          color: #666;
        }
        .section {
          background-color: white;
          margin-bottom: 20px;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .section h2 {
          color: #3B82F6;
          border-bottom: 1px solid #e0e0e0;
          padding-bottom: 10px;
          margin-top: 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        th {
          background-color: #f0f0f0;
          padding: 10px;
          text-align: left;
          font-weight: bold;
          border-bottom: 2px solid #3B82F6;
        }
        td {
          padding: 8px 10px;
          border-bottom: 1px solid #e0e0e0;
        }
        tr:hover {
          background-color: #f9f9f9;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #999;
          font-size: 12px;
        }
        @media print {
          body {
            background-color: white;
            margin: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <p>Sự kiện: DUT Job Fair 2025</p>
        <p>Tạo lúc: ${generatedAt}</p>
      </div>

      ${sections
        .map(
          (section) => `
        <div class="section">
          <h2>${section.heading}</h2>
          <table>
            <thead>
              <tr>
                ${Object.keys(section.data[0] || {})
                  .map((key) => `<th>${key}</th>`)
                  .join('')}
              </tr>
            </thead>
            <tbody>
              ${section.data
                .map(
                  (row) => `
                <tr>
                  ${Object.values(row)
                    .map((val) => `<td>${val}</td>`)
                    .join('')}
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      `
        )
        .join('')}

      <div class="footer">
        <p>Đây là một báo cáo tự động được tạo từ hệ thống quản lý Hội chợ việc làm DUT 2025</p>
      </div>
    </body>
    </html>
  `

  return html
}

/**
 * Print HTML Report
 */
export function printHTMLReport(htmlContent: string) {
  const printWindow = window.open('', '', 'height=600,width=800')
  printWindow?.document.write(htmlContent)
  printWindow?.document.close()
  setTimeout(() => {
    printWindow?.print()
  }, 250)
}

/**
 * Download HTML Report as file
 */
export function downloadHTMLReport(htmlContent: string, fileName: string) {
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `${fileName}-${new Date().toISOString().split('T')[0]}.html`)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}
