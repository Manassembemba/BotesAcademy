export const SITE_URL = Deno.env.get("SITE_URL") || "https://botes.academy";

export const commonStyles = `
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff; }
    .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #f1f5f9; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center; color: #94a3b8; font-size: 11px; }
    .button { display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; margin: 20px 0; }
    .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; }
    h1 { color: #3b82f6; margin: 0; font-size: 24px; letter-spacing: -1px; }
    h2 { color: #1e293b; font-size: 20px; margin-top: 0; }
`;

export const baseLayout = (content: string) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>${commonStyles}</style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>BOTES ACADEMY</h1>
                <p style="color: #94a3b8; font-size: 12px; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">Formation & Excellence</p>
            </div>
            ${content}
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Botes Academy. Tous droits réservés.</p>
                <div style="margin-top: 10px;">
                    <a href="${SITE_URL}" style="text-decoration: none; color: #3b82f6; font-weight: bold;">Accéder à la plateforme</a>
                </div>
            </div>
        </div>
    </body>
    </html>
`;

export const getDailyReportTemplate = (stats: any) => {
    const content = `
        <h2>Rapport Quotidien d'Activité</h2>
        <p>Voici le résumé des activités de ces dernières 24 heures pour Botes Academy.</p>
        
        <div class="card">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;"><strong>Nouveaux Étudiants :</strong></td>
                    <td style="text-align: right; padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #3b82f6; font-weight: bold;">+${stats.newStudents}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;"><strong>Chiffre d'Affaires :</strong></td>
                    <td style="text-align: right; padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #10b981; font-weight: bold;">${stats.revenue} €</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;"><strong>Absences Signalées :</strong></td>
                    <td style="text-align: right; padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #f59e0b; font-weight: bold;">${stats.absences}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0;"><strong>Commentaires à traiter :</strong></td>
                    <td style="text-align: right; padding: 10px 0; color: #ef4444; font-weight: bold;">${stats.comments}</td>
                </tr>
            </table>
        </div>

        <div style="text-align: center;">
            <a href="${SITE_URL}/admin/dashboard" class="button">Tableau de Bord Admin</a>
        </div>
    `;
    return baseLayout(content);
};

export const getWelcomeTemplate = (fullName: string) => {
    const content = `
        <h2>Bienvenue chez Botes Academy ! 🚀</h2>
        <p>Félicitations, <strong>${fullName}</strong> ! Nous sommes ravis de vous compter parmi nos nouveaux étudiants.</p>
        <p>Vous avez désormais accès à notre catalogue complet de formations, stratégies et outils premium.</p>
        <div style="text-align: center;">
            <a href="${SITE_URL}/auth" class="button">📚 Accéder à mon espace</a>
        </div>
    `;
    return baseLayout(content);
};

export const getPasswordChangedTemplate = (fullName: string) => {
    const content = `
        <h2>Sécurité : Mot de passe modifié 🛡️</h2>
        <p>Bonjour ${fullName}, le mot de passe de votre compte vient d'être mis à jour.</p>
        <div class="card">
            <p style="margin: 0; font-weight: bold;">Date : ${new Date().toLocaleString('fr-FR')}</p>
        </div>
        <p style="color: #ef4444; font-weight: bold;">Si vous n'êtes pas à l'origine de cette action, contactez le support immédiatement.</p>
    `;
    return baseLayout(content);
};

export const getAttendanceAbsentTemplate = (fullName: string, data: any) => {
    const content = `
        <h2>Avis d'absence 🚩</h2>
        <p>Bonjour ${fullName}, nous avons remarqué votre absence lors de la session du <strong>${data.date}</strong> pour le cours : <strong>${data.courseTitle}</strong>.</p>
        <div class="card" style="background-color: #fff7ed; border-color: #ffedd5; color: #9a3412;">
            <strong>État : Absent</strong>
        </div>
        <div style="text-align: center;">
            <a href="${SITE_URL}/dashboard" class="button">📅 Voir mon calendrier</a>
        </div>
    `;
    return baseLayout(content);
};

export const getMarketplaceDeliveryTemplate = (fullName: string, data: { productTitle: string, productType: string, actionUrl: string, extraInfo?: string }) => {
    let deliveryLabel = "Accéder à ma formation";
    let deliveryColor = "#3b82f6";
    let icon = "📚";

    if (data.productType === "indicator") {
        deliveryLabel = "Télécharger l'Indicateur";
        deliveryColor = "#10b981";
        icon = "⚙️";
    } else if (data.productType === "strategy") {
        deliveryLabel = "Voir la Stratégie";
        deliveryColor = "#8b5cf6";
        icon = "🧠";
    }

    const content = `
        <h2 style="color: ${deliveryColor};">Félicitations ${fullName} ! ${icon}</h2>
        <p>Votre paiement pour <strong>${data.productTitle}</strong> a été approuvé. Votre accès est désormais actif.</p>
        
        <div class="card" style="border-color: ${deliveryColor}22; background-color: ${deliveryColor}05;">
            <p><strong>Produit :</strong> ${data.productTitle}</p>
            ${data.extraInfo ? `<p style="font-size: 14px; color: #64748b; margin-top: 10px; padding: 10px; background: white; border-radius: 8px; border: 1px dashed #e2e8f0;">${data.extraInfo}</p>` : ''}
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${data.actionUrl}" class="button" style="background-color: ${deliveryColor};">${deliveryLabel}</a>
        </div>

        <p style="font-size: 13px; color: #94a3b8; text-align: center;">Si le bouton ne fonctionne pas, copiez-collez ce lien : <br/> <span style="word-break: break-all; color: ${deliveryColor};">${data.actionUrl}</span></p>
    `;
    return baseLayout(content);
};

export const getPaymentPendingTemplate = (fullName: string, productTitle: string) => {
    const content = `
        <h2>Récépissé de paiement reçu 🧾</h2>
        <p>Bonjour ${fullName}, nous avons bien reçu votre preuve de paiement pour <strong>${productTitle}</strong>.</p>
        <div class="card">
            <p style="margin: 0;">Un administrateur va vérifier votre transaction sous peu. Vous recevrez un nouvel e-mail dès que votre produit sera disponible.</p>
        </div>
        <p>Merci de patienter pendant le traitement de votre demande.</p>
    `;
    return baseLayout(content);
};

export const getPaymentRejectedTemplate = (fullName: string, productTitle: string, reason: string) => {
    const content = `
        <h2 style="color: #ef4444;">Action requise : Paiement refusé ❌</h2>
        <p>Bonjour ${fullName}, nous n'avons pas pu valider votre preuve de paiement pour <strong>${productTitle}</strong>.</p>
        <div class="card" style="background-color: #fef2f2; border-color: #fecdd3; color: #991b1b;">
            <p><strong>Motif du refus :</strong><br/> ${reason}</p>
        </div>
        <p>Veuillez soumettre une nouvelle preuve de paiement valide depuis la marketplace pour débloquer votre accès.</p>
        <div style="text-align: center;">
            <a href="${SITE_URL}/marketplace" class="button" style="background-color: #ef4444;">Réessayer le paiement</a>
        </div>
    `;
    return baseLayout(content);
};
