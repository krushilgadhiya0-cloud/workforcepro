import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function downloadReceipt(data: {
  companyName: string;
  workerName: string;
  amount: number;
  paymentDate: string;
  transactionId: string;
}) {
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text('Payment Receipt', 105, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`Company: ${data.companyName}`, 20, 40);
  doc.text(`Worker: ${data.workerName}`, 20, 50);
  doc.text(`Amount: ₹${data.amount.toLocaleString('en-IN')}`, 20, 60);
  doc.text(`Payment Date: ${data.paymentDate}`, 20, 70);
  doc.text(`Transaction ID: ${data.transactionId}`, 20, 80);
  doc.save(`receipt-${data.transactionId}.pdf`);
}

export function downloadReport(title: string, headers: string[], rows: string[][], format: 'pdf' | 'excel') {
  if (format === 'pdf') {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(title, 14, 20);
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 30,
    });
    doc.save(`${title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  } else {
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '-').toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
