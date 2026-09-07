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
    doc.text('Formation Professionnelle & Certifiante', pageWidth / 2, 27, { align: 'center' });

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

export interface AttendanceReportData {
    courseTitle: string;
    courseCategory?: string;
    courseMode?: string;
    date: string;
    vacation: string; // 'MATIN' | 'MIDI' | 'SOIR' | 'Toutes vacations'
    teacherName?: string;
    stats: {
        total: number;
        presentCount: number;
        lateCount: number;
        absentCount: number;
        rate: number;
    };
    students: Array<{
        matricule: string;
        fullName: string;
        phone?: string;
        vacation: string;
        status: 'present' | 'late' | 'absent' | 'unrecorded';
        notes?: string;
    }>;
    isPrintBlankSheet?: boolean;
}

export const generateAttendanceReport = (data: AttendanceReportData) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // 1. En-tête Institutionnel
    doc.setFillColor(15, 23, 42); // Navy 900
    doc.rect(0, 0, pageWidth, 28, 'F');

    // Accent Gold
    doc.setFillColor(234, 179, 8); // Gold 500
    doc.rect(0, 28, pageWidth, 2, 'F');

    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('BOTES ACADEMY', 14, 12);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225); // Slate 300
    doc.text("DÉPARTEMENT PÉDAGOGIQUE • DIRECTION ACADÉMIQUE", 14, 18);
    doc.text("Excellence • Rigueur • Performance Professionnelle", 14, 23);

    // Titre de droite
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(254, 240, 138); // Yellow 200
    doc.text(
        data.isPrintBlankSheet ? "FEUILLE D'ÉMARGEMENT VIERGE" : "RAPPORT D'ÉMARGEMENT & PRÉSENCES",
        pageWidth - 14,
        14,
        { align: 'right' }
    );
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(255, 255, 255);
    doc.text(
        `Édité le ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}`,
        pageWidth - 14,
        21,
        { align: 'right' }
    );

    // 2. Bloc Métadonnées
    let currentY = 36;
    doc.setDrawColor(226, 232, 240); // Border slate 200
    doc.setFillColor(248, 250, 252); // Bg slate 50
    doc.roundedRect(14, currentY, pageWidth - 28, 26, 3, 3, 'FD');

    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105); // Slate 600

    // Colonne gauche
    doc.setFont('helvetica', 'bold');
    doc.text("Formation :", 18, currentY + 7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const displayTitle = data.courseTitle.length > 40 ? `${data.courseTitle.slice(0, 38)}...` : data.courseTitle;
    doc.text(`${displayTitle.toUpperCase()} (${data.courseCategory || 'Cursus Pro'})`, 42, currentY + 7);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text("Date Session :", 18, currentY + 14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(format(new Date(data.date), 'EEEE dd MMMM yyyy', { locale: fr }), 42, currentY + 14);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text("Créneau Session :", 18, currentY + 21);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(data.vacation, 48, currentY + 21);

    // Colonne droite
    const col2X = pageWidth / 2 + 10;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text("Formateur Référent :", col2X, currentY + 7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(data.teacherName || "Non spécifié", col2X + 33, currentY + 7);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text("Mode de Cursus :", col2X, currentY + 14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(data.courseMode || "Présentiel / Hybride", col2X + 33, currentY + 14);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text("Réf. Document :", col2X, currentY + 21);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(`BOTES-ATT-${format(new Date(data.date), 'yyyyMMdd')}`, col2X + 33, currentY + 21);

    currentY += 31;

    // 3. Synthèse Chiffrée (Cartouches KPI) si rapport avec pointage
    if (!data.isPrintBlankSheet) {
        const kpiWidth = (pageWidth - 28 - 12) / 5;
        const kpis = [
            { label: 'INSCRITS', value: data.stats.total, bg: [241, 245, 249], border: [203, 213, 225], text: [15, 23, 42] },
            { label: 'PRÉSENTS', value: data.stats.presentCount, bg: [220, 252, 231], border: [134, 239, 172], text: [21, 128, 61] },
            { label: 'EN RETARD', value: data.stats.lateCount, bg: [254, 243, 199], border: [253, 224, 71], text: [180, 83, 9] },
            { label: 'ABSENTS', value: data.stats.absentCount, bg: [254, 226, 226], border: [252, 165, 165], text: [185, 28, 28] },
            { label: 'ASSIDUITÉ', value: `${data.stats.rate}%`, bg: [224, 231, 255], border: [165, 180, 252], text: [67, 56, 202] },
        ];

        kpis.forEach((kpi, idx) => {
            const x = 14 + idx * (kpiWidth + 3);
            doc.setFillColor(kpi.bg[0], kpi.bg[1], kpi.bg[2]);
            doc.setDrawColor(kpi.border[0], kpi.border[1], kpi.border[2]);
            doc.roundedRect(x, currentY, kpiWidth, 13, 2, 2, 'FD');

            doc.setFontSize(6.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(kpi.text[0], kpi.text[1], kpi.text[2]);
            doc.text(kpi.label, x + kpiWidth / 2, currentY + 4.5, { align: 'center' });

            doc.setFontSize(10.5);
            doc.text(String(kpi.value), x + kpiWidth / 2, currentY + 10.5, { align: 'center' });
        });

        currentY += 17;
    }

    // 4. Tableau des Inscrits & Émargements
    const tableBody = data.students.map((st, idx) => {
        let statusLabel = 'NON POINTÉ';
        if (st.status === 'present') statusLabel = 'PRÉSENT';
        else if (st.status === 'late') statusLabel = 'EN RETARD';
        else if (st.status === 'absent') statusLabel = 'ABSENT';

        if (data.isPrintBlankSheet) {
            statusLabel = '[   ] P   [   ] R   [   ] A';
        }

        return [
            String(idx + 1),
            st.matricule || 'N/A',
            st.fullName,
            st.phone || '—',
            st.vacation || '—',
            statusLabel,
            st.notes || '',
            '' // Espace signature
        ];
    });

    autoTable(doc, {
        startY: currentY,
        head: [['N°', 'Matricule', 'Nom & Prénom', 'Téléphone', 'Vacation', 'Statut', 'Observation', 'Émargement']],
        body: tableBody,
        theme: 'grid',
        margin: { left: 14, right: 14, bottom: 35 },
        headStyles: {
            fillColor: [15, 23, 42],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 8,
            halign: 'center',
            minCellHeight: 8
        },
        styles: {
            fontSize: 7.5,
            cellPadding: 2.5,
            valign: 'middle',
            lineColor: [226, 232, 240]
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 7 },
            1: { halign: 'center', cellWidth: 23, fontStyle: 'bold' },
            2: { cellWidth: 44, fontStyle: 'bold' },
            3: { halign: 'center', cellWidth: 23 },
            4: { halign: 'center', cellWidth: 17 },
            5: { halign: 'center', cellWidth: 25 },
            6: { cellWidth: 21 },
            7: { cellWidth: 22 } // Émargement / signature
        },
        didParseCell: (hookData) => {
            if (hookData.section === 'body' && hookData.column.index === 5 && !data.isPrintBlankSheet) {
                const text = String(hookData.cell.raw).toUpperCase();
                if (text === 'PRÉSENT') {
                    hookData.cell.styles.textColor = [22, 101, 52];
                    hookData.cell.styles.fillColor = [220, 252, 231];
                    hookData.cell.styles.fontStyle = 'bold';
                } else if (text === 'EN RETARD') {
                    hookData.cell.styles.textColor = [154, 52, 18];
                    hookData.cell.styles.fillColor = [254, 243, 199];
                    hookData.cell.styles.fontStyle = 'bold';
                } else if (text === 'ABSENT') {
                    hookData.cell.styles.textColor = [153, 27, 27];
                    hookData.cell.styles.fillColor = [254, 226, 226];
                    hookData.cell.styles.fontStyle = 'bold';
                }
            }
        },
        didDrawPage: (hookData) => {
            // Footer sur chaque page
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(148, 163, 184); // Slate 400
            doc.text(
                'Botes Academy • Document officiel d’émargement académique • Tous droits réservés',
                14,
                pageHeight - 8
            );
            doc.text(
                `Page ${hookData.pageNumber}`,
                pageWidth - 14,
                pageHeight - 8,
                { align: 'right' }
            );
        }
    });

    // 5. Bloc de validation & Signatures sur la dernière page
    const finalTableY = (doc as any).lastAutoTable?.finalY || currentY + 50;

    // Si pas assez de place sur la page pour le bloc signature, ajouter une page
    if (finalTableY > pageHeight - 34) {
        doc.addPage();
    }

    const signBoxY = finalTableY > pageHeight - 34 ? 20 : finalTableY + 8;

    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, signBoxY, pageWidth - 28, 22, 2, 2, 'FD');

    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'bold');
    doc.text("Observations Générales du Formateur :", 18, signBoxY + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.text("Séance dispensée conformément au syllabus académique.", 18, signBoxY + 10.5);

    // Signatures
    const signCol1 = 18;
    const signCol2 = pageWidth / 2 + 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(`Visa du Formateur Référent :`, signCol1, signBoxY + 16);
    doc.setFont('helvetica', 'normal');
    doc.text(data.teacherName ? `(${data.teacherName})` : "(Signature)", signCol1 + 42, signBoxY + 16);

    doc.setFont('helvetica', 'bold');
    doc.text(`Cachet de la Direction Académique :`, signCol2, signBoxY + 16);
    doc.setFont('helvetica', 'normal');
    doc.text("(Botes Academy)", signCol2 + 50, signBoxY + 16);

    const safeTitle = data.courseTitle.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 25);
    const dateFormatted = format(new Date(data.date), 'yyyy-MM-dd');
    const fileName = data.isPrintBlankSheet 
        ? `Emargement_Vierge_${safeTitle}_${dateFormatted}.pdf` 
        : `Rapport_Presence_${safeTitle}_${dateFormatted}.pdf`;

    doc.save(fileName);
};


