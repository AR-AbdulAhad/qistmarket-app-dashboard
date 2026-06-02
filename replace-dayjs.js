const fs = require('fs');

const files = [
  'src/app/(site)/notifications/page.tsx',
  'src/app/(site)/orders/[id]/page.tsx',
  'src/app/(site)/outlet/security-logs/page.tsx',
  'src/components/ApprovedOrderList/ApprovedOrderList.tsx',
  'src/components/Installments/InstallmentLedgerEditor.tsx',
  'src/components/OrderList/OrderList.tsx',
  'src/components/RecoveryOrderList/RecoveryOrderList.tsx',
  'src/components/Tables/invoice-table.tsx',
  'src/components/VerificationList/VerificationTable.tsx',
  'src/components/WebsiteOrders/WebsiteOrdersTable.tsx'
];

files.forEach(f => {
  try {
    let content = fs.readFileSync(f, 'utf8');
    
    // Replace dayjs formatting
    if (content.includes('.format(')) {
      content = content.replace(/dayjs\(([^)]+)\)\.format\(([^)]+)\)/g, 'formatExactDate($1, $2)');
    }
    
    // Replace dayjs.utc(val).format(...) if it exists
    if (content.includes('.format(')) {
      content = content.replace(/dayjs\.utc\(([^)]+)\)\.format\(([^)]+)\)/g, 'formatExactDate($1, $2)');
    }

    // Add formatExactDate import
    if (content.includes('formatExactDate(') && !content.includes('import { formatExactDate }')) {
       const lines = content.split('\n');
       let lastImportIndex = -1;
       for (let i = 0; i < lines.length; i++) {
           if (lines[i].trim().startsWith('import ')) {
               lastImportIndex = i;
           }
       }
       if (lastImportIndex !== -1) {
           lines.splice(lastImportIndex + 1, 0, 'import { formatExactDate } from "@/utils/dateUtils";');
       } else {
           lines.unshift('import { formatExactDate } from "@/utils/dateUtils";');
       }
       content = lines.join('\n');
    }

    // Check if we need to remove dayjs imports
    // Only remove if it's completely unused
    const isDayjsUsed = /dayjs[.(]/.test(content);
    if (!isDayjsUsed && content.includes('dayjs')) {
       content = content.replace(/import\s+dayjs\s+from\s+['"]dayjs['"];?\r?\n?/g, '');
       content = content.replace(/import\s+utc\s+from\s+['"]dayjs\/plugin\/utc['"];?\r?\n?/g, '');
       content = content.replace(/dayjs\.extend\(utc\);?\r?\n?/g, '');
    }

    fs.writeFileSync(f, content, 'utf8');
    console.log('Updated: ' + f);
  } catch (e) {
    console.log(f + ' - ERROR: ' + e.message);
  }
});
