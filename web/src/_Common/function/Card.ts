export function ConvertToFiveDigits(cardValue: string) {
  const twelveDigitValue = parseInt(cardValue, 10);
  const fiveDigitValue = twelveDigitValue % 100000;
  return String(fiveDigitValue).padStart(5, "0"); // Ensure 5 digits with leading zeros
}

export function ExtractCardNumber(hexValue: string): string {
    try {
      // Step 1: Convert the hex value to BigInt
      const numericValue = BigInt(`0x${hexValue}`);
  
      // Step 2: Extract the relevant 16 bits for the card number
      // Assuming 26-bit Wiegand format: Parity + 8 bits (Facility) + 16 bits (Card Number)
      // Mask and shift to get the 16-bit card number
      const cardNumber = Number((numericValue >> 1n) & 0xFFFFn); // Extract the 16 bits
  
      // Step 3: Return as a 5-digit string
      return cardNumber.toString().padStart(5, "0");
    } catch (error) {
      console.error(`Error extracting card number: ${(error as Error).message}`);
      return "";
    }
  }
  
  
  
