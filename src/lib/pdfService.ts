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

export const generateBadge = (data: { studentName: string; courseTitle: string; date: string }) => {
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [148, 105] // A6
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Background color / Border
    doc.setDrawColor(30, 58, 138);
    doc.setLineWidth(2);
    doc.rect(5, 5, pageWidth - 10, pageHeight - 10);

    // Logo
    doc.setFontSize(18);
    doc.setTextColor(30, 58, 138);
    doc.text('BOTES ACADEMY', pageWidth / 2, 25, { align: 'center' });

    // Title
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('BADGE DE PARTICIPATION', pageWidth / 2, 35, { align: 'center' });

    // Student Name
    doc.setFontSize(22);
    doc.setTextColor(30, 58, 138);
    doc.text(data.studentName.toUpperCase(), pageWidth / 2, 55, { align: 'center' });

    // Target
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Inscrit au cours de :', pageWidth / 2, 65, { align: 'center' });

    doc.setFontSize(13);
    doc.setTextColor(0);
    doc.text(data.courseTitle, pageWidth / 2, 75, { align: 'center' });

    // Date
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(`Validé le : ${format(new Date(data.date), 'dd MMMM yyyy', { locale: fr })}`, pageWidth / 2, 90, { align: 'center' });

    doc.save(`Badge_Botes_${data.studentName.replace(/\s/g, '_')}.pdf`);
};

export const generateCertificate = (data: { studentName: string; courseTitle: string; date: string }) => {
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Bordure Extérieure Dorée
    doc.setDrawColor(218, 165, 32); // Goldenrod
    doc.setLineWidth(1.5);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    // Bordure Intérieure Décorative
    doc.setDrawColor(30, 58, 138); // Bleu Botes
    doc.setLineWidth(0.5);
    doc.rect(13, 13, pageWidth - 26, pageHeight - 26);

    // Coins Décoratifs
    const cornerSize = 20;
    doc.setLineWidth(2);
    // Haut-gauche
    doc.line(10, 10 + cornerSize, 10, 10);
    doc.line(10, 10, 10 + cornerSize, 10);
    // Haut-droite
    doc.line(pageWidth - 10 - cornerSize, 10, pageWidth - 10, 10);
    doc.line(pageWidth - 10, 10, pageWidth - 10, 10 + cornerSize);
    // Bas-gauche
    doc.line(10, pageHeight - 10 - cornerSize, 10, pageHeight - 10);
    doc.line(10, pageHeight - 10, 10 + cornerSize, pageHeight - 10);
    // Bas-droite
    doc.line(pageWidth - 10 - cornerSize, pageHeight - 10, pageWidth - 10, pageHeight - 10);
    doc.line(pageWidth - 10, pageHeight - 10, pageWidth - 10, pageHeight - 10 - cornerSize);

    // Contenu central
    doc.setFontSize(30);
    doc.setTextColor(30, 58, 138);
    doc.text('CERTIFICAT DE RÉUSSITE', pageWidth / 2, 45, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text('Ce certificat est fièrement décerné à', pageWidth / 2, 65, { align: 'center' });

    doc.setFontSize(36);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text(data.studentName.toUpperCase(), pageWidth / 2, 85, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text('pour avoir complété avec succès la formation de', pageWidth / 2, 105, { align: 'center' });

    doc.setFontSize(22);
    doc.setTextColor(30, 58, 138);
    doc.setFont('helvetica', 'bolditalic');
    doc.text(`"${data.courseTitle}"`, pageWidth / 2, 120, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text(`Délivré par BOTES ACADEMY le ${format(new Date(data.date), 'dd MMMM yyyy', { locale: fr })}`, pageWidth / 2, 140, { align: 'center' });

    // Sceau fictif
    doc.setDrawColor(218, 165, 32);
    doc.setFillColor(218, 165, 32);
    doc.circle(pageWidth / 2, 170, 15, 'FD');
    doc.setTextColor(255);
    doc.setFontSize(8);
    doc.text('OFFICIEL', pageWidth / 2, 168, { align: 'center' });
    doc.text('BOTES', pageWidth / 2, 172, { align: 'center' });

    // Signature
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(12);
    doc.text('La Direction', 40, 175);
    doc.setDrawColor(30, 58, 138);
    doc.line(30, 180, 70, 180);

    doc.text('Le Formateur', pageWidth - 70, 175);
    doc.line(pageWidth - 80, 180, pageWidth - 40, 180);

    doc.save(`Certificat_Botes_${data.studentName.replace(/\s/g, '_')}.pdf`);
};

