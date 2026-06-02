const fs = require('fs');

function addImport(f, impStr) {
    if (!fs.existsSync(f)) return;
    let content = fs.readFileSync(f, 'utf8');
    if (!content.includes(impStr)) {
        const lines = content.split('\n');
        let lastImportIndex = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().startsWith('import ')) {
                lastImportIndex = i;
            }
        }
        if (lastImportIndex !== -1) {
            lines.splice(lastImportIndex + 1, 0, impStr);
        } else {
            lines.unshift(impStr);
        }
        fs.writeFileSync(f, lines.join('\n'), 'utf8');
    }
}

addImport('src/app/(site)/notifications/page.tsx', 'import { timeAgo } from "@/utils/dateUtils";');
addImport('src/components/Layouts/header/notification/index.tsx', 'import { timeAgo } from "@/utils/dateUtils";');

let ledgerPath = 'src/components/Installments/InstallmentLedgerEditor.tsx';
if (fs.existsSync(ledgerPath)) {
    let content = fs.readFileSync(ledgerPath, 'utf8');
    if (!content.includes('addMonths')) {
        content = 'import { todayDate, addMonths, addDays, formatStandardDate } from "@/utils/dateUtils";\n' + content;
        fs.writeFileSync(ledgerPath, content, 'utf8');
    }
}

let attPath = 'src/components/OfficerAttendanceHistory.tsx';
if (fs.existsSync(attPath)) {
    let content = fs.readFileSync(attPath, 'utf8');
    if (!content.includes('isExactToday')) {
        content = content.replace('import { formatExactDate } from "@/utils/dateUtils";', 'import { formatExactDate, isExactToday } from "@/utils/dateUtils";');
    }
    // Replace {end ? ... } with {sess.end_time ? ... }
    content = content.replace(/\{end \? /g, '{sess.end_time ? ');
    fs.writeFileSync(attPath, content, 'utf8');
}
