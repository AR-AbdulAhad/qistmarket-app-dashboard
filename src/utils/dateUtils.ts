export const formatExactDate = (dateInput: string | Date | null | undefined, formatStr: string = 'MMM DD, YYYY hh:mm A') => {
    if (!dateInput) return 'N/A';
    
    if (typeof dateInput === 'string' && dateInput.trim() === '') return 'N/A';

    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return typeof dateInput === 'string' ? dateInput : 'N/A';

    const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const daysFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const monthShortStr = monthsShort[date.getUTCMonth()];
    const monthFullStr = monthsFull[date.getUTCMonth()];
    const monthNum = String(date.getUTCMonth() + 1).padStart(2, '0');
    
    const dayOfWeekFull = daysFull[date.getUTCDay()];
    const dayOfWeekShort = daysShort[date.getUTCDay()];
    
    const d = date.getUTCDate();
    const day = String(d).padStart(2, '0');
    const dayUnpadded = String(d);
    
    const year = date.getUTCFullYear();
    
    let hours = date.getUTCHours();
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const ampmLower = hours >= 12 ? 'pm' : 'am';
    
    let displayHours = hours % 12;
    displayHours = displayHours ? displayHours : 12; // the hour '0' should be '12'
    const strHours12 = String(displayHours).padStart(2, '0');
    const strHours12Unpadded = String(displayHours);
    const strHours24 = String(hours).padStart(2, '0');

    let formatted = formatStr;
    formatted = formatted.replace('YYYY', String(year));
    formatted = formatted.replace('dddd', dayOfWeekFull);
    formatted = formatted.replace('ddd', dayOfWeekShort);
    
    formatted = formatted.replace('MMMM', monthFullStr);
    formatted = formatted.replace('MMM', monthShortStr);
    formatted = formatted.replace('MM', monthNum);
    
    // Replace DD first, then D
    formatted = formatted.replace('DD', day);
    formatted = formatted.replace('D', dayUnpadded);
    
    // Replace hh first, then h
    formatted = formatted.replace('hh', strHours12);
    formatted = formatted.replace('h', strHours12Unpadded);
    formatted = formatted.replace('HH', strHours24);
    
    formatted = formatted.replace('mm', minutes);
    formatted = formatted.replace('ss', seconds);
    formatted = formatted.replace('A', ampm);
    formatted = formatted.replace('a', ampmLower);
    
    return formatted;
}
