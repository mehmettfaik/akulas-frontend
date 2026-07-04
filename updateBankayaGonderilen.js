const fs = require('fs');

const path = '/Users/mehmettfaik/Documents/GitHub/akulas-frontend/src/pages/BankayaGonderilenPage.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "import { deskService } from '../services/deskService';",
  "import { deskService } from '../services/deskService';\nimport { kioskDolumService } from '../services/kioskDolumService';"
);

content = content.replace(
  "type: 'all' | 'desk' | 'bayi'",
  "type: 'all' | 'desk' | 'bayi' | 'kiosk'"
);

content = content.replace(
  "type: 'desk' | 'bayi'",
  "type: 'desk' | 'bayi' | 'kiosk'"
);

content = content.replace(
  "const [deskResponse, bayiResponse] = await Promise.all([\n        deskService.getSubmitted(),\n        bayiDolumService.getSubmitted()\n      ]);",
  "const [deskResponse, bayiResponse, kioskResponse] = await Promise.all([\n        deskService.getSubmitted(),\n        bayiDolumService.getSubmitted(),\n        kioskDolumService.getSubmitted()\n      ]);"
);

content = content.replace(
  "const bayiRecords: BankSentRecord[] = (bayiResponse.data || [])\n        .filter((record: BayiDolumRecord) => record.bankSentCash &&\n          ((record.bankSentCash.dolum || 0) > 0 || (record.bankSentCash.kart || 0) > 0))\n        .map((record: BayiDolumRecord) => ({\n          id: record.id,\n          date: record.date,\n          type: 'bayi' as const,\n          status: record.status,\n          bankSentCash: record.bankSentCash || {},\n          banknotes: record.banknotes,\n          submittedByEmail: record.submittedByEmail || record.submittedBy,\n          submittedAt: record.submittedAt || record.createdAt,\n          reviewedByEmail: record.reviewedByEmail,\n          reviewNotes: record.reviewerNotes,\n          reviewedAt: record.reviewedAt,\n        }));\n\n      const allRecords = [...deskRecords, ...bayiRecords].sort((a, b) => \n        new Date(b.date).getTime() - new Date(a.date).getTime()\n      );",
  "const bayiRecords: BankSentRecord[] = (bayiResponse.data || [])\n        .filter((record: BayiDolumRecord) => record.bankSentCash &&\n          ((record.bankSentCash.dolum || 0) > 0 || (record.bankSentCash.kart || 0) > 0))\n        .map((record: BayiDolumRecord) => ({\n          id: record.id,\n          date: record.date,\n          type: 'bayi' as const,\n          status: record.status,\n          bankSentCash: record.bankSentCash || {},\n          banknotes: record.banknotes,\n          submittedByEmail: record.submittedByEmail || record.submittedBy,\n          submittedAt: record.submittedAt || record.createdAt,\n          reviewedByEmail: record.reviewedByEmail,\n          reviewNotes: record.reviewerNotes,\n          reviewedAt: record.reviewedAt,\n        }));\n\n      const kioskRecords: BankSentRecord[] = (kioskResponse.data || [])\n        .filter((record: any) => record.bankSentCash && (record.bankSentCash.dolum || 0) > 0)\n        .map((record: any) => ({\n          id: record.id,\n          date: record.date,\n          type: 'kiosk' as const,\n          status: record.status,\n          bankSentCash: record.bankSentCash || {},\n          banknotes: record.banknotes,\n          submittedByEmail: record.submittedByEmail || record.submittedBy,\n          submittedAt: record.submittedAt || record.createdAt,\n          reviewedByEmail: record.reviewedByEmail,\n          reviewNotes: record.reviewerNotes,\n          reviewedAt: record.reviewedAt,\n        }));\n\n      const allRecords = [...deskRecords, ...bayiRecords, ...kioskRecords].sort((a, b) => \n        new Date(b.date).getTime() - new Date(a.date).getTime()\n      );"
);

content = content.replace(
  "await bayiDolumService.review(id, 'deliver_to_bank');",
  "await bayiDolumService.review(id, 'deliver_to_bank');\n          } else if (record.type === 'kiosk') {\n            await kioskDolumService.review(id, 'deliver_to_bank');"
);

content = content.replace(
  "await bayiDolumService.review(recordId, action, reviewNotes || undefined);",
  "await bayiDolumService.review(recordId, action, reviewNotes || undefined);\n      } else if (selectedRecord.type === 'kiosk') {\n        await kioskDolumService.review(recordId, action, reviewNotes || undefined);"
);

fs.writeFileSync(path, content, 'utf8');
console.log('updated BankayaGonderilenPage.tsx');
