
import { Incident } from './types';

export const MOCK_DATA: Incident[] = [
  {
    id: '1',
    incidentNumber: 'INC-2024-001',
    date: '2024-05-10',
    vendorName: 'QuickFix Systems',
    technicianName: 'John Doe',
    overallScore: 5,
    punctualityScore: 5,
    deliverablesScore: 4,
    isAbandoned: false,
    feedback: 'Excellent work, arrived exactly on time and fixed the router issues swiftly.'
  },
  {
    id: '2',
    incidentNumber: 'INC-2024-002',
    date: '2024-05-12',
    vendorName: 'QuickFix Systems',
    technicianName: 'John Doe',
    overallScore: 2,
    punctualityScore: 1,
    deliverablesScore: 2,
    isAbandoned: false,
    feedback: 'Technician was 2 hours late. Did not bring necessary tools, though eventually completed the task.'
  },
  {
    id: '3',
    incidentNumber: 'INC-2024-003',
    date: '2024-05-15',
    vendorName: 'Reliable Infra',
    technicianName: 'Sarah Smith',
    overallScore: 1,
    punctualityScore: 1,
    deliverablesScore: 1,
    isAbandoned: true,
    feedback: 'Sarah left mid-job citing another appointment. Critical failure.'
  },
  {
    id: '4',
    incidentNumber: 'INC-2024-004',
    date: '2024-05-16',
    vendorName: 'QuickFix Systems',
    technicianName: 'John Doe',
    overallScore: 4,
    punctualityScore: 4,
    deliverablesScore: 5,
    isAbandoned: false,
    feedback: 'Solid performance. Clean work area.'
  },
  {
    id: '5',
    incidentNumber: 'INC-2024-005',
    date: '2024-05-20',
    vendorName: 'Reliable Infra',
    technicianName: 'Sarah Smith',
    overallScore: 3,
    punctualityScore: 4,
    deliverablesScore: 3,
    isAbandoned: false,
    feedback: 'Average work. Documentation was a bit messy but acceptable.'
  }
];
