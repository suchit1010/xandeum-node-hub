// country centroids used for globe plotting
export const countryCentroids: Record<string, { lat: number; lon: number }> = {
  "France": { lat: 46.7, lon: 2.5 },
  "Grand Est, France": { lat: 48.5, lon: 6.5 },
  "United States": { lat: 39.8, lon: -98.6 },
  "Missouri, United States": { lat: 38.5, lon: -92.0 },
  "Canada": { lat: 56.1, lon: -106.3 },
  "United Kingdom": { lat: 55.4, lon: -3.4 },
  "England, United Kingdom": { lat: 52.5, lon: -1.5 },
  "Germany": { lat: 51.2, lon: 10.4 },
  "Bavaria, Germany": { lat: 48.7, lon: 11.6 },
  "Hesse, Germany": { lat: 50.6, lon: 9.0 },
  "Spain": { lat: 40.0, lon: -4.0 },
  "Italy": { lat: 41.9, lon: 12.6 },
  "Netherlands": { lat: 52.1, lon: 5.3 },
  "Sweden": { lat: 60.1, lon: 18.6 },
  "Norway": { lat: 60.5, lon: 8.0 },
  "Denmark": { lat: 56.0, lon: 10.0 },
  "Poland": { lat: 52.0, lon: 19.1 },
  "Belgium": { lat: 50.8, lon: 4.3 },
  "Switzerland": { lat: 46.8, lon: 8.2 },
  "Ireland": { lat: 53.1, lon: -8.3 },
  "Portugal": { lat: 39.4, lon: -8.2 },
  "Austria": { lat: 47.5, lon: 14.5 },
  "Czechia": { lat: 49.8, lon: 15.4 },
  "Hungary": { lat: 47.1, lon: 19.5 },
  "Romania": { lat: 45.9, lon: 24.8 },
  "Bulgaria": { lat: 42.7, lon: 25.5 },
  "Greece": { lat: 39.1, lon: 21.8 },
  "Turkey": { lat: 39.0, lon: 35.2 },
  "Russia": { lat: 61.5, lon: 105.3 },
  "India": { lat: 20.6, lon: 78.9 },
  "China": { lat: 35.9, lon: 104.2 },
  "Japan": { lat: 36.2, lon: 138.2 },
  "South Korea": { lat: 36.5, lon: 127.9 },
  "Indonesia": { lat: -0.8, lon: 113.9 },
  "Philippines": { lat: 12.9, lon: 121.8 },
  "Malaysia": { lat: 4.2, lon: 101.7 },
  "Singapore": { lat: 1.3, lon: 103.8 },
  "Vietnam": { lat: 14.0, lon: 108.3 },
  "Thailand": { lat: 15.9, lon: 100.0 },
  "Australia": { lat: -25.7, lon: 133.8 },
  "New Zealand": { lat: -40.9, lon: 174.9 },
  "Brazil": { lat: -14.2, lon: -51.9 },
  "Argentina": { lat: -34.0, lon: -64.0 },
  "Chile": { lat: -35.7, lon: -71.5 },
  "Mexico": { lat: 23.6, lon: -102.5 },
  "Colombia": { lat: 4.6, lon: -74.1 },
  "Peru": { lat: -9.2, lon: -75.0 },
  "Nigeria": { lat: 9.1, lon: 8.7 },
  "Rivers State, Nigeria": { lat: 4.8, lon: 6.9 },
  "South Africa": { lat: -30.6, lon: 22.9 },
  "Kenya": { lat: -0.2, lon: 37.9 },
  "Egypt": { lat: 26.8, lon: 30.8 },
  "UAE": { lat: 23.4, lon: 53.9 },
  "Saudi Arabia": { lat: 23.9, lon: 45.1 },
  "Unknown": { lat: 20.0, lon: 0.0 },
};

export const allCountryKeys = Object.keys(countryCentroids);

// Country to ISO code mapping
const countryToISO: Record<string, string> = {
  "France": "FR",
  "Grand Est, France": "FR",
  "United States": "US",
  "Washington, United States": "US",
  "Virginia, United States": "US",
  "Missouri, United States": "US",
  "Canada": "CA",
  "United Kingdom": "GB",
  "England, United Kingdom": "GB",
  "Germany": "DE",
  "Bavaria, Germany": "DE",
  "Hesse, Germany": "DE",
  "Spain": "ES",
  "Italy": "IT",
  "Netherlands": "NL",
  "Sweden": "SE",
  "Norway": "NO",
  "Denmark": "DK",
  "Poland": "PL",
  "Belgium": "BE",
  "Switzerland": "CH",
  "Ireland": "IE",
  "Portugal": "PT",
  "Austria": "AT",
  "Czechia": "CZ",
  "Hungary": "HU",
  "Romania": "RO",
  "Bulgaria": "BG",
  "Greece": "GR",
  "Turkey": "TR",
  "Russia": "RU",
  "India": "IN",
  "China": "CN",
  "Japan": "JP",
  "South Korea": "KR",
  "Indonesia": "ID",
  "Philippines": "PH",
  "Malaysia": "MY",
  "Singapore": "SG",
  "Vietnam": "VN",
  "Thailand": "TH",
  "Australia": "AU",
  "New Zealand": "NZ",
  "Waikato Region, New Zealand": "NZ",
  "Brazil": "BR",
  "Argentina": "AR",
  "Chile": "CL",
  "Mexico": "MX",
  "Colombia": "CO",
  "Peru": "PE",
  "Nigeria": "NG",
  "Rivers State, Nigeria": "NG",
  "South Africa": "ZA",
  "Kenya": "KE",
  "Egypt": "EG",
  "UAE": "AE",
  "Saudi Arabia": "SA",
};

// Function to get flag emoji from country code or region
export function getCountryFlag(region?: string): string {
  if (!region) return "🌍";
  
  // First try exact match
  let isoCode = countryToISO[region];
  
  // If no exact match, try to extract country from region (last part after comma)
  if (!isoCode) {
    const parts = region.split(',').map(p => p.trim());
    const country = parts[parts.length - 1]; // Last part is usually the country
    isoCode = countryToISO[country];
    
    // Debug: log if we're getting a fallback
    if (!isoCode && region !== "Unknown") {
      console.warn(`[geo.ts] Could not find ISO code for region: "${region}", tried country: "${country}"`);
    }
  }
  
  // Fallback to globe emoji if not found
  if (!isoCode) return "🌍";
  
  // Convert ISO code to flag emoji using regional indicator symbols
  const codePoints = isoCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  
  return String.fromCodePoint(...codePoints);
}
