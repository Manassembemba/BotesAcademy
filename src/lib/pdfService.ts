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

export const generateBadge = (data: { studentName: string; courseTitle: string; photoUrl?: string }) => {
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: [85, 120] // Format badge standard
    });

    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();

    // Fond Gold/Bleu Premium
    doc.setFillColor(2, 8, 23); // Background dark
    doc.rect(0, 0, width, height, 'F');
    
    // Bordure Gold
    doc.setDrawColor(234, 179, 8);
    doc.setLineWidth(1);
    doc.rect(2, 2, width - 4, height - 4, 'D');

    // Header Botes Academy
    doc.setFontSize(14);
    doc.setTextColor(255);
    doc.text('BOTES ACADEMY', width / 2, 15, { align: 'center' });
    
    doc.setFontSize(6);
    doc.setTextColor(234, 179, 8);
    doc.text("L'ÉLITE DU TRADING", width / 2, 19, { align: 'center' });

    // Photo Placeholder (Cercle)
    doc.setDrawColor(234, 179, 8);
    doc.setFillColor(30, 41, 59);
    doc.circle(width / 2, 45, 15, 'FD');
    doc.setTextColor(255);
    doc.setFontSize(8);
    doc.text('PHOTO', width / 2, 46, { align: 'center' });

    // Student Name
    doc.setFontSize(12);
    doc.setTextColor(255);
    doc.text(data.studentName.toUpperCase(), width / 2, 70, { align: 'center' });

    // Course Name
    doc.setFontSize(8);
    doc.setTextColor(200);
    doc.text('Formation :', width / 2, 78, { align: 'center' });
    doc.setTextColor(234, 179, 8);
    doc.setFontSize(9);
    doc.text(data.courseTitle, width / 2, 83, { align: 'center' });

    // QR Code Placeholder
    doc.setFillColor(255);
    doc.rect(width / 2 - 10, 95, 20, 20, 'F');
    doc.setTextColor(0);
    doc.setFontSize(5);
    doc.text('VÉRIFIÉ', width / 2, 106, { align: 'center' });

    doc.save(`Badge_Botes_${data.studentName.replace(' ', '_')}.pdf`);
};

