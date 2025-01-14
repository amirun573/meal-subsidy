export function ConvertToFiveDigits(cardValue: string) {
    const twelveDigitValue = parseInt(cardValue, 10);
    const fiveDigitValue = twelveDigitValue % 100000;
    return String(fiveDigitValue).padStart(5, '0'); // Ensure 5 digits with leading zeros
}
