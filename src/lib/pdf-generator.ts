import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const GREEN = [0, 135, 81];
const YELLOW = [252, 209, 22];
const RED = [232, 17, 45];
const ZINC = [63, 63, 70];

// Fonction utilitaire pour le formatage propre des nombres sans caractères parasites (/)
const formatCurrency = (val: any) => {
    if (val === null || val === undefined) return '0';
    const num = Math.round(Number(val));
    // Approche manuelle robuste pour éviter les comportements imprévus de toLocaleString
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

export const generateSubmissionPDF = async (submission: any) => {
  const doc = new jsPDF() as any;
  const observations = submission.observationsJSON ? JSON.parse(submission.observationsJSON) : {};

  // --- ENTÊTE OFFICIEL ---
  doc.setFillColor(GREEN[0], GREEN[1], GREEN[2]); doc.rect(0, 0, 70, 4, 'F');
  doc.setFillColor(YELLOW[0], YELLOW[1], YELLOW[2]); doc.rect(70, 0, 70, 4, 'F');
  doc.setFillColor(RED[0], RED[1], RED[2]); doc.rect(140, 0, 70, 4, 'F');

  doc.setFontSize(7);
  doc.setTextColor(100);
  doc.setFont("helvetica", "bold");
  doc.text("RÉPUBLIQUE DU BÉNIN", 105, 12, { align: 'center' });
  doc.setFont("helvetica", "normal");
  doc.text("MINISTÈRE DES PETITES ET MOYENNES ENTREPRISES ET DE LA PROMOTION DE L'EMPLOI", 105, 16, { align: 'center' });
  doc.text("--------------------------------------", 105, 19, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text("FICHE DE SUIVI HEBDOMADAIRE DES ACTIVITÉS", 105, 30, { align: 'center' });

  doc.setFontSize(9);
  doc.setTextColor(ZINC[0], ZINC[1], ZINC[2]);
  doc.text(`ENTITÉ : ${submission.entite.nom.toUpperCase()}`, 15, 45);
  doc.text(`RESPONSABLE : ${submission.entite.responsableNom || "N/A"}`, 15, 50);
  doc.text(`DATE DE TRANSMISSION : ${new Date(submission.dateSoumission).toLocaleString('fr-FR')}`, 15, 55);

  let currentY = 65;

  // SECTION 1.1 : RH
  autoTable(doc, {
    startY: currentY,
    head: [['N°', 'SECTION 1.1 — RESSOURCES HUMAINES', 'RÉPONSE', 'OBSERVATIONS']],
    body: [
      ['1.', 'Effectif à recruter (procédures à lancer)', submission.effectifARecruter || '0', observations.rh?.effectifARecruter || 'N/A'],
      ['2.', 'Effectif recruté (nouvelles recrues)', submission.effectifRecrute || '0', observations.rh?.effectifRecrute || 'N/A'],
      ['3.', 'Nombre de départs (R/D/L/F)', `R:${submission.departRetraite || 0} | D:${submission.departDemission || 0} | L:${submission.departLicenciement || 0} | F:${submission.departFinContrat || 0}`, observations.rh?.departs || 'N/A'],
      ['4.', 'Taux d\'exécution du plan de formation', `${submission.tauxExecutionPlanFormation || 0}%`, observations.rh?.tauxExecutionFormation || 'N/A']
    ],
    theme: 'grid',
    headStyles: { fillColor: GREEN as any, textColor: [255, 255, 255], fontSize: 8 },
    styles: { fontSize: 7 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // SECTION 1.2.1 : FINANCES
  autoTable(doc, {
    startY: currentY,
    head: [['N°', 'SECTION 1.2.1 — FINANCES', 'TAUX', 'PÉRIODE', 'CUMULÉ']],
    body: [
      ['1.', 'Budget total alloué (FCFA)', '-', '-', formatCurrency(submission.budgetTotalAlloue)],
      ['2.', 'Taux d\'engagement budgétaire (%)', `${submission.tauxEngagement || 0}%`, '-', '-'],
      ['3.', 'Taux d\'ordonnancement / liquidation (%)', `${submission.tauxOrdonnancement || 0}%`, '-', '-'],
      ['4.', 'Taux de paiement effectif (%)', `${submission.tauxPaiement || 0}%`, '-', '-'],
      ['5.', 'Montant des dettes et arriérés (FCFA)', '-', formatCurrency(submission.montantDettes), '-'],
      ['6.', 'Ressources propres générées (FCFA)', '-', '-', formatCurrency(submission.ressourcesPropres)]
    ],
    theme: 'grid',
    headStyles: { fillColor: YELLOW as any, textColor: [0, 0, 0], fontSize: 8 },
    styles: { fontSize: 7 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // SECTION 1.2.2 : BAILLEURS
  if (submission.financementsExterieurs?.length > 0) {
    autoTable(doc, {
      startY: currentY,
      head: [['BAILLEUR', 'T. MOBILISÉ', 'M. MOB. PÉRIODE', 'M. MOB. CUMULÉ', 'T. CONS.', 'M. CONS. PÉRIODE', 'M. CONS. CUMULÉ']],
      body: submission.financementsExterieurs.map((b: any) => [
        b.bailleur,
        `${b.tauxMobilise}%`,
        formatCurrency(b.montantMobilisePeriode),
        formatCurrency(b.montantMobiliseCumule),
        `${b.tauxConsomme}%`,
        formatCurrency(b.montantConsommePeriode),
        formatCurrency(b.montantConsommeCumule)
      ]),
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontSize: 7 },
      styles: { fontSize: 6 }
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // SECTION 1.3 : MATÉRIEL ET SI
  autoTable(doc, {
    startY: currentY,
    head: [['N°', 'SECTION 1.3 — RESSOURCES MATÉRIELLES ET SI', 'RÉPONSE', 'OBSERVATIONS']],
    body: [
      ['1.', 'Acquisitions de matières (actifs immobilisés)', submission.nouvellesAcquisitions ? 'OUI' : 'NON', submission.nouvellesAcquisitions || 'N/A'],
      ['2.', 'Prestations immatérielles (études, logiciels)', submission.prestationsImmaterielles ? 'OUI' : 'NON', submission.prestationsImmaterielles || 'N/A'],
      ['3.', 'Systèmes d\'informations fonctionnels ?', submission.systemeInfoFonctionnel ? 'OUI' : 'NON', 'N/A']
    ],
    theme: 'grid',
    headStyles: { fillColor: [100, 100, 100], fontSize: 8 },
    styles: { fontSize: 7 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // SECTION 1.4 : GOUVERNANCE
  autoTable(doc, {
    startY: currentY,
    head: [['N°', 'SECTION 1.4 — GOUVERNANCE', 'RÉPONSE', 'PRÉCISIONS']],
    body: [
      ['1.', 'Le Comité de Direction s\'est-il réunit ?', submission.comiteDirectionReuni ? 'OUI' : 'NON', submission.comiteDirectionPrecisions || 'N/A'],
      ['2.', 'Nouvelles conventions ou protocoles signés', submission.nouvellesConventions ? 'OUI' : 'NON', submission.nouvellesConventions || 'N/A'],
      ['3.', 'Conseil d\'Administration ou CoPil à jour ?', submission.capCopilAJour ? 'OUI' : 'NON', 'N/A']
    ],
    theme: 'grid',
    headStyles: { fillColor: [130, 130, 130], fontSize: 8 },
    styles: { fontSize: 7 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // SECTION 1.5 : MARCHÉS (LES 3 PHASES)
  const marchesP = submission.marches?.filter((m: any) => m.phase === 'PASSATION_EN_COURS') || [];
  const marchesL = submission.marches?.filter((m: any) => m.phase === 'A_LANCER') || [];
  const marchesE = submission.marches?.filter((m: any) => m.phase === 'EN_EXECUTION') || [];

  if (marchesP.length > 0) {
    doc.setFontSize(8); doc.setFont("helvetica", "bold");
    doc.text("SECTION 1.5.1 — MARCHÉS EN PASSATION", 15, currentY);
    autoTable(doc, {
      startY: currentY + 2,
      head: [['LIBELLÉ', 'ÉTAPE', 'MODE', 'MONTANT PRÉV.', 'DATE OFFRE']],
      body: marchesP.map((m: any) => [m.libelle, m.etape, m.modePassation, formatCurrency(m.montantPrevisionnel), m.dateLancementOffre ? new Date(m.dateLancementOffre).toLocaleDateString() : '-']),
      theme: 'grid',
      headStyles: { fillColor: [60, 60, 60], textColor: [255, 255, 255], fontSize: 7 },
      styles: { fontSize: 6 }
    });
    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  if (marchesL.length > 0) {
    if (currentY > 260) { doc.addPage(); currentY = 20; }
    doc.setFontSize(8); doc.setFont("helvetica", "bold");
    doc.text("SECTION 1.5.2 — MARCHÉS À LANCER (SOUS 8 JOURS)", 15, currentY);
    autoTable(doc, {
      startY: currentY + 2,
      head: [['LIBELLÉ', 'MODE', 'MONTANT PRÉV.', 'DATE PRÉVUE']],
      body: marchesL.map((m: any) => [m.libelle, m.modePassation, formatCurrency(m.montantPrevisionnel), m.dateLancementOffre ? new Date(m.dateLancementOffre).toLocaleDateString() : '-']),
      theme: 'grid',
      headStyles: { fillColor: [80, 80, 80], textColor: [255, 255, 255], fontSize: 7 },
      styles: { fontSize: 6 }
    });
    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  if (marchesE.length > 0) {
    if (currentY > 260) { doc.addPage(); currentY = 20; }
    doc.setFontSize(8); doc.setFont("helvetica", "bold");
    doc.text("SECTION 1.5.3 — MARCHÉS EN EXÉCUTION", 15, currentY);
    autoTable(doc, {
      startY: currentY + 2,
      head: [['LIBELLÉ', 'ORDRE SERVICE', 'LIVRAISON PRÉV.', 'TAUX (%)']],
      body: marchesE.map((m: any) => [m.libelle, m.dateOrdreService ? new Date(m.dateOrdreService).toLocaleDateString() : '-', m.dateLivraisonPrevisionnelle ? new Date(m.dateLivraisonPrevisionnelle).toLocaleDateString() : '-', `${m.tauxExecution}%`]),
      theme: 'grid',
      headStyles: { fillColor: [100, 100, 100], textColor: [255, 255, 255], fontSize: 7 },
      styles: { fontSize: 6 }
    });
    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // SECTION 2.1 : PTA
  if (currentY > 260) { doc.addPage(); currentY = 20; }
  autoTable(doc, {
    startY: currentY,
    head: [['SECTION 2.1 — EXÉCUTION DU PTA', 'RÉPONSE / DÉTAIL']],
    body: [
      ['Activités PTA réalisées ?', submission.activitesPTARealisees ? 'OUI' : 'NON'],
      ['Activités clés réalisées', submission.activitesClesRealisees || 'Néant'],
      ['Facteurs bloquants', submission.facteursBloquants || 'Néant']
    ],
    theme: 'grid',
    headStyles: { fillColor: RED as any, textColor: [255, 255, 255], fontSize: 8 },
    styles: { fontSize: 7 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // MODULE 3 & 4
  if (submission.indicateurs?.length > 0) {
    if (currentY > 230) { doc.addPage(); currentY = 20; }
    doc.setFontSize(8); doc.setFont("helvetica", "bold");
    doc.text("SECTION 3.1 — TABLEAU DE BORD DES INDICATEURS", 15, currentY);
    autoTable(doc, {
      startY: currentY + 2,
      head: [['AXE', 'INDICATEUR', 'UNITÉ', 'CIBLE', 'ATTEINTE (%)']],
      body: submission.indicateurs.map((i: any) => [i.programmeAxe, i.indicateur, i.unite, formatCurrency(i.cible), `${i.tauxAtteinte}%`]),
      theme: 'grid',
      headStyles: { fillColor: [60, 60, 60], fontSize: 7 },
      styles: { fontSize: 7 }
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  if (submission.instructions?.length > 0) {
    if (currentY > 230) { doc.addPage(); currentY = 20; }
    doc.setFontSize(8); doc.setFont("helvetica", "bold");
    doc.text("MODULE 4 — SUIVI DES INSTRUCTIONS DU CABINET", 15, currentY);
    autoTable(doc, {
      startY: currentY + 2,
      head: [['AXE', 'INSTRUCTION DONNÉE', 'TÂCHES EXÉCUTÉES', 'TAUX (%)']],
      body: submission.instructions.map((i: any) => [i.axe, i.instructionsDonnees, i.tachesExecutees, `${i.tauxExecution}%`]),
      theme: 'grid',
      headStyles: { fillColor: [40, 40, 40], fontSize: 7 },
      styles: { fontSize: 7 }
    });
  }

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(`Rapport Officiel MPMEPE - Généré le ${new Date().toLocaleString('fr-FR')} - Page ${i}/${pageCount}`, 105, 285, { align: 'center' });
  }

  doc.save(`Rapport_${submission.entite.nom.replace(/\s+/g, '_')}.pdf`);
};

export const generateGlobalPDF = async (reportData: any) => {
  const doc = new jsPDF() as any;

  // Barre tricolore
  doc.setFillColor(GREEN[0], GREEN[1], GREEN[2]); doc.rect(0, 0, 70, 4, 'F');
  doc.setFillColor(YELLOW[0], YELLOW[1], YELLOW[2]); doc.rect(70, 0, 70, 4, 'F');
  doc.setFillColor(RED[0], RED[1], RED[2]); doc.rect(140, 0, 70, 4, 'F');

  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.setFont("helvetica", "bold");
  doc.text("RÉPUBLIQUE DU BÉNIN", 105, 12, { align: 'center' });
  doc.text("MINISTÈRE DES PETITES ET MOYENNES ENTREPRISES ET DE LA PROMOTION DE L'EMPLOI", 105, 16, { align: 'center' });

  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text(reportData.title.toUpperCase(), 105, 30, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Période d'analyse : ${reportData.period}`, 15, 45);
  doc.text(`Généré le : ${new Date().toLocaleDateString('fr-FR')}`, 15, 50);

  // ANALYSE IA
  doc.setFontSize(12);
  doc.setTextColor(GREEN[0], GREEN[1], GREEN[2]);
  doc.text("ANALYSE STRATÉGIQUE GÉNÉRÉE PAR IA", 15, 65);

  doc.setFontSize(9);
  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");

  const splitAnalysis = doc.splitTextToSize(reportData.analysis, 180);
  doc.text(splitAnalysis, 15, 75);

  let currentY = 75 + (splitAnalysis.length * 5) + 15;

  // RÉCAPITULATIF
  if (currentY > 250) { doc.addPage(); currentY = 20; }

  doc.setFontSize(11);
  doc.setTextColor(ZINC[0], ZINC[1], ZINC[2]);
  doc.text("RÉCAPITULATIF ANALYTIQUE DU PORTEFEUILLE", 15, currentY);

  autoTable(doc, {
    startY: currentY + 5,
    head: [['STRUCTURE', 'SECTEUR', 'ENGAGEMENT', 'PAIEMENT', 'ÉTAT PTA']],
    body: reportData.data.map((e: any) => {
        const last = e.soumissions[0];
        return [
            e.nom.substring(0, 40),
            e.secteur,
            `${last?.tauxEngagement || 0}%`,
            `${last?.tauxPaiement || 0}%`,
            last?.activitesPTARealisees ? "CONFORME" : "RETARD"
        ];
    }),
    theme: 'striped',
    headStyles: { fillColor: [50, 50, 50], fontSize: 8 },
    styles: { fontSize: 7 }
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Note de Conjoncture MPMEPE - Page ${i}/${pageCount}`, 105, 285, { align: 'center' });
  }

  doc.save(`Note_Conjoncture_${new Date().toISOString().split('T')[0]}.pdf`);
};
