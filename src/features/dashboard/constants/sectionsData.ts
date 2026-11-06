import { StudentCategory } from '../types';

export interface DepartmentSectionGroup {
  id: string;
  name: string;
  shortName: string;
  studentCategory: StudentCategory;
  defaultGradeLevel?: string;
  sections: string[];
}

export const DEPARTMENT_SECTION_GROUPS: DepartmentSectionGroup[] = [
  {
    id: 'shs-11',
    name: 'Senior High School — Grade 11',
    shortName: 'SHS — Grade 11',
    studentCategory: 'Senior High School',
    defaultGradeLevel: 'Grade 11',
    sections: [
      'HUMSS11-ST. ALBERT CHMIEHLOWSKI',
      '11-ST. CAMILLUS DE LELLIS',
      '11-ST. DAMIEN DE VEUSTER',
      '11-ST. ELIZABETH OF HUNGARY',
      '11-ST. FAUSTINA KOWALSKA',
      'HUMSS11-ST. FRANCISCO MARTO',
      '11-ST. GIANNA BERETTA MOLLA',
      'HUMSS11-ST. JACINTA MARTO',
      '11-ST. JEROME EMILLANI',
      '11-ST. JOHN BOSCO',
      '11-ST. JOHN MARIE VIANNEY',
      '11-ST. JOHN OF GOD',
      '11-ST. JOSEPH BENEDICT COTTO',
      '11-ST. LEOPOLD MANLIC',
      'SHS11- ST. MAXIMILIAN KOLBE',
      '11-ST. PETER CLAVER',
      '11-ST. TERESA OF CALCUTTA',
      'STEM11-ST. VINCENT DE PAUL',
    ],
  },
  {
    id: 'shs-12',
    name: 'Senior High School — Grade 12',
    shortName: 'SHS — Grade 12',
    studentCategory: 'Senior High School',
    defaultGradeLevel: 'Grade 12',
    sections: [
      'STEM12-OUR LADY OF FATIMA',
      'STEM12-OUR LADY OF GOOD COUNSEL',
      'GAS12-OUR LADY OF GRACE',
      'SHS12- OUR LADY OF GUADALUPE',
      'SHS12- OUR LADY OF IMMA CON',
      'SHS12- OUR LADY OF LIFE',
      'GAS12-OUR LADY OF LIGHT',
      'STEM12-OUR LADY OF LOURDES',
      'HUMSS12-OUR LADY OF LORETO',
      'SHS12- OUR LADY OF M. MEDAL',
      'STEM12-OUR LADY OF MERCY',
      'SHS12- OUR LADY OF MONTSERRAT',
      'SHS12- OUR LADY OF MT. CARMEL',
      'SHS12- OUR LADY OF PEACE',
      'SHS12- OUR LADY OF P. HELP',
      'SHS12- OUR LADY OF REMEDIES',
      'ABM12-OUR LADY OF SORROWS',
      'SHS12- OUR LADY OF THE PILLAR',
      'SHS12- OUR LADY OF THE ROSARY',
    ],
  },
  {
    id: 'conp-bsn-bsp',
    name: 'College of Nursing & Pharmacy (BSN & BSP)',
    shortName: 'CONP — BSN / BSP',
    studentCategory: 'College',
    sections: [
      'BSN 1A', 'BSN 1B', 'BSN 1C', 'BSN 1D', 'BSN 1E', 'BSN 1F', 'BSN 1G', 'BSN 1H',
      'BSN 2A', 'BSN 2B', 'BSN 2C', 'BSN 2D', 'BSN 2E', 'BSN 2F',
      'BSN 3A', 'BSN 3B', 'BSN 3C', 'BSN 3D',
      'BSN 4A', 'BSN 4B', 'BSN 4C', 'BSN 4D',
      'BSP 1A', 'BSP 2A', 'BSP 2B', 'BSP 3A', 'BSP 4A',
    ],
  },
  {
    id: 'coa-acc-ais',
    name: 'College of Accountancy (ACC & AIS)',
    shortName: 'COA — ACC / AIS',
    studentCategory: 'College',
    sections: [
      'ACC 1A', 'ACC 1B', 'ACC 1C', 'ACC 1D', 'ACC 1E',
      'ACC 2A', 'ACC 2B', 'ACC 2C', 'ACC 2D',
      'ACC 3A', 'ACC 3B', 'ACC 3C', 'ACC 3D',
      'ACC 4A', 'ACC 4B', 'ACC 4C',
      'ACC 5A', 'ACC 5B', 'ACC 5C',
      'AIS 1A', 'AIS 1B', 'AIS 1C',
      'AIS 2A', 'AIS 2B', 'AIS 2C',
      'AIS 3A', 'AIS 3B', 'AIS 3C',
      'AIS 4A', 'AIS 4B', 'AIS 4C',
    ],
  },
  {
    id: 'cba-mm-om',
    name: 'College of Business Administration (MM & OM)',
    shortName: 'CBA — MM / OM',
    studentCategory: 'College',
    sections: [
      'MM 1A', 'MM 1B', 'MM 2A', 'MM 2B', 'MM 3A', 'MM 3B', 'MM 4A', 'MM 4B',
      'OM 1A', 'OM 1B', 'OM 2A', 'OM 3A', 'OM 3B', 'OM 4A', 'OM 4B',
    ],
  },
  {
    id: 'chtm-hm-tm',
    name: 'College of Hospitality & Tourism Management (HM & TM)',
    shortName: 'CHTM — HM / TM',
    studentCategory: 'College',
    sections: [
      'HM 1A', 'HM 1B', 'HM 2A', 'HM 2B', 'HM 3A', 'HM 3B', 'HM 4A', 'HM 4B',
      'TM 1A', 'TM 1B', 'TM 1C', 'TM 2A', 'TM 2B', 'TM 2C', 'TM 3A', 'TM 3B', 'TM 3C', 'TM 4A', 'TM 4B',
    ],
  },
  {
    id: 'ccs-cs-it',
    name: 'College of Computing Studies (BSCS & BSIT)',
    shortName: 'CCS — CS / IT',
    studentCategory: 'College',
    sections: [
      'CS 1A', 'CS 2A', 'CS 3A', 'CS 4A',
      'IT 1A', 'IT 1B', 'IT 1C',
      'IT 2A', 'IT 2B', 'IT 2C',
      'IT 3A', 'IT 3B',
      'IT 4A', 'IT 4B',
    ],
  },
  {
    id: 'cea-eng',
    name: 'College of Engineering & Architecture (CE, CPE & IE)',
    shortName: 'CEA — CE / CPE / IE',
    studentCategory: 'College',
    sections: [
      'CE 1A', 'CE 1B', 'CE 1C', 'CE 2A', 'CE 2B', 'CE 2C', 'CE 3A', 'CE 3B', 'CE 4A', 'CE 4B', 'CE 5A',
      'CPE 1A', 'CPE 2A', 'CPE 3A', 'CPE 4A', 'CPE 5A',
      'IE 1A', 'IE 2A', 'IE 3A', 'IE 4A', 'IE 5A',
    ],
  },
  {
    id: 'cea-ar',
    name: 'College of Engineering & Architecture (BS Architecture)',
    shortName: 'CEA — Architecture (AR)',
    studentCategory: 'College',
    sections: [
      'AR 1A', 'AR 1B', 'AR 1C', 'AR 2A', 'AR 2B', 'AR 2C',
      'AR 3A', 'AR 3B', 'AR 4A', 'AR 4B', 'AR 5A', 'AR 5B',
    ],
  },
  {
    id: 'ccj-sas-crim-psych',
    name: 'Criminology & Psychology (BS CRIM & PSYCH)',
    shortName: 'CRIM & PSYCH',
    studentCategory: 'College',
    sections: [
      'BS CRIM 1A', 'BS CRIM 2A', 'BS CRIM 3A', 'BS CRIM 4A',
      'PSYCH 1A', 'PSYCH 1B', 'PSYCH 2A', 'PSYCH 2B', 'PSYCH 3A', 'PSYCH 3B', 'PSYCH 4A', 'PSYCH 4B',
    ],
  },
  {
    id: 'sas-comm-bhs-blis',
    name: 'School of Arts & Sciences (AB COMM, BHS & BLIS)',
    shortName: 'SAS — AB COMM / BHS / BLIS',
    studentCategory: 'College',
    sections: [
      'AB COMM 1A', 'AB COMM 1B', 'AB COMM 2A', 'AB COMM 3A', 'AB COMM 4A',
      'BHS 1A', 'BHS 2A', 'BHS 3A', 'BHS 4A',
      'BLIS 1A', 'BLIS 2A', 'BLIS 3A', 'BLIS 4A',
    ],
  },
  {
    id: 'sed-educ',
    name: 'School of Education (EDUC / BPED / BSED / GENED / REVE / VERE)',
    shortName: 'SED — Education',
    studentCategory: 'College',
    sections: [
      'EDUC 1A', 'EDUC 2A', 'EDUC 3A', 'EDUC 4A',
      'GENED2A', 'GENED3A', 'EDUC 4B', 'GENED4A',
      'BPED1A', 'BPED2A', 'BPED 3A', 'BPED 4A',
      'BSED4FIL-C', 'FIL4A',
      'MAPEH1A', 'MAPEH2A', 'MAPEH3A', 'MAPEH4A',
      'MATH1A', 'MATH2A', 'MATH3A', 'MATH4A',
      'REVE 1A', 'REVE1A', 'EDUC 2B', 'REVE2A', 'EDUC 3B', 'REVE3A', 'REVE4A',
      'SS2A', 'SOCST4A',
      'VERE 1A', 'VERE 2A', 'VERE 3A', 'VERE 4A',
      'ENG2A', 'ENG3A', 'BSE 4A', 'ENG4A', 'FIL2A', 'FIL3A',
    ],
  },
];

export interface CensusSheetGroup {
  id: string;
  sheetName: string;
  label: string;
  sectionHeader: 'YEAR & SECTION' | 'COURSE & SECTION:';
  hasSpacerRows: boolean;
  totalFillHex: string;
  totalFillArgb: string;
  colWidths: [number, number, number, number, number, number];
  sections: string[];
}

export function getCensusSheetGroups(): CensusSheetGroup[] {
  const depts = loadDepartmentSectionGroups();
  const byId = Object.fromEntries(depts.map(d => [d.id, d.sections]));
  const sasAll = byId['sas-comm-bhs-blis'] || [];
  const isCommOrAr = (s: string) => /^(AB\s*)?COMM|^BA\s*COMM|^AR\b/i.test((s || '').trim());
  const abComm = sasAll.filter(isCommOrAr);
  const bhsBlis = sasAll.filter(s => !isCommOrAr(s));

  return [
    {
      id: 'shs-11',
      sheetName: 'G11',
      label: 'G11 (SHS Grade 11)',
      sectionHeader: 'YEAR & SECTION',
      hasSpacerRows: true,
      totalFillHex: '#FFCCFF',
      totalFillArgb: 'FFFFCCFF',
      colWidths: [31.29, 18.57, 18.14, 18.43, 21, 12.71],
      sections: byId['shs-11'] || [],
    },
    {
      id: 'shs-12',
      sheetName: 'G12',
      label: 'G12 (SHS Grade 12)',
      sectionHeader: 'YEAR & SECTION',
      hasSpacerRows: true,
      totalFillHex: '#3399FF',
      totalFillArgb: 'FF3399FF',
      colWidths: [36.14, 18.29, 18.14, 18.43, 18.14, 14],
      sections: byId['shs-12'] || [],
    },
    {
      id: 'comm-ar',
      sheetName: 'ABCOMM, AR',
      label: 'ABCOMM, AR',
      sectionHeader: 'COURSE & SECTION:',
      hasSpacerRows: false,
      totalFillHex: '#00B050',
      totalFillArgb: 'FF00B050',
      colWidths: [20.86, 18.14, 18.43, 18.57, 19.14, 9.14],
      sections: [...abComm, ...(byId['cea-ar'] || [])],
    },
    {
      id: 'sed-educ',
      sheetName: 'EDUC',
      label: 'EDUC',
      sectionHeader: 'COURSE & SECTION:',
      hasSpacerRows: false,
      totalFillHex: '#E2EFD9',
      totalFillArgb: 'FFE2EFD9',
      colWidths: [21.43, 16.29, 17.29, 17.57, 19.86, 8.71],
      sections: byId['sed-educ'] || [],
    },
    {
      id: 'bhs-blis',
      sheetName: 'PSE,BHS,BLIS',
      label: 'PSE,BHS,BLIS',
      sectionHeader: 'COURSE & SECTION:',
      hasSpacerRows: false,
      totalFillHex: '#F7CAAC',
      totalFillArgb: 'FFF7CAAC',
      colWidths: [22.14, 23.14, 24.43, 22.86, 18.14, 8.71],
      sections: bhsBlis,
    },
    {
      id: 'chtm-hm-tm',
      sheetName: 'HM,TM',
      label: 'HM,TM',
      sectionHeader: 'COURSE & SECTION:',
      hasSpacerRows: false,
      totalFillHex: '#ADB9CA',
      totalFillArgb: 'FFADB9CA',
      colWidths: [26.57, 13.71, 16.14, 17.14, 17.29, 9.14],
      sections: byId['chtm-hm-tm'] || [],
    },
    {
      id: 'ccj-sas-crim-psych',
      sheetName: 'CRIM, PSYCH',
      label: 'CRIM, PSYCH',
      sectionHeader: 'COURSE & SECTION:',
      hasSpacerRows: false,
      totalFillHex: '#FBE4D5',
      totalFillArgb: 'FFFBE4D5',
      colWidths: [22.43, 15.86, 16.57, 16.86, 20, 8.71],
      sections: byId['ccj-sas-crim-psych'] || [],
    },
    {
      id: 'coa-acc-ais',
      sheetName: 'ACC,AIS',
      label: 'ACC,AIS',
      sectionHeader: 'COURSE & SECTION:',
      hasSpacerRows: false,
      totalFillHex: '#ECECEC',
      totalFillArgb: 'FFECECEC',
      colWidths: [22, 18.14, 18.43, 18.14, 18.29, 8.71],
      sections: byId['coa-acc-ais'] || [],
    },
    {
      id: 'cba-mm-om',
      sheetName: 'MM,OM',
      label: 'MM,OM',
      sectionHeader: 'COURSE & SECTION:',
      hasSpacerRows: false,
      totalFillHex: '#FF0000',
      totalFillArgb: 'FFFF0000',
      colWidths: [21.43, 18.14, 18.43, 18.43, 18.14, 9.14],
      sections: byId['cba-mm-om'] || [],
    },
    {
      id: 'cea-eng',
      sheetName: 'ENGR',
      label: 'ENGR',
      sectionHeader: 'COURSE & SECTION:',
      hasSpacerRows: false,
      totalFillHex: '#00CC99',
      totalFillArgb: 'FF00CC99',
      colWidths: [20.43, 18.29, 18.43, 18.43, 18.29, 8.71],
      sections: byId['cea-eng'] || [],
    },
    {
      id: 'ccs-cs-it',
      sheetName: 'IT, CS',
      label: 'IT, CS',
      sectionHeader: 'COURSE & SECTION:',
      hasSpacerRows: false,
      totalFillHex: '#FFE598',
      totalFillArgb: 'FFFFE598',
      colWidths: [20.43, 18.29, 18, 18.14, 20.14, 9.14],
      sections: byId['ccs-cs-it'] || [],
    },
    {
      id: 'conp-bsn-bsp',
      sheetName: 'BSN, BSP',
      label: 'BSN, BSP',
      sectionHeader: 'COURSE & SECTION:',
      hasSpacerRows: false,
      totalFillHex: '#DEEAF6',
      totalFillArgb: 'FFDEEAF6',
      colWidths: [21.71, 18.57, 18.14, 18, 18.29, 9.14],
      sections: byId['conp-bsn-bsp'] || [],
    },
  ];
}

const STORAGE_KEY = 'cura_custom_department_sections_v2';
export const SECTIONS_UPDATED_EVENT = 'cura-sections-updated';

export function loadDepartmentSectionGroups(): DepartmentSectionGroup[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEPARTMENT_SECTION_GROUPS;
    const saved: Record<string, string[]> = JSON.parse(raw);
    return DEPARTMENT_SECTION_GROUPS.map(dept => ({
      ...dept,
      sections: Array.isArray(saved[dept.id]) ? saved[dept.id] : dept.sections,
    }));
  } catch {
    return DEPARTMENT_SECTION_GROUPS;
  }
}

export function saveDepartmentSectionGroups(groups: DepartmentSectionGroup[]): void {
  try {
    const map: Record<string, string[]> = {};
    groups.forEach(g => { map[g.id] = g.sections; });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(SECTIONS_UPDATED_EVENT));
    }
  } catch {}
}

export function inferYearLevelFromSection(section: string, studentCategory: StudentCategory): string {
  if (studentCategory !== 'College') return '';
  const match = section.match(/([1-5])[A-Z](?:-[A-Z])?$/i) || section.match(/([1-5])/);
  if (!match) return '';
  const yr = match[1];
  switch (yr) {
    case '1': return '1st Year';
    case '2': return '2nd Year';
    case '3': return '3rd Year';
    case '4': return '4th Year';
    case '5': return '5th Year';
    default: return '';
  }
}
