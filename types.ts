
export interface Incident {
  id: string;
  incidentNumber: string;
  date: string;
  vendorName: string;
  technicianName: string;
  overallScore: number;
  punctualityScore: number;
  deliverablesScore: number;
  isAbandoned: boolean;
  feedback: string;
}

export interface MasterVendor {
  id: string;
  name: string;
}

export interface MasterTechnician {
  id: string;
  name: string;
  vendorName: string;
}

export interface BannedTechnician {
  id: string;
  name: string;
  vendorName: string;
  customerName: string;
  reason: string;
  dateAdded: string;
}

export interface UserAccount {
  id: string;
  username: string;
  passwordHash: string;
}

export interface AnalysisResult {
  entityName: string;
  totalIncidents: number;
  avgOverall: number;
  avgPunctuality: number;
  avgDeliverables: number;
  totalAbandons: number;
  reportText: string;
}

export enum EntityType {
  TECHNICIAN = 'Technician',
  VENDOR = 'Vendor'
}
