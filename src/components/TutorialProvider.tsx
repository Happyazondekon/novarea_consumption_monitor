"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { HelpCircle } from "lucide-react";

const TutorialContext = createContext({
  startMainTour: () => {},
  startIdentificationTour: () => {},
  startAdminTour: () => {},
});

export const useTutorial = () => useContext(TutorialContext);

export const TutorialProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const role = (session?.user as any)?.role;
  const isResponsable = role === 'RESPONSABLE';
  const isAdmin = role === 'ADMINISTRATEUR' || role === 'MINISTRE';

  // 1. TOUR DASHBOARD RESPONSABLE
  const startMainTour = () => {
    const d = driver({
      showProgress: true,
      nextBtnText: 'Suivant',
      prevBtnText: 'Précédent',
      doneBtnText: 'Terminer',
      steps: [
        { element: '#sidebar-nav', popover: { title: 'Menu Principal', description: 'Naviguez entre votre Dashboard, vos rapports et vos paramètres personnels.', side: "right", align: 'start' } },
        { element: '#financial-trajectory', popover: { title: 'Exécution Financière', description: 'Suivez vos taux d\'engagement et de paiement en temps réel par rapport aux prévisions.', side: "bottom" } },
        { element: '#procurement-donut', popover: { title: 'État des Marchés', description: 'Un coup d\'œil rapide sur la phase de vos marchés publics (Passation, Exécution, etc.).', side: "left" } },
        { element: '#btn-new-submission', popover: { title: 'Saisie de Rapport', description: 'C\'est ici que vous soumettez votre fiche hebdomadaire. Rapide et fidèle aux canevas officiels.', side: "bottom" } }
      ]
    });
    d.drive();
  };

  // 2. TOUR ADMIN / MINISTRE
  const startAdminTour = () => {
    const d = driver({
      showProgress: true,
      nextBtnText: 'Suivant',
      prevBtnText: 'Précédent',
      doneBtnText: 'Compris !',
      steps: [
        { element: '#strategic-filter', popover: { title: 'Filtre de Focus', description: 'Ciblez une agence ou un projet spécifique pour une analyse granulaire.', side: "bottom" } },
        { element: '#btn-ia-report', popover: { title: 'Note Stratégique', description: 'Générez instantanément une note de conjoncture SWOT consolidée par l\'intelligence du système.', side: "left" } },
        { element: '#benchmarking-chart', popover: { title: 'Benchmarking', description: 'Comparez visuellement la performance d\'engagement entre les différentes structures.', side: "top" } },
        { element: '#sector-radar', popover: { title: 'Santé Sectorielle', description: 'Analyse multi-dimensionnelle de la santé technique et financière par secteur.', side: "left" } },
        { element: '#late-alerts-card', popover: { title: 'Centre de Relance', description: 'Identifiez les structures en retard et gérez les interpellations officielles.', side: "top" } }
      ]
    });
    d.drive();
  };

  // 3. TOUR PREMIÈRE SOUMISSION (LE PLUS IMPORTANT)
  const startIdentificationTour = () => {
    const d = driver({
        showProgress: true,
        nextBtnText: 'Suivant',
        prevBtnText: 'Précédent',
        doneBtnText: 'Démarrer la saisie',
        steps: [
          {
            element: '#module-0-content',
            popover: {
                title: 'Identification & Infos Générales',
                description: 'CRITIQUE : Avant votre première soumission, vérifiez et complétez les informations de votre structure (Coût global, Budget 2026, Dates). Ces données sont essentielles pour les calculs du Cabinet.',
                side: "bottom"
            }
          },
          {
            element: '#btn-save-draft',
            popover: {
                title: 'Sauvegarde Temporaire',
                description: 'Vous pouvez enregistrer votre travail et revenir plus tard si vous n\'avez pas toutes les données sous la main.',
                side: "bottom"
            }
          },
          {
            element: '#btn-next-module',
            popover: {
                title: 'Navigation',
                description: 'Utilisez le bouton Suivant pour naviguer entre les modules du canevas officiel (RH, PTA, Performances...).',
                side: "top"
            }
          }
        ]
      });
      d.drive();
  };

  // Auto-lancement intelligent
  useEffect(() => {
    if (mounted) {
        if (pathname === '/dashboard') {
            if (isResponsable) {
                const hasSeen = localStorage.getItem('tutorial_seen');
                if (!hasSeen) {
                    setTimeout(startMainTour, 2000);
                    localStorage.setItem('tutorial_seen', 'true');
                }
            } else if (isAdmin) {
                const hasSeenAdmin = localStorage.getItem('tutorial_admin_seen');
                if (!hasSeenAdmin) {
                    setTimeout(startAdminTour, 2000);
                    localStorage.setItem('tutorial_admin_seen', 'true');
                }
            }
        }

        // Auto-lancement sur la page nouvelle soumission
        if (pathname === '/dashboard/soumissions/nouvelle') {
            const hasSeenId = localStorage.getItem('tutorial_id_seen');
            if (!hasSeenId) {
                setTimeout(startIdentificationTour, 1500);
                localStorage.setItem('tutorial_id_seen', 'true');
            }
        }
    }
  }, [mounted, pathname, isResponsable, isAdmin]);

  if (!mounted) return <>{children}</>;

  return (
    <TutorialContext.Provider value={{ startMainTour, startIdentificationTour, startAdminTour }}>
      {children}
      {(isResponsable || isAdmin) && (
        <button
          id="tutorial-trigger"
          onClick={() => {
              if (pathname === '/dashboard/soumissions/nouvelle') startIdentificationTour();
              else if (isAdmin) startAdminTour();
              else startMainTour();
          }}
          className="fixed bottom-6 right-6 p-4 rounded-full bg-zinc-900 text-white shadow-2xl hover:scale-110 active:scale-95 transition-all z-[100] group border border-white/10"
        >
          <HelpCircle size={24} />
          <span className="absolute right-full mr-4 px-3 py-2 rounded-xl bg-zinc-900 text-white text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none translate-x-2 group-hover:translate-x-0">
             Besoin d'aide ?
          </span>
        </button>
      )}
    </TutorialContext.Provider>
  );
};
