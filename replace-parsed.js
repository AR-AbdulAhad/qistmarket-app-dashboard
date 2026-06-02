const fs = require('fs');

function processFile(path) {
    if (!fs.existsSync(path)) return;
    let content = fs.readFileSync(path, 'utf8');
    
    let modified = false;

    // Replacement for formats like:
    // const parsed = dayjs(value);
    // return parsed.isValid() ? parsed.format("MMM D, YYYY h:mm A") : value;
    // to: return formatExactDate(value, "MMM D, YYYY h:mm A");

    if (content.includes('parsed.isValid() ? parsed.format("')) {
        content = content.replace(/const parsed = dayjs\(([^)]+)\);\s*return parsed\.isValid\(\)\s*\?\s*parsed\.format\((['"][^'"]+['"])\)\s*:\s*([^;]+);/g, 'return formatExactDate($1, $2);');
        modified = true;
    }
    if (content.includes('parsed.isValid() ? parsed.format(')) {
        content = content.replace(/return parsed\.isValid\(\)\s*\?\s*parsed\.format\((['"][^'"]+['"])\)\s*:\s*([^;]+);/g, 'return formatExactDate(value, $1);');
        // also remove const parsed = dayjs(value);
        content = content.replace(/const parsed = dayjs\(value\);\r?\n\s*/g, '');
        modified = true;
    }

    // Replace date.format(...) inside OfficerProfileHistory
    if (content.includes('date.format(')) {
        content = content.replace(/const formattedDate = date\.format\(([^)]+)\);/g, 'const formattedDate = formatExactDate(entry.updatedAt, $1);');
        content = content.replace(/const formattedTime = date\.format\(([^)]+)\);/g, 'const formattedTime = formatExactDate(entry.updatedAt, $1);');
        // Remove const date = dayjs(...)
        content = content.replace(/const date = dayjs\(entry\.updatedAt\);\r?\n\s*/g, '');
        modified = true;
    }

    // Replace date.format(...) inside OfficerAttendanceHistory
    if (content.includes('.format(') && (path.includes('OfficerAttendanceHistory'))) {
        content = content.replace(/date\.format\(([^)]+)\)/g, 'formatExactDate(stat.date, $1)');
        content = content.replace(/start\.format\(([^)]+)\)/g, 'formatExactDate(sess.start_time, $1)');
        content = content.replace(/end\.format\(([^)]+)\)/g, 'formatExactDate(sess.end_time, $1)');
        modified = true;
    }

    if (modified) {
        // Add import
        if (!content.includes('formatExactDate')) {
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

        // Clean up unused dayjs imports
        if (!content.includes('dayjs(') && !content.includes('dayjs.')) {
            content = content.replace(/import\s+dayjs\s+from\s+['"]dayjs['"];?\r?\n?/g, '');
            content = content.replace(/import\s+utc\s+from\s+['"]dayjs\/plugin\/utc['"];?\r?\n?/g, '');
            content = content.replace(/dayjs\.extend\(utc\);?\r?\n?/g, '');
        }

        fs.writeFileSync(path, content, 'utf8');
        console.log('Updated ' + path);
    }
}

const files = [
    'src/app/(site)/csr/website-orders/[id]/page.tsx',
    'src/app/(site)/orders/[id]/page.tsx',
    'src/app/(site)/verifications/[id]/page.tsx',
    'src/components/common/DeliveredProductDetails.tsx',
    'src/components/common/MediaCard.tsx',
    'src/components/common/RecoveryVisitDetails.tsx',
    'src/components/OfficerAttendanceHistory.tsx',
    'src/components/OfficerProfileHistory.tsx'
];

files.forEach(f => processFile(f));
