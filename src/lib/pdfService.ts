import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface InvoiceData {
    studentName: string;
    courseTitle: string;
    amount: number;
    paymentMethod: string;
    transactionRef?: string;
    date: string;
    invoiceNumber: string;
}

export const generateInvoice = (data: InvoiceData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(30, 58, 138); // Dark blue primary
    doc.text('BOTES ACADEMY', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Formation en Trading & Investissement', pageWidth / 2, 27, { align: 'center' });

    // Divider
    doc.setDrawColor(200);
    doc.line(20, 35, pageWidth - 20, 35);

    // Invoice Title
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('FACTURE OFFICIELLE', 20, 50);

    // Details Grid
    doc.setFontSize(10);
    doc.text(`N° Facture : ${data.invoiceNumber}`, 20, 60);
    doc.text(`Date : ${format(new Date(data.date), 'PPP', { locale: fr })}`, 20, 65);

    // Student Info
    doc.setFontSize(12);
    doc.text('ÉLÈVE', 20, 80);
    doc.setFontSize(10);
    doc.text(data.studentName, 20, 87);

    // Table
    autoTable(doc, {
        startY: 100,
        head: [['Description', 'Méthode', 'Réf. Transaction', 'Montant']],
        body: [
            [
                data.courseTitle,
                data.paymentMethod,
                data.transactionRef || 'N/A',
                `${data.amount.toFixed(2)} USD`
            ]
        ],
        theme: 'striped',
        headStyles: { fillColor: [30, 58, 138], textColor: 255 },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 120;

    // Total
    doc.setFontSize(12);
    doc.text(`TOTAL PAYÉ : ${data.amount.toFixed(2)} USD`, pageWidth - 20, finalY + 20, { align: 'right' });

    // Status Stamp
    doc.setDrawColor(34, 197, 94); // Green
    doc.setTextColor(34, 197, 94);
    doc.setFontSize(20);
    doc.text('PAIEMENT VALIDÉ', pageWidth / 2, finalY + 40, { align: 'center', angle: -5 });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Botes Academy - Contact : academy@botes.com', pageWidth / 2, pageWidth === 210 ? 280 : 260, { align: 'center' });

    doc.save(`Facture_Botes_${data.invoiceNumber}.pdf`);
};

