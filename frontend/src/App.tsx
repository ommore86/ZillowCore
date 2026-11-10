import React, { useState, useEffect } from 'react';
import { ApiService } from './services/api';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { GlobalCommandModal } from './components/GlobalCommandModal';
import { InteractiveMapModal } from './components/InteractiveMapModal';
import { ValuationModal } from './components/ValuationModal';
import { ResoSandboxModal } from './components/ResoSandboxModal';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { CommandCenterPage } from './pages/CommandCenterPage';
import { PropertiesPage } from './pages/PropertiesPage';
import { LeadsPage } from './pages/LeadsPage';
import { FinancePage } from './pages/FinancePage';
import { MaintenancePage } from './pages/MaintenancePage';
import { LeasesPage } from './pages/LeasesPage';
import { AgentsPage } from './pages/AgentsPage';
import { DeveloperPortalPage } from './pages/DeveloperPortalPage';
import { AutomationsPage } from './pages/AutomationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { GenericPage } from './pages/GenericPage';
import { LoginPage } from './pages/LoginPage';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(ApiService.getCurrentUser());

  const getPersonaLandingTab = (role?: string): string => {
    switch (role) {
      case 'tenant':
        return 'tenants';
      case 'accountant':
        return 'finance';
      case 'real_estate_agent':
        return 'leads';
      case 'property_manager':
        return 'properties';
      case 'facility_manager':
      case 'maintenance_staff':
        return 'maintenance';
      case 'readonly_analyst':
      case 'investor':
        return 'reports';
      case 'super_admin':
      case 'org_owner':
      default:
        return 'overview';
    }
  };

  const [currentTab, setCurrentTab] = useState<string>(() => {
    const user = ApiService.getCurrentUser();
    return user?.role ? getPersonaLandingTab(user.role) : 'overview';
  });

  const handleLoginSuccess = (userPayload: any) => {
    const user = userPayload.user || userPayload;
    setCurrentUser(user);
    const targetTab = getPersonaLandingTab(user?.role);
    setCurrentTab(targetTab);
  };

  // Modals state
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [commandPrompt, setCommandPrompt] = useState('');
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isValuationOpen, setIsValuationOpen] = useState(false);
  const [isResoOpen, setIsResoOpen] = useState(false);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const renderActivePage = () => {
    switch (currentTab) {
      case 'overview':
        return (
          <DashboardPage
            onOpenCommand={(p) => {
              if (p) setCommandPrompt(p);
              setIsCommandOpen(true);
            }}
            onOpenValuation={() => setIsValuationOpen(true)}
            onOpenMap={() => setIsMapOpen(true)}
          />
        );
      case 'command-center':
        return <CommandCenterPage />;
      case 'properties':
        return (
          <PropertiesPage
            onOpenValuation={() => setIsValuationOpen(true)}
            onOpenMap={() => setIsMapOpen(true)}
          />
        );
      case 'leads':
        return <LeadsPage />;
      case 'finance':
        return <FinancePage />;
      case 'maintenance':
        return <MaintenancePage />;
      case 'leases':
        return <LeasesPage />;
      case 'agents':
        return <AgentsPage />;
      case 'developer':
        return <DeveloperPortalPage />;
      case 'automations':
        return <AutomationsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'units':
      case 'crm':
      case 'tenants':
      case 'sales':
      case 'transactions':
      case 'vendors':
      case 'documents':
      case 'reports':
        return (
          <GenericPage
            pageId={currentTab as any}
            onOpenCommand={(p) => {
              if (p) setCommandPrompt(p);
              setIsCommandOpen(true);
            }}
          />
        );
      default:
        return (
          <DashboardPage
            onOpenCommand={() => setIsCommandOpen(true)}
            onOpenValuation={() => setIsValuationOpen(true)}
            onOpenMap={() => setIsMapOpen(true)}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden font-sans">
      {/* 19-Section Enterprise Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={tab => setCurrentTab(tab)}
        currentUser={currentUser}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar
          onOpenCommand={() => setIsCommandOpen(true)}
          onOpenValuation={() => setIsValuationOpen(true)}
          onOpenMap={() => setIsMapOpen(true)}
          onOpenReso={() => setIsResoOpen(true)}
        />

        <main className="flex-1 overflow-y-auto bg-slate-50">
          {renderActivePage()}
        </main>
      </div>

      {/* Modals */}
      <GlobalCommandModal
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        initialPrompt={commandPrompt}
      />

      <InteractiveMapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onSelectProperty={() => {
          setCurrentTab('properties');
        }}
      />

      <ValuationModal
        isOpen={isValuationOpen}
        onClose={() => setIsValuationOpen(false)}
      />

      <ResoSandboxModal
        isOpen={isResoOpen}
        onClose={() => setIsResoOpen(false)}
      />
    </div>
  );
};
