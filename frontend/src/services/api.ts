const normalizeApiUrl = (rawUrl?: string): string | null => {
  if (!rawUrl) return null;
  let clean = rawUrl.trim();
  if (!clean) return null;

  // Add https protocol if bare domain provided (Render property: host returns e.g. 'estateos-api.onrender.com')
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `https://${clean}`;
  }

  // Strip trailing slashes
  clean = clean.replace(/\/+$/, '');

  // Ensure /api/v1 suffix is present
  if (!clean.endsWith('/api/v1')) {
    clean = `${clean}/api/v1`;
  }
  return clean;
};

const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    // 1. Runtime override from window or localStorage
    const runtimeUrl = (window as any).__ESTATEOS_API_URL__ || localStorage.getItem('estateos_api_url');
    if (runtimeUrl) {
      const normalized = normalizeApiUrl(runtimeUrl);
      if (normalized) return normalized;
    }

    // 2. If running locally on Vite dev server (port 3000 / 5173), route through relative /api/v1 proxy
    if (window.location.port === '3000' || window.location.port === '5173') {
      return '/api/v1';
    }
  }

  // 3. Environment variables configured during Render build (VITE_API_BASE_URL or VITE_API_URL)
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL || (import.meta as any).env?.VITE_API_URL;
  const normalizedEnv = normalizeApiUrl(envUrl);
  if (normalizedEnv) return normalizedEnv;

  // 4. Default fallback for local testing
  return 'http://127.0.0.1:8000/api/v1';
};

export class ApiService {
  private static token: string | null = localStorage.getItem('estateos_token');

  static setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('estateos_token', token);
    } else {
      localStorage.removeItem('estateos_token');
    }
  }

  static getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('estateos_token');
    }
    return this.token;
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const primaryUrl = getBaseUrl();
    let response: Response;

    try {
      response = await fetch(`${primaryUrl}${endpoint}`, {
        ...options,
        headers,
      });
    } catch (netErr: any) {
      // If primary relative fetch failed (e.g. proxy mismatch), fallback to direct backend URL
      if (primaryUrl.startsWith('/')) {
        try {
          response = await fetch(`http://127.0.0.1:8000/api/v1${endpoint}`, {
            ...options,
            headers,
          });
        } catch (fallbackErr: any) {
          throw new Error('Backend server is unreachable. Please verify EstateOS backend is running on port 8000.');
        }
      } else {
        throw new Error('Backend server is unreachable. Please verify EstateOS backend is running on port 8000.');
      }
    }

    if (response.status === 401 && endpoint !== '/auth/login') {
      this.setToken(null);
      window.location.href = '#/login';
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Request failed with status ${response.status}`);
    }

    return await response.json();
  }

  // Auth
  static async login(email: string, password: string) {
    const data = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.access_token);
    localStorage.setItem('estateos_user', JSON.stringify(data));
    return data;
  }

  static async register(organization_name: string, full_name: string, email: string, password: string) {
    const data = await this.request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ organization_name, full_name, email, password }),
    });
    this.setToken(data.access_token);
    localStorage.setItem('estateos_user', JSON.stringify(data));
    return data;
  }

  static logout() {
    this.setToken(null);
    localStorage.removeItem('estateos_user');
  }

  static getCurrentUser() {
    const u = localStorage.getItem('estateos_user');
    return u ? JSON.parse(u) : null;
  }

  // Dashboard & Reports
  static async getDashboardMetrics() {
    return this.request<any>('/reports/dashboard-metrics');
  }

  static async getExecutiveSummary() {
    return this.request<any>('/reports/executive-summary');
  }

  // Properties
  static async getProperties(params?: Record<string, any>) {
    const query = new URLSearchParams(params || {}).toString();
    return this.request<any[]>(`/properties${query ? `?${query}` : ''}`);
  }

  static async getProperty(id: string) {
    return this.request<any>(`/properties/${id}`);
  }

  static async createProperty(data: any) {
    return this.request<any>('/properties', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async deleteProperty(id: string) {
    return this.request<any>(`/properties/${id}`, { method: 'DELETE' });
  }

  static async getUnits(propertyId: string) {
    return this.request<any[]>(`/properties/${propertyId}/units`);
  }

  static async createUnit(propertyId: string, data: any) {
    return this.request<any>(`/properties/${propertyId}/units`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static exportPropertiesCsv() {
    const token = this.getToken();
    window.open(`${getBaseUrl()}/properties/export/csv?token=${token}`, '_blank');
  }

  // ZillowCore NGQR, MVE, RESO
  static async routeSpatialIntent(natural_language_query: string, target_result_limit = 6) {
    return this.request<any>('/geospatial/route-intent', {
      method: 'POST',
      body: JSON.stringify({ natural_language_query, target_result_limit }),
    });
  }

  static async calculateValuation(data: any) {
    return this.request<any>('/valuation/calculate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async getIngestionPipelines() {
    return this.request<any[]>('/ingestion/pipelines');
  }

  static async testResoFeed(feed_name: string, sample_payload: any) {
    return this.request<any>('/ingestion/test-feed', {
      method: 'POST',
      body: JSON.stringify({ feed_name, sample_payload }),
    });
  }

  // CRM & Leads
  static async getContacts(contact_type?: string) {
    return this.request<any[]>(`/crm/contacts${contact_type ? `?contact_type=${contact_type}` : ''}`);
  }

  static async createContact(data: any) {
    return this.request<any>('/crm/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async getLeads() {
    return this.request<any[]>('/crm/leads');
  }

  static async createLead(data: any) {
    return this.request<any>('/crm/leads', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateLeadStage(id: string, stage: string, notes?: string) {
    return this.request<any>(`/crm/leads/${id}/stage`, {
      method: 'PUT',
      body: JSON.stringify({ stage, notes }),
    });
  }

  // Leases
  static async getLeases() {
    return this.request<any[]>('/leases');
  }

  static async createLease(data: any) {
    return this.request<any>('/leases', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async renewLease(id: string, months = 12) {
    return this.request<any>(`/leases/${id}/renew?months=${months}`, { method: 'POST' });
  }

  static async signLease(id: string, signer_name: string) {
    return this.request<any>(`/leases/${id}/sign?signer_name=${encodeURIComponent(signer_name)}`, {
      method: 'POST',
    });
  }

  // Finance & Invoices
  static async getInvoices() {
    return this.request<any[]>('/finance/invoices');
  }

  static async createInvoice(data: any) {
    return this.request<any>('/finance/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async payInvoice(id: string) {
    return this.request<any>(`/finance/invoices/${id}/pay`, { method: 'PUT' });
  }

  static async getTransactions() {
    return this.request<any[]>('/finance/transactions');
  }

  static async getPnl() {
    return this.request<any>('/finance/pnl');
  }

  // Maintenance
  static async getMaintenanceTickets() {
    return this.request<any[]>('/maintenance/tickets');
  }

  static async createMaintenanceTicket(data: any) {
    return this.request<any>('/maintenance/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateTicketStatus(id: string, status: string) {
    return this.request<any>(`/maintenance/tickets/${id}/status?status=${status}`, { method: 'PUT' });
  }

  static async getWorkOrders() {
    return this.request<any[]>('/maintenance/work-orders');
  }

  // Sales
  static async getDeals() {
    return this.request<any[]>('/sales/deals');
  }

  static async createDeal(data: any) {
    return this.request<any>('/sales/deals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateDealStage(id: string, stage: string) {
    return this.request<any>(`/sales/deals/${id}/stage?stage=${stage}`, { method: 'PUT' });
  }

  // Documents
  static async getDocuments() {
    return this.request<any[]>('/documents');
  }

  static async uploadDocument(data: any) {
    return this.request<any>('/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async uploadDocumentFile(file: File, extra: { title?: string; document_type?: string; property_id?: string; ocr_extracted_text?: string } = {}) {
    const formData = new FormData();
    formData.append('file', file);
    if (extra.title) formData.append('title', extra.title);
    if (extra.document_type) formData.append('document_type', extra.document_type);
    if (extra.property_id) formData.append('property_id', extra.property_id);
    if (extra.ocr_extracted_text) formData.append('ocr_extracted_text', extra.ocr_extracted_text);

    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${getBaseUrl()}/documents/upload-file`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  }

  static async uploadPropertyImage(propertyId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${getBaseUrl()}/properties/${propertyId}/upload-image`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Image upload failed' }));
      throw new Error(err.detail || 'Image upload failed');
    }
    return res.json();
  }

  static async analyzeOcr(raw_text: string) {
    return this.request<any>('/documents/analyze-ocr', {
      method: 'POST',
      body: JSON.stringify({ raw_text }),
    });
  }

  // Vendors
  static async getVendors() {
    return this.request<any[]>('/vendors');
  }

  static async createVendor(data: any) {
    return this.request<any>('/vendors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // AI Multi-Agent & Command Center
  static async getAgentRegistry() {
    return this.request<any[]>('/agents/registry');
  }

  static async executeAgentTask(agent_code: string, task_type: string, input_payload: any, require_approval = false) {
    return this.request<any>('/agents/execute', {
      method: 'POST',
      body: JSON.stringify({ agent_code, task_type, input_payload, require_approval }),
    });
  }

  static async getAgentTasks() {
    return this.request<any[]>('/agents/tasks');
  }

  static async getPendingApprovals() {
    return this.request<any[]>('/agents/approvals/pending');
  }

  static async decideApproval(id: string, decision: 'approved' | 'rejected', comments?: string) {
    return this.request<any>(`/agents/approvals/${id}/decide`, {
      method: 'POST',
      body: JSON.stringify({ decision, comments }),
    });
  }

  static async executeCommand(prompt: string) {
    return this.request<any>('/command', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
  }

  // Automations
  static async getWorkflows() {
    return this.request<any[]>('/automations');
  }

  static async createWorkflow(data: any) {
    return this.request<any>('/automations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async triggerWorkflow(id: string) {
    return this.request<any>(`/automations/${id}/trigger`, { method: 'POST' });
  }

  // Developer Platform
  static async getApiKeys() {
    return this.request<any[]>('/developer/keys');
  }

  static async createApiKey(name: string, role = 'property_manager') {
    return this.request<any>('/developer/keys', {
      method: 'POST',
      body: JSON.stringify({ name, role }),
    });
  }

  static async revokeApiKey(id: string) {
    return this.request<any>(`/developer/keys/${id}`, { method: 'DELETE' });
  }

  static async getWebhooks() {
    return this.request<any[]>('/developer/webhooks');
  }

  static async createWebhook(target_url: string, event_types: string[]) {
    return this.request<any>('/developer/webhooks', {
      method: 'POST',
      body: JSON.stringify({ target_url, event_types }),
    });
  }

  static async getSdkSnippets() {
    return this.request<any>('/developer/sdk-snippets');
  }

  // Organization
  static async getOrganization() {
    return this.request<any>('/organization');
  }

  static async updateOrganization(data: { name?: string; currency?: string; tax_rate?: number }) {
    return this.request<any>('/organization', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async getTeam() {
    return this.request<any[]>('/organization/team');
  }
}

