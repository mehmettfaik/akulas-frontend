export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'responsible' | 'desk';
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  vehicleNumber: number;
  routeName: string;
  driverName: string;
  iban: string;
  taxId: string;
  createdAt: string;
  updatedAt: string;
}

export interface HakedisFormData {
  date: string;
  type: 'HAFTALIK' | 'KREDI_KARTI';
  routes: Record<string, number>;
  vehicles?: Record<string, number>;
  raporal: number;
  sistem: number;
}

export interface HakedisRecord {
  id: string;
  date: string;
  type: 'HAFTALIK' | 'KREDI_KARTI';
  totalAmount: number;
  raporal: number;
  sistem: number;
  difference: number;
  createdBy: string;
  createdAt: string;
}

export interface Report {
  id: string;
  date: string;
  vehicleNumber: number;
  plateNumber?: string;
  routeName: string;
  routeAmount: number;        // Hat bazlı tutar
  vehicleAmount: number;      // Araç bazlı tutar (kredi kartı)
  totalAmount: number;        // Toplam tutar
  types: string[];            // Hakediş tipleri (HAFTALIK, KREDI_KARTI)
}

export interface DeskRecord {
  id: string;
  date: string;
  products: {
    dolum: number;
    tamKart: number;
    indirimliKart: number;
    serbestKart: number;
    serbestVize: number;
    indirimliVize: number;
    kartKilifi: number;
  };
  categoryCreditCards: {
    dolum: number;
    kart: number;
    vize: number;
    kartKilifi: number;
  };
  payments: {
    gunbasiNakit: number;
    bankayaGonderilen: number;
    ertesiGuneBirakilan: number;
  };
  banknotes?: {
    dolum: {
      b200: number;
      b100: number;
      b50: number;
      b20: number;
      b10: number;
      b5: number;
      c1: number;
      c050: number;
    };
    kart: {
      b200: number;
      b100: number;
      b50: number;
      b20: number;
      b10: number;
      b5: number;
      c1: number;
      c050: number;
    };
    vize: {
      b200: number;
      b100: number;
      b50: number;
      b20: number;
      b10: number;
      b5: number;
      c1: number;
      c050: number;
    };
  };
  bankSentCash?: {
    dolum: number;
    kart: number;
    vize: number;
    totalSent: number;
  };
  totals: {
    totalSales: number;
    totalCreditCard: number;
    totalCash: number;
    cashInRegister: number;
    difference: number;
  };
  submittedBy: string;
  submittedByEmail?: string;
  submittedAt: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'pending_revision' | 'revised';
  reviewedBy?: string;
  reviewedByEmail?: string;
  reviewedByRole?: string;
  reviewAction?: string;
  reviewNotes?: string;
  reviewedAt?: string;
}

export interface WeeklyHakedisSummaryResponse {
  startDate: string;
  endDate: string;
  summary: {
    totalHaftalik: number;
    totalKrediKarti: number;
    grandTotal: number;
    vehicleCount: number;
  };
  vehicles: WeeklyVehicleSummary[];
}

export interface WeeklyVehicleSummary {
  vehicleNumber: number;
  plateNumber: string;
  routeName: string;
  iban: string;
  taxId: string;
  haftalik: {
    routeAmount: number;
    vehicleAmount: number;
    totalAmount: number;
  };
  krediKarti: {
    routeAmount: number;
    vehicleAmount: number;
    totalAmount: number;
  };
  grandTotal: number;
}

export interface VehicleReportResponse {
  vehicle: {
    vehicleNumber: number;
    plateNumber: string;
    routeName: string;
    driverName: string;
  };
  reports: Report[];
  summary: {
    totalAmount: number;
    totalRouteAmount: number;
    totalVehicleAmount: number;
    reportCount: number;
    startDate: string;
    endDate: string;
  };
}

export interface RouteReportResponse {
  routeName: string;
  vehicles: {
    vehicleNumber: number;
    plateNumber: string;
    routeName: string;
    driverName: string;
  }[];
  reports: {
    date: string;
    routeAmount: number;
    vehicleAmount: number;
    totalAmount: number;
    vehicleCount: number;
    types: string[];
  }[];
  summary: {
    totalAmount: number;
    totalRouteAmount: number;
    totalVehicleAmount: number;
    recordCount: number;
    vehicleCount: number;
    startDate: string;
    endDate: string;
  };
}

export interface SummaryReportResponse {
  total: {
    records: number;
    raporal: number;
    sistem: number;
    difference: number;
  };
  weekly: {
    records: number;
    raporal: number;
    sistem: number;
    difference: number;
  };
  creditCard: {
    records: number;
    raporal: number;
    sistem: number;
    difference: number;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface DateRangeReportResponse {
  records: {
    id: string;
    date: string;
    type: string;
    routes: Record<string, number>;
    vehicles: Record<string, number>;
    raporal: number;
    sistem: number;
    difference: number;
  }[];
  totals: {
    totalRaporal: number;
    totalSystem: number;
    totalDifference: number;
    recordCount: number;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  error?: string;
}

export interface BayiDolumRecord {
  id: string;
  date: string;
  products: {
    bayiDolum: number;
    bayiTamKart: number;
    bayiKartKilifi: number;
    posRulosu: number;
  };
  categoryCreditCards: {
    dolum: number;
    kart: number;
  };
  payments: {
    gunbasiNakit: number;
    bankayaGonderilen: number;
    ertesiGuneBirakilan: number;
  };
  banknotes?: {
    dolum: {
      b200: number;
      b100: number;
      b50: number;
      b20: number;
      b10: number;
      b5: number;
      c1: number;
      c050: number;
    };
    kart: {
      b200: number;
      b100: number;
      b50: number;
      b20: number;
      b10: number;
      b5: number;
      c1: number;
      c050: number;
    };
  };
  bankSentCash?: {
    dolum: number;
    kart: number;
    totalSent: number;
  };
  totals: {
    totalSales: number;
    totalCreditCard: number;
    totalCash: number;
    cashInRegister: number;
    difference: number;
  };
  submittedBy: string;
  submittedByEmail?: string;
  submittedAt: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'pending_revision' | 'revised';
  reviewedBy?: string;
  reviewedByEmail?: string;
  reviewedByRole?: string;
  reviewAction?: string;
  reviewNotes?: string;
  reviewedAt?: string;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  tcNo: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  startDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveEntitlement {
  id: string;
  employeeId: string;
  year: number;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName?: string;
  leaveType: 'annual' | 'sick' | 'excuse' | 'unpaid';
  startDate: string;
  endDate: string;
  totalDays: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  description?: string;
  requestedAt: string;
  reviewedBy?: string;
  reviewedByEmail?: string;
  reviewNotes?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}
