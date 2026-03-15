// [130] Export translation history to PDF.
// Uses html2canvas so the browser renders the content (with system CJK fonts),
// then embeds the resulting image into a jsPDF document — no font embedding needed.
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface ExportRecord {
  originalText: string;
  translatedText: string;
  timestamp: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function exportToTxt(topicTitle: string, records: ExportRecord[]): void {
  const lines: string[] = [
    `Topic: ${topicTitle}`,
    `导出时间：${new Date().toLocaleString()}`,
    '',
    '─'.repeat(48),
    '',
  ];

  records.forEach((r, i) => {
    lines.push(`#${i + 1}  ${new Date(r.timestamp).toLocaleString()}`);
    lines.push(`O: ${r.originalText}`);
    lines.push(`T: ${r.translatedText}`);
    if (i < records.length - 1) {
      lines.push('');
      lines.push('─'.repeat(48));
      lines.push('');
    }
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${topicTitle.replace(/[^\w\u4e00-\u9fff]/g, '_')}_history.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportToPdf(topicTitle: string, records: ExportRecord[]): Promise<void> {
  // Build a hidden div that the browser will render with its own font stack (supports CJK)
  const container = document.createElement('div');
  container.style.cssText = [
    'position:fixed',
    'left:-9999px',
    'top:0',
    'width:794px',          // roughly A4 at 96 dpi
    'background:#ffffff',
    'padding:40px 48px',
    "font-family:system-ui,-apple-system,'PingFang SC','Microsoft YaHei','Noto Sans SC',sans-serif",
    'font-size:14px',
    'color:#1e293b',
    'line-height:1.6',
  ].join(';');

  const rows = records.map((r, i) => `
    <div style="margin-bottom:16px;">
      <p style="font-size:11px;color:#94a3b8;margin:0 0 4px;">
        #${i + 1}&nbsp;&nbsp;${new Date(r.timestamp).toLocaleString()}
      </p>
      <p style="margin:0 0 3px;">
        <span style="font-weight:700;color:#94a3b8;">O:</span>&nbsp;${escapeHtml(r.originalText)}
      </p>
      <p style="margin:0;color:#3730a3;">
        <span style="font-weight:700;color:#6366f1;">T:</span>&nbsp;${escapeHtml(r.translatedText)}
      </p>
      ${i < records.length - 1 ? '<hr style="border:none;border-top:1px solid #e2e8f0;margin-top:16px;" />' : ''}
    </div>
  `).join('');

  container.innerHTML = `
    <h1 style="font-size:22px;font-weight:600;margin:0 0 6px;">${escapeHtml(topicTitle)}</h1>
    <p style="font-size:11px;color:#94a3b8;margin:0 0 16px;">导出时间：${new Date().toLocaleString()}</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin-bottom:20px;" />
    ${rows}
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgH = (canvas.height * pageW) / canvas.width;

    let remaining = imgH;
    let offset = 0;

    pdf.addImage(imgData, 'PNG', 0, offset, pageW, imgH);
    remaining -= pageH;

    while (remaining > 0) {
      offset -= pageH;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, offset, pageW, imgH);
      remaining -= pageH;
    }

    const filename = `${topicTitle.replace(/[^\w\u4e00-\u9fff]/g, '_')}_history.pdf`;
    pdf.save(filename);
  } finally {
    document.body.removeChild(container);
  }
}
