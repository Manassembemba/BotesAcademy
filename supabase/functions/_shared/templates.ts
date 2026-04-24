/**
 * BOTES ACADEMY - CENTRAL EMAIL ENGINE
 * Ce fichier centralise le design et le contenu de toutes les communications par email.
 */

const APP_URL = "https://botesacademy.com"; // À adapter selon l'env
const BRAND_COLOR = "#3b82f6";
const DARK_COLOR = "#1e293b";

/**
 * Structure de base partagée par tous les emails
 */
const getBaseLayout = (content: string) => `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #f1f5f9; border-radius: 24px; background-color: #ffffff; color: #1e293b;">
    <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: ${BRAND_COLOR}; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin: 0;">BOTES ACADEMY</h1>
        <p style="color: #64748b; font-size: 10px; font-weight: 700; text-transform: uppercase; margin-top: 4px; letter-spacing: 2px;">Elite Trading Education</p>
    </div>

    ${content}

    <div style="text-align: center; margin-top: 40px;">
        <a href="${APP_URL}" style="display: inline-block; background-color: ${DARK_COLOR}; color: #ffffff; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 14px;">
            Accéder à mon espace personnel
        </a>
    </div>

    <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 40px 0;" />
    
    <div style="text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
        <p style="margin: 0;">© ${new Date().getFullYear()} Botes Academy. Tous droits réservés.</p>
        <p style="margin: 5px 0 0 0;">Ceci est un message automatique de l'administration. Veuillez ne pas y répondre directement.</p>
    </div>
</div>
`;

/**
 * 1. Template de BIENVENUE
 */
export const getWelcomeTemplate = (fullName: string, courseTitle: string, resetLink: string | null) => {
    const content = `
    <h2 style="font-size: 20px; margin-bottom: 24px;">Bienvenue parmi l'élite, ${fullName} ! 🎉</h2>
    
    <p style="line-height: 1.6; font-size: 15px; color: #475569;">
        Votre compte a été créé avec succès. Vous êtes désormais inscrit à la formation : 
        <strong style="color: ${DARK_COLOR};">${courseTitle}</strong>.
    </p>

    <div style="background-color: #f8fafc; border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #e2e8f0; text-align: center;">
        ${resetLink ? `
            <p style="margin-bottom: 20px; font-size: 14px; color: #475569;">Cliquez sur le bouton ci-dessous pour définir votre mot de passe et activer vos accès :</p>
            <a href="${resetLink}" style="background-color: ${BRAND_COLOR}; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Définir mon mot de passe</a>
        ` : `
            <p style="margin: 0; color: #f59e0b; font-weight: 600;">Utilisez vos identifiants habituels pour vous connecter.</p>
        `}
    </div>
    `;
    return getBaseLayout(content);
};

/**
 * 2. Template de REÇU DE PAIEMENT (Tranches)
 */
export const getReceiptTemplate = (fullName: string, courseTitle: string, amount: number, method: string, balance: number) => {
    const isSolded = balance <= 0;
    const content = `
    <h2 style="font-size: 18px; margin-bottom: 24px;">Confirmation de paiement</h2>
    
    <p style="line-height: 1.6; font-size: 14px; color: #475569;">
        Bonjour ${fullName}, nous confirmons la réception de votre versement pour <strong>${courseTitle}</strong>.
    </p>

    <div style="background-color: #f8fafc; border-radius: 16px; padding: 24px; margin: 32px 0; border: 1px solid #e2e8f0;">
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 8px 0; font-size: 13px; color: #64748b;">Montant versé</td>
                <td style="padding: 8px 0; font-size: 16px; font-weight: 800; text-align: right; color: #10b981;">$${amount}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; font-size: 13px; color: #64748b;">Mode de paiement</td>
                <td style="padding: 8px 0; font-size: 13px; font-weight: 600; text-align: right; text-transform: capitalize;">${method.replace('_', ' ')}</td>
            </tr>
            <tr>
                <td colspan="2" style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 16px;"></td>
            </tr>
            <tr>
                <td style="padding: 8px 0; font-size: 13px; font-weight: 600;">Solde restant</td>
                <td style="padding: 8px 0; font-size: 18px; font-weight: 800; text-align: right; color: ${isSolded ? '#10b981' : '#f59e0b'};">
                    ${isSolded ? 'Dossier Soldé ✓' : '$' + balance}
                </td>
            </tr>
        </table>
    </div>
    `;
    return getBaseLayout(content);
};

/**
 * 3. Template de RAPPEL MI-PARCOURS
 */
export const getReminderTemplate = (fullName: string, courseTitle: string, balance: number) => {
    const content = `
    <h2 style="font-size: 18px; margin-bottom: 20px;">Mi-parcours atteint ! 🚀</h2>
    
    <p style="line-height: 1.6; font-size: 14px; color: #475569;">
        Bonjour ${fullName}, vous avez parcouru <strong>50% de votre cursus</strong> sur <em>${courseTitle}</em>. Félicitations pour votre engagement.
    </p>

    <div style="background-color: #fffbeb; border: 1px solid #fcd34d; padding: 24px; border-radius: 16px; margin: 32px 0;">
        <p style="margin: 0; color: #92400e; font-weight: 700; font-size: 16px;">Solde à régulariser</p>
        <p style="margin: 10px 0 0 0; color: #b45309; font-size: 14px;">
            Pour garantir le maintien de vos accès jusqu'à la fin de la session, il vous reste <strong>$${balance}</strong> à régler.
        </p>
    </div>
    `;
    return getBaseLayout(content);
};

/**
 * 4. Template de CERTIFICATION
 */
export const getCompletionTemplate = (fullName: string, courseTitle: string, certificateId: string) => {
    const content = `
    <div style="text-align: center;">
        <p style="color: ${BRAND_COLOR}; font-weight: 800; letter-spacing: 2px; font-size: 12px; margin-bottom: 10px;">CERTIFICATION OFFICIELLE</p>
        <h2 style="font-size: 24px; margin-bottom: 24px;">Félicitations, ${fullName} ! 🏆</h2>
        
        <div style="padding: 30px; border-radius: 20px; border: 2px solid ${BRAND_COLOR}; background-color: #f0f7ff; margin-bottom: 24px;">
            <p style="margin: 0; color: #475569; font-size: 15px;">Vous avez brillamment complété le cursus :</p>
            <p style="font-size: 22px; font-weight: 800; color: ${DARK_COLOR}; margin: 15px 0; text-transform: uppercase;">${courseTitle}</p>
            <p style="margin: 0; font-size: 11px; color: #94a3b8; font-family: monospace;">ID: ${certificateId}</p>
        </div>
        
        <p style="line-height: 1.6; font-size: 14px; color: #475569;">
            Votre certificat officiel est prêt. Il marque votre entrée dans le cercle des traders certifiés Botes Academy.
        </p>
    </div>
    `;
    return getBaseLayout(content);
};

/**
 * 5. Template de RAPPEL FINAL (3 jours avant la fin)
 */
export const getFinalReminderTemplate = (fullName: string, courseTitle: string, balance: number) => {
    const content = `
    <h2 style="font-size: 18px; color: #ef4444; margin-bottom: 20px;">Urgent : Fin de session imminente ⏳</h2>
    
    <p style="line-height: 1.6; font-size: 14px; color: #475569;">
        Bonjour ${fullName}, votre formation <strong>${courseTitle}</strong> se termine dans exactement <strong>3 jours</strong>.
    </p>

    <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 24px; border-radius: 16px; margin: 32px 0;">
        <p style="margin: 0; color: #991b1b; font-weight: 700; font-size: 16px;">Solde impératif du compte</p>
        <p style="margin: 10px 0 0 0; color: #b91c1c; font-size: 14px;">
            Un montant de <strong>$${balance}</strong> reste à régler sur votre dossier.
        </p>
    </div>

    <p style="font-size: 13px; line-height: 1.6; color: #64748b;">
        <strong>Attention :</strong> Le passage de l'examen final et la délivrance de votre <strong>Certificat de Réussite</strong> sont conditionnés par la régularisation complète de votre solde. Sans paiement d'ici la fin de la session, vos accès seront automatiquement suspendus.
    </p>

    <p style="font-size: 13px; color: #64748b; margin-top: 20px;">
        Veuillez soumettre votre preuve de paiement dès maintenant pour éviter toute interruption.
    </p>
    `;
    return getBaseLayout(content);
};

/**
 * 6. Template de RECOMMANDATION (Cross-selling après formation)
 */
export const getRecommendationTemplate = (fullName: string, completedCourse: string, productName: string, productDescription: string) => {
    const content = `
    <div style="text-align: center;">
        <h2 style="font-size: 20px; margin-bottom: 20px;">Passez à la vitesse supérieure, ${fullName} ! ⚡</h2>
        
        <p style="line-height: 1.6; font-size: 14px; color: #475569; margin-bottom: 30px;">
            Maintenant que vous maîtrisez les bases avec <strong>${completedCourse}</strong>, il est temps d'automatiser vos performances avec nos outils d'élite.
        </p>

        <div style="background-color: #1e293b; color: #ffffff; padding: 30px; border-radius: 24px; text-align: left; position: relative; overflow: hidden;">
            <div style="position: absolute; top: -20px; right: -20px; width: 100px; height: 100px; background: #3b82f6; opacity: 0.2; border-radius: 50%; blur: 40px;"></div>
            
            <p style="color: #3b82f6; font-weight: 800; font-size: 10px; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 1px;">RECOMMANDÉ POUR VOUS</p>
            <h3 style="font-size: 22px; font-style: italic; font-weight: 900; margin: 0 0 10px 0; color: #ffffff;">${productName}</h3>
            <p style="font-size: 13px; color: #94a3b8; line-height: 1.5; margin-bottom: 20px;">
                ${productDescription}
            </p>
            
            <a href="https://botesacademy.com/marketplace" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 13px;">
                Voir sur le Marketplace
            </a>
        </div>

        <p style="margin-top: 30px; font-size: 12px; color: #94a3b8; font-style: italic;">
            Note : En tant qu'ancien élève, vous bénéficiez de l'assistance prioritaire sur l'installation de cet outil.
        </p>
    </div>
    `;
    return getBaseLayout(content);
};

/**
 * 7. Template de LIVRAISON INDICATEUR MT5
 */
export const getMT5IndicatorReadyTemplate = (fullName: string, productName: string, mt5Id: string) => {
    const content = `
    <h2 style="font-size: 20px; margin-bottom: 20px;">Votre indicateur est prêt, ${fullName} ! 📈</h2>
    
    <p style="line-height: 1.6; font-size: 14px; color: #475569;">
        L'équipe technique a finalisé l'activation de votre outil <strong>${productName}</strong>.
    </p>

    <div style="background-color: #f1f5f9; padding: 24px; border-radius: 16px; margin: 30px 0; border: 1px dashed #cbd5e1;">
        <p style="margin: 0; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 800;">Compte MT5 Autorisé</p>
        <p style="margin: 5px 0 0 0; font-size: 24px; font-family: monospace; font-weight: 900; color: #3b82f6;">${mt5Id}</p>
    </div>

    <h3 style="font-size: 15px; color: #1e293b; margin-top: 30px;">Instructions d'installation :</h3>
    <ol style="font-size: 13px; color: #475569; line-height: 1.8; padding-left: 20px;">
        <li>Ouvrez votre plateforme <strong>MetaTrader 5</strong>.</li>
        <li>Allez dans <em>Fichier > Ouvrir le dossier des données</em>.</li>
        <li>Naviguez vers <code>MQL5 / Indicators</code>.</li>
        <li>Copiez le fichier de l'indicateur (téléchargeable sur votre dashboard) dans ce dossier.</li>
        <li>Redémarrez MT5 ou faites un clic droit sur "Indicateurs" > "Rafraîchir".</li>
    </ol>

    <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 12px; margin-top: 30px;">
        <p style="margin: 0; color: #991b1b; font-size: 12px; font-weight: 600;">
            ⚠️ Attention : L'outil ne fonctionnera que sur le compte MT5 n°${mt5Id}.
        </p>
    </div>
    `;
    return getBaseLayout(content);
};



