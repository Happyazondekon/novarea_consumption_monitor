import Groq from "groq-sdk";

// Initialisation paresseuse pour éviter le plantage au build si la clé est absente
let groqInstance: Groq | null = null;

function getGroq() {
  if (!groqInstance) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        console.warn("ATTENTION: GROQ_API_KEY manquante. L'analyse IA sera désactivée.");
        return null;
    }
    groqInstance = new Groq({ apiKey });
  }
  return groqInstance;
}

export async function generateStrategicAnalysis(data: any) {
  const isGlobal = data.context.includes("Global");
  const period = data.period;
  const groq = getGroq();

  // Agrégation des métriques par projet
  const projectSummaries = data.data.map((e: any) => {
    const subs = e.soumissions || [];
    if (subs.length === 0) return null;

    const latest = subs[0];
    const oldest = subs[subs.length - 1];

    const trendValue = parseFloat(latest.tauxEngagement || 0) - parseFloat(oldest.tauxEngagement || 0);
    const trend = trendValue.toFixed(1);

    return {
      nom: e.nom,
      secteur: e.secteur,
      engagement: `${latest.tauxEngagement}%`,
      paiement: `${latest.tauxPaiement}%`,
      tendance_periode: trendValue > 0 ? `+${trend}%` : `${trend}%`,
      pta_status: latest.activitesPTARealisees ? "CONFORME" : "RETARD",
      points_bloquants: latest.facteursBloquants || "Aucun signalé",
      volume_marches: latest.marches?.length || 0,
      recrues_periode: subs.reduce((acc: number, s: any) => acc + (s.effectifRecrute || 0), 0)
    };
  }).filter(Boolean);

  if (projectSummaries.length === 0) return "Données insuffisantes pour générer une analyse.";

  const avgEng = (projectSummaries.reduce((a:any, b:any) => a + parseFloat(b.engagement), 0) / projectSummaries.length).toFixed(1);

  if (!groq) {
      return `[IA Indisponible] Synthèse : Engagement moyen du portefeuille de ${avgEng}%. Les détails par projet sont disponibles dans les tableaux récapitulatifs.`;
  }

  const prompt = `
    Rôle : Expert Analyste Stratégique du MPMEPE (Bénin).
    Contexte : Revue de performance du portefeuille pour la période du ${period.start} au ${period.end}.
    Portée : ${isGlobal ? "Analyse Multi-Projets (Ministère)" : "Analyse Spécifique : " + data.context}.
    Données consolidées : ${JSON.stringify(projectSummaries)}.

    Mission : Rédige une ANALYSE STRATÉGIQUE SWOT ET RECOMMANDATIONS.

    STRUCTURE REQUISE (TITRES EN MAJUSCULES) :
    1. SYNTHÈSE DE LA PERFORMANCE (Analyse des chiffres clés comme l'engagement moyen de ${avgEng}%)
    2. ANALYSE SWOT (Forces, Faiblesses, Opportunités, Menaces basées sur les tendances et facteurs bloquants)
    3. ALERTES CRITIQUES (Identification des projets ou axes en difficulté)
    4. DÉCISIONS ET ARBITRAGES (Recommandations concrètes pour Madame la Ministre)

    RÈGLES D'OR :
    - Texte pur uniquement. INTERDICTION de markdown (*, #, _, - pour les listes).
    - Style institutionnel, formel et analytique.
    - Utilise des sauts de ligne clairs pour séparer les paragraphes.
  `;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "Tu es un haut cadre de l'administration béninoise. Tu rédiges des rapports sans aucun symbole de formatage informatique." },
        { role: "user", content: prompt }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      max_tokens: 3500
    });

    const result = chatCompletion.choices[0]?.message?.content;
    if (!result) throw new Error("Réponse IA vide");

    return result.replace(/\*/g, '').replace(/#/g, '').replace(/_/g, '');

  } catch (error: any) {
    console.error("AI_FAILURE:", error.message);
    return `Erreur de génération IA. Engagement moyen du portefeuille : ${avgEng}%. Veuillez consulter les tableaux de bord pour le détail par projet.`;
  }
}
