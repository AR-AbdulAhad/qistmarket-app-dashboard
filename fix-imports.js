const fs = require('fs');

const files = [
    'src/app/(site)/csr/website-orders/[id]/page.tsx',
    'src/app/(site)/verifications/[id]/page.tsx',
    'src/components/common/DeliveredProductDetails.tsx',
    'src/components/common/MediaCard.tsx',
    'src/components/common/RecoveryVisitDetails.tsx',
    'src/components/OfficerAttendanceHistory.tsx',
    'src/components/OfficerProfileHistory.tsx',
    'src/app/(site)/orders/[id]/page.tsx'
];

files.forEach(f => {
    if (!fs.existsSync(f)) return;
    let content = fs.readFileSync(f, 'utf8');
    
    if (content.includes('formatExactDate') && !content.includes('import { formatExactDate }')) {
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
        fs.writeFileSync(f, content, 'utf8');
        console.log('Added import to ' + f);
    }
});
