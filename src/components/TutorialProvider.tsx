"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const TutorialContext = createContext({
  startMainTour: () => {},
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
  const isAdmin = role === 'ADMINISTRATEUR';
  const isTech = role === 'ELECTRICIEN';

  // --- TECHNICIAN TOURS ---
  const startTechTour = () => {
    const d = driver({
      showProgress: true,
      nextBtnText: 'Next',
      prevBtnText: 'Previous',
      doneBtnText: 'Got it!',
      steps: [
        { element: '#tech-kpis', popover: { title: 'Operational Status', description: 'Monitor your verified readings, pending audits, and received missions at a glance.', side: "bottom" } },
        { element: '#new-reading-btn', popover: { title: 'Record Reading', description: 'This is where you log daily consumption. Remember to attach clear photo proof!', side: "left" } },
        { element: '#recent-submissions', popover: { title: 'Recent Activity', description: 'Review your latest submissions and track their real-time audit status.', side: "top" } }
      ]
    });
    d.drive();
  };

  const startReadingTour = () => {
    const d = driver({
        showProgress: true,
        nextBtnText: 'Next',
        prevBtnText: 'Previous',
        doneBtnText: 'Done',
        steps: [
          { element: '#selection-cards', popover: { title: 'Select Resource', description: 'Choose which utility you are recording (Electricity or Water).', side: "bottom" } },
          { element: '#meter-index-input', popover: { title: 'Meter Index', description: 'Enter the value exactly as shown on the meter. Use +/- for fine adjustments.', side: "top" } },
          { element: '#photo-upload-zone', popover: { title: 'Visual Proof', description: 'Capture a clear photo of the meter. This is mandatory for auditing purposes.', side: "top" } },
          { element: '#submit-reading-btn', popover: { title: 'Submission', description: 'Click to send your reading. It will then enter the "Audit Pending" state.', side: "bottom" } },
          { element: '#success-screen', popover: { title: 'Success!', description: 'Your reading has been archived. You can now finish and return to the dashboard.', side: "top" } }
        ]
      });
      d.drive();
  };

  const startHistoryTour = () => {
    const d = driver({
        showProgress: true,
        nextBtnText: 'Next',
        prevBtnText: 'Previous',
        doneBtnText: 'Got it!',
        steps: [
          { element: '#history-header', popover: { title: 'Archive Management', description: 'Browse and filter through your entire submission history.', side: "bottom" } },
          { element: '#history-date-filter', popover: { title: 'Date Lookup', description: 'Target a specific day to verify exactly when a reading was captured.', side: "bottom" } },
          { element: '#history-type-filters', popover: { title: 'Utility Categorization', description: 'Filter your history by Electricity or Water for focused review.', side: "bottom" } },
          { element: '#history-list-mobile', popover: { title: 'Interactive Log', description: 'Click on any entry to see the full audit trail and original photo proof.', side: "top" } }
        ]
      });
      d.drive();
  };

  // --- ADMINISTRATOR TOURS ---
  const startAdminTour = () => {
    const d = driver({
      showProgress: true,
      nextBtnText: 'Next',
      prevBtnText: 'Previous',
      doneBtnText: 'Start',
      steps: [
        { element: '#active-resource-toggle', popover: { title: 'Resource Switch', description: 'Toggle between Electricity and Water monitoring to update the entire view.', side: "bottom" } },
        { element: '#kpi-grid', popover: { title: 'Key Indicators', description: 'Current index, total consumption, and daily averages updated in real-time.', side: "bottom" } },
        { element: '#trends-chart', popover: { title: 'Trends Analysis', description: 'Visualize consumption data compared against the period average baseline.', side: "top" } },
        { element: '#aggregation-selector', popover: { title: 'Temporal Precision', description: 'Group your data by Day, Week, or Month for deeper insights.', side: "left" } }
      ]
    });
    d.drive();
  };

  const startAuditTour = () => {
    const d = driver({
        showProgress: true,
        nextBtnText: 'Next',
        prevBtnText: 'Previous',
        doneBtnText: 'Finished',
        steps: [
          { element: '#audit-header', popover: { title: 'Submission Audit', description: 'Review and validate all technician entries here.', side: "bottom" } },
          { element: '#audit-filters', popover: { title: 'Smart Filtering', description: 'Filter by resource type, audit status, or specific dates.', side: "bottom" } },
          { element: '#audit-batch-actions', popover: { title: 'Bulk Operations', description: 'Select multiple rows to validate or remove them in a single action.', side: "bottom" } },
          { element: '#audit-table-desktop', popover: { title: 'Verification List', description: 'Click the pencil icon to inspect visual proof (photo) and correct entries if needed.', side: "top" } }
        ]
      });
      d.drive();
  };

  const startEventsTour = () => {
    const d = driver({
        showProgress: true,
        nextBtnText: 'Next',
        prevBtnText: 'Previous',
        doneBtnText: 'Got it',
        steps: [
          { element: '#events-header', popover: { title: 'Daily Context', description: 'Log operational anomalies (PTR, MEF, etc.) to explain consumption variations.', side: "bottom" } },
          { element: '#open-wizard-btn', popover: { title: 'Register Event', description: 'Open the 3-step wizard to add new context for the selected date.', side: "left" } },
          { element: '#events-grid', popover: { title: 'Historical Log', description: 'Review the anomalies already registered for this day.', side: "top" } }
        ]
      });
      d.drive();
  };

  const startTeamTour = () => {
    const d = driver({
        showProgress: true,
        nextBtnText: 'Next',
        prevBtnText: 'Previous',
        doneBtnText: 'Finished',
        steps: [
          { element: '#team-header', popover: { title: 'Team Management', description: 'Oversee system access and credentials for all personnel.', side: "bottom" } },
          { element: '#add-user-btn', popover: { title: 'Add Personnel', description: 'Create new accounts for technicians or administrators.', side: "left" } },
          { element: '#team-table-desktop', popover: { title: 'Directory', description: 'Manage existing profiles, update roles, or revoke access.', side: "top" } }
        ]
      });
      d.drive();
  };

  const startReportTour = () => {
    const d = driver({
        showProgress: true,
        nextBtnText: 'Next',
        prevBtnText: 'Previous',
        doneBtnText: 'Finish',
        steps: [
          { element: '#report-filters', popover: { title: 'Configuration', description: 'Define the resource and time horizon (standard or custom ranges).', side: "right" } },
          { element: '#section-builder', popover: { title: 'Modular Structure', description: 'Build your report by selecting the specific sections you need.', side: "right" } },
          { element: '#report-preview', popover: { title: 'Dynamic Preview', description: 'Review your document layout and data before exporting to PDF or Excel.', side: "left" } }
        ]
      });
      d.drive();
  };

  const startMissionTour = () => {
    const d = driver({
        showProgress: true,
        nextBtnText: 'Next',
        prevBtnText: 'Previous',
        doneBtnText: 'Finished',
        steps: isAdmin ? [
          { element: '#mission-header', popover: { title: 'Directive Dispatch', description: 'Create and broadcast operational instructions to specific technicians.', side: "bottom" } },
          { element: '#add-mission-btn', popover: { title: 'New Instruction', description: 'Click here to compose a new directive and select the target personnel.', side: "left" } },
          { element: '#mission-list', popover: { title: 'Real-time Monitoring', description: 'Monitor the status of your directives. They turn green when marked as DONE by the team.', side: "top" } }
        ] : [
          { element: '#mission-header', popover: { title: 'Active Missions', description: 'Review the directives sent to you by the administration.', side: "bottom" } },
          { element: '#mission-list', popover: { title: 'Task List', description: 'Read your instructions carefully. Each card shows the priority and timestamp.', side: "top" } },
          { element: '[id^="action-"]', popover: { title: 'Marking Completion', description: 'Once you finish a task, click "Mark as Done" to notify the administrator.', side: "bottom" } }
        ]
      });
      d.drive();
  };

  const startMainTour = () => {
      if (pathname === '/dashboard/reports/generator') startReportTour();
      else if (pathname === '/dashboard/new-reading') startReadingTour();
      else if (pathname === '/dashboard/history') startHistoryTour();
      else if (pathname === '/dashboard/instructions') startMissionTour();
      else if (pathname === '/dashboard/reports') startAuditTour();
      else if (pathname === '/dashboard/events') startEventsTour();
      else if (pathname === '/dashboard/users') startTeamTour();
      else if (isAdmin) startAdminTour();
      else if (isTech) startTechTour();
  };

  // Auto-lancement intelligent
  useEffect(() => {
    if (mounted && session?.user) {
        if (pathname === '/dashboard') {
            const hasSeen = localStorage.getItem(`tutorial_seen_v6_${role}`);
            if (!hasSeen) {
                setTimeout(startMainTour, 2000);
                localStorage.setItem(`tutorial_seen_v6_${role}`, 'true');
            }
        }

        // Auto-run for other specific views on first visit
        const specificViews = ['reports', 'events', 'users', 'instructions', 'new-reading', 'history'];
        const currentView = pathname.split('/').pop() || "";

        if (specificViews.includes(currentView)) {
            const hasSeenView = localStorage.getItem(`tutorial_view_seen_v1_${currentView}_${role}`);
            if (!hasSeenView) {
                setTimeout(startMainTour, 1500);
                localStorage.setItem(`tutorial_view_seen_v1_${currentView}_${role}`, 'true');
            }
        }
    }
  }, [mounted, pathname, role, session]);

  if (!mounted) return <>{children}</>;

  return (
    <TutorialContext.Provider value={{ startMainTour }}>
      {children}
      {session?.user && (
        <button
          id="tutorial-trigger"
          onClick={startMainTour}
          className={cn(
            "fixed bottom-24 right-6 md:bottom-8 md:right-8 z-[100]",
            "p-4 rounded-full shadow-2xl transition-all duration-300 group border-2 border-white/50",
            "bg-blue-600 text-white hover:scale-110 active:scale-95",
            "dark:bg-white dark:text-blue-600"
          )}
        >
          <HelpCircle size={28} />
          <span className="absolute right-full mr-4 px-3 py-2 rounded-xl bg-zinc-900 text-white text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none translate-x-2 group-hover:translate-x-0">
             Need Help?
          </span>
        </button>
      )}
    </TutorialContext.Provider>
  );
};
