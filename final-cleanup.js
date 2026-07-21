const fs = require('fs');
const path = require('path');

function getFiles(dir, filesList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getFiles(fullPath, filesList);
        } else {
            if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
                filesList.push(fullPath);
            }
        }
    }
    return filesList;
}
   

const allFiles = getFiles(path.join(__dirname, 'src'));

allFiles.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    let modified = false;

    // 1. InstallmentLedgerEditor.tsx
    if (f.includes('InstallmentLedgerEditor')) {
        if (content.includes('const today = dayjs();')) {
            content = content.replace(/const today = dayjs\(\);/g, 'const today = todayDate();');
            modified = true;
        }
        if (content.includes('const newStartDate = dayjs(value as string);')) {
            content = content.replace(/const newStartDate = dayjs\(value as string\);/g, "const newStartDate = new Date(value as string);");
            modified = true;
        }
        if (content.includes(".add(i + 1, 'month').format('YYYY-MM-DD')")) {
            content = content.replace(/today\.add\(([^,]+),\s*'month'\)\.format\('YYYY-MM-DD'\)/g, "formatStandardDate(addMonths(today, $1), 'YYYY-MM-DD')");
            modified = true;
        }
        if (content.includes(".add(i, 'month').format('YYYY-MM-DD')")) {
            content = content.replace(/newStartDate\.add\(([^,]+),\s*'month'\)\.format\('YYYY-MM-DD'\)/g, "formatStandardDate(addMonths(newStartDate, $1), 'YYYY-MM-DD')");
            modified = true;
        }
        if (content.includes("today.format('YYYY-MM-DD')")) {
            content = content.replace(/today\.format\('YYYY-MM-DD'\)/g, "formatStandardDate(today, 'YYYY-MM-DD')");
            modified = true;
        }
        if (content.includes("today.add(40, 'day').format('YYYY-MM-DD')")) {
            content = content.replace(/today\.add\(40,\s*'day'\)\.format\('YYYY-MM-DD'\)/g, "formatStandardDate(addDays(today, 40), 'YYYY-MM-DD')");
            modified = true;
        }
        if (modified && !content.includes('todayDate')) {
            content = 'import { todayDate, addMonths, addDays, formatStandardDate } from "@/utils/dateUtils";\n' + content;
        }
    }

    // 2. OfficerAttendanceHistory.tsx
    if (f.includes('OfficerAttendanceHistory')) {
        if (content.includes("const date = dayjs(stat.date);") && content.includes("date.isSame(dayjs(), 'day')")) {
            content = content.replace(/const date = dayjs\(stat\.date\);\s*const isToday = date\.isSame\(dayjs\(\),\s*'day'\);/g, "const isToday = isExactToday(stat.date);");
            modified = true;
        }
        if (content.includes("const start = dayjs(sess.start_time);")) {
            content = content.replace(/const start = dayjs\(sess\.start_time\);\s*const end = sess\.end_time \? dayjs\(sess\.end_time\) : null;/g, "");
            modified = true;
        }
        if (modified && !content.includes('isExactToday')) {
            content = content.replace('import { formatExactDate } from "@/utils/dateUtils";', 'import { formatExactDate, isExactToday } from "@/utils/dateUtils";');
        }
    }

    // 3. Header notifications and pages notifications
    if (content.includes('.fromNow()')) {
        content = content.replace(/dayjs\(([^)]+)\)\.fromNow\(\)/g, "timeAgo($1)");
        if (!content.includes('timeAgo')) {
            content = 'import { timeAgo } from "@/utils/dateUtils";\n' + content;
        }
        modified = true;
    }

    // 4. Remove all dayjs imports
    if (content.includes('dayjs')) {
        content = content.replace(/import\s+dayjs\s+from\s+['"]dayjs['"];?\r?\n?/g, '');
        content = content.replace(/import\s+utc\s+from\s+['"]dayjs\/plugin\/utc['"];?\r?\n?/g, '');
        content = content.replace(/import\s+relativeTime\s+from\s+['"]dayjs\/plugin\/relativeTime['"];?\r?\n?/g, '');
        content = content.replace(/dayjs\.extend\(utc\);?\r?\n?/g, '');
        content = content.replace(/dayjs\.extend\(relativeTime\);?\r?\n?/g, '');
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(f, content, 'utf8');
        console.log('Cleaned ' + f);
    }
});
