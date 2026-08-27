import { PINCODE_CITY_STATE_MAP } from '../admin/views/ShippingManager';

// Mapping 2-digit PIN prefixes to their primary and secondary Indian States
export const PIN_PREFIX_STATE_MAP: Record<string, string[]> = {
  '11': ['Delhi'],
  '12': ['Haryana'],
  '13': ['Haryana', 'Chandigarh'],
  '14': ['Punjab'],
  '15': ['Punjab'],
  '16': ['Chandigarh', 'Punjab', 'Haryana'],
  '17': ['Himachal Pradesh'],
  '18': ['Jammu and Kashmir', 'Ladakh'],
  '19': ['Jammu and Kashmir', 'Ladakh'],
  '20': ['Uttar Pradesh'],
  '21': ['Uttar Pradesh'],
  '22': ['Uttar Pradesh'],
  '23': ['Uttar Pradesh'],
  '24': ['Uttar Pradesh', 'Uttarakhand'],
  '25': ['Uttar Pradesh'],
  '26': ['Uttar Pradesh', 'Uttarakhand'],
  '27': ['Uttar Pradesh'],
  '28': ['Uttar Pradesh'],
  '30': ['Rajasthan'],
  '31': ['Rajasthan'],
  '32': ['Rajasthan'],
  '33': ['Rajasthan'],
  '34': ['Rajasthan'],
  '36': ['Gujarat'],
  '37': ['Gujarat'],
  '38': ['Gujarat'],
  '39': ['Gujarat', 'Dadra and Nagar Haveli and Daman and Diu'],
  '40': ['Maharashtra', 'Goa'],
  '41': ['Maharashtra'],
  '42': ['Maharashtra'],
  '43': ['Maharashtra'],
  '44': ['Maharashtra'],
  '45': ['Madhya Pradesh'],
  '46': ['Madhya Pradesh'],
  '47': ['Madhya Pradesh'],
  '48': ['Madhya Pradesh'],
  '49': ['Chhattisgarh', 'Madhya Pradesh'],
  '50': ['Telangana', 'Andhra Pradesh'],
  '51': ['Andhra Pradesh'],
  '52': ['Andhra Pradesh'],
  '53': ['Andhra Pradesh'],
  '56': ['Karnataka'],
  '57': ['Karnataka'],
  '58': ['Karnataka'],
  '59': ['Karnataka'],
  '60': ['Tamil Nadu', 'Puducherry'],
  '61': ['Tamil Nadu'],
  '62': ['Tamil Nadu'],
  '63': ['Tamil Nadu', 'Puducherry'],
  '64': ['Tamil Nadu'],
  '67': ['Kerala', 'Lakshadweep'],
  '68': ['Kerala', 'Lakshadweep'],
  '69': ['Kerala'],
  '70': ['West Bengal'],
  '71': ['West Bengal'],
  '72': ['West Bengal'],
  '73': ['West Bengal', 'Sikkim'],
  '74': ['West Bengal', 'Andaman and Nicobar Islands'],
  '75': ['Odisha'],
  '76': ['Odisha'],
  '77': ['Odisha'],
  '78': ['Assam'],
  '79': ['Arunachal Pradesh', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Tripura'],
  '80': ['Bihar'],
  '81': ['Bihar', 'Jharkhand'],
  '82': ['Jharkhand', 'Bihar'],
  '83': ['Jharkhand'],
  '84': ['Bihar'],
  '85': ['Bihar'],
};

// Major Indian Cities and their official States
export const KNOWN_CITY_STATE_MAP: Record<string, string> = {
  'chennai': 'Tamil Nadu',
  'madras': 'Tamil Nadu',
  'coimbatore': 'Tamil Nadu',
  'madurai': 'Tamil Nadu',
  'tiruchirappalli': 'Tamil Nadu',
  'trichy': 'Tamil Nadu',
  'salem': 'Tamil Nadu',
  'tirunelveli': 'Tamil Nadu',
  'vellore': 'Tamil Nadu',
  'thanjavur': 'Tamil Nadu',
  'bengaluru': 'Karnataka',
  'bangalore': 'Karnataka',
  'mysuru': 'Karnataka',
  'mysore': 'Karnataka',
  'mangaluru': 'Karnataka',
  'mangalore': 'Karnataka',
  'hubballi': 'Karnataka',
  'hubli': 'Karnataka',
  'belagavi': 'Karnataka',
  'mumbai': 'Maharashtra',
  'bombay': 'Maharashtra',
  'pune': 'Maharashtra',
  'nagpur': 'Maharashtra',
  'nashik': 'Maharashtra',
  'thane': 'Maharashtra',
  'aurangabad': 'Maharashtra',
  'navi mumbai': 'Maharashtra',
  'hyderabad': 'Telangana',
  'secunderabad': 'Telangana',
  'warangal': 'Telangana',
  'visakhapatnam': 'Andhra Pradesh',
  'vizag': 'Andhra Pradesh',
  'vijayawada': 'Andhra Pradesh',
  'guntur': 'Andhra Pradesh',
  'tirupati': 'Andhra Pradesh',
  'delhi': 'Delhi',
  'new delhi': 'Delhi',
  'kolkata': 'West Bengal',
  'calcutta': 'West Bengal',
  'howrah': 'West Bengal',
  'darjeeling': 'West Bengal',
  'siliguri': 'West Bengal',
  'jaipur': 'Rajasthan',
  'jodhpur': 'Rajasthan',
  'udaipur': 'Rajasthan',
  'kota': 'Rajasthan',
  'ahmedabad': 'Gujarat',
  'surat': 'Gujarat',
  'vadodara': 'Gujarat',
  'baroda': 'Gujarat',
  'rajkot': 'Gujarat',
  'lucknow': 'Uttar Pradesh',
  'kanpur': 'Uttar Pradesh',
  'varanasi': 'Uttar Pradesh',
  'banaras': 'Uttar Pradesh',
  'agra': 'Uttar Pradesh',
  'noida': 'Uttar Pradesh',
  'greater noida': 'Uttar Pradesh',
  'ghaziabad': 'Uttar Pradesh',
  'prayagraj': 'Uttar Pradesh',
  'allahabad': 'Uttar Pradesh',
  'chandigarh': 'Chandigarh',
  'kochi': 'Kerala',
  'cochin': 'Kerala',
  'thiruvananthapuram': 'Kerala',
  'trivandrum': 'Kerala',
  'kozhikode': 'Kerala',
  'calicut': 'Kerala',
  'thrissur': 'Kerala',
  'bhopal': 'Madhya Pradesh',
  'indore': 'Madhya Pradesh',
  'gwalior': 'Madhya Pradesh',
  'jabalpur': 'Madhya Pradesh',
  'patna': 'Bihar',
  'gaya': 'Bihar',
  'ranchi': 'Jharkhand',
  'jamshedpur': 'Jharkhand',
  'bhubaneswar': 'Odisha',
  'cuttack': 'Odisha',
  'puri': 'Odisha',
  'guwahati': 'Assam',
  'shillong': 'Meghalaya',
  'dehradun': 'Uttarakhand',
  'haridwar': 'Uttarakhand',
  'shimla': 'Himachal Pradesh',
  'srinagar': 'Jammu and Kashmir',
  'jammu': 'Jammu and Kashmir',
  'panaji': 'Goa',
  'vasco da gama': 'Goa',
  'puducherry': 'Puducherry',
  'pondicherry': 'Puducherry',
  'port blair': 'Andaman and Nicobar Islands'
};

export interface CityValidationResult {
  isValid: boolean;
  expectedState?: string;
  message?: string;
}

export function validateCityWithState(cityName: string, selectedState: string): CityValidationResult {
  const cleanCity = (cityName || '').trim().toLowerCase();
  const cleanState = (selectedState || '').trim().toLowerCase();

  if (!cleanCity || !cleanState) return { isValid: true };

  const expectedState = KNOWN_CITY_STATE_MAP[cleanCity];
  if (expectedState) {
    if (expectedState.toLowerCase() !== cleanState) {
      return {
        isValid: false,
        expectedState,
        message: `City "${cityName}" is located in ${expectedState}, but "${selectedState}" is selected.`
      };
    }
  }

  return { isValid: true };
}

export interface AddressValidationResult {
  isValid: boolean;
  message?: string;
}

export function validateStreetAddress(address: string): AddressValidationResult {
  const clean = (address || '').trim();
  if (!clean) {
    return { isValid: false, message: 'Street Address is required.' };
  }

  if (clean.length < 8) {
    return { isValid: false, message: 'Please provide a complete street address (minimum 8 characters).' };
  }

  // Check for repeated single character gibberish like 'aaaaaaa' or '1111111'
  const isRepetitive = /^(\w)\1{5,}$/i.test(clean.replace(/\s/g, ''));
  if (isRepetitive) {
    return { isValid: false, message: 'Please enter a genuine, deliverable address with house/flat # and street.' };
  }

  // Check that it contains at least two distinct words
  const words = clean.split(/\s+/).filter(w => w.length > 1);
  if (words.length < 2) {
    return { isValid: false, message: 'Please include house/flat number, street or colony name, and landmark.' };
  }

  return { isValid: true };
}

export interface PincodeValidationResult {
  isValidLength: boolean;
  isValidFormat: boolean;
  detectedState: string | null;
  detectedCity: string | null;
  possibleStates: string[];
  isStateMatched: boolean;
  message: string;
  status: 'valid' | 'mismatch' | 'invalid' | 'incomplete';
}

export function validateIndianPincode(pincode: string, selectedState: string): PincodeValidationResult {
  const cleanPin = (pincode || '').trim();

  if (!cleanPin) {
    return {
      isValidLength: false,
      isValidFormat: false,
      detectedState: null,
      detectedCity: null,
      possibleStates: [],
      isStateMatched: false,
      message: '',
      status: 'incomplete'
    };
  }

  // Check if contains non-digits
  if (!/^\d+$/.test(cleanPin)) {
    return {
      isValidLength: false,
      isValidFormat: false,
      detectedState: null,
      detectedCity: null,
      possibleStates: [],
      isStateMatched: false,
      message: 'PIN code must only contain numbers.',
      status: 'invalid'
    };
  }

  if (cleanPin.length < 6) {
    return {
      isValidLength: false,
      isValidFormat: true,
      detectedState: null,
      detectedCity: null,
      possibleStates: [],
      isStateMatched: false,
      message: `${6 - cleanPin.length} more digit${6 - cleanPin.length > 1 ? 's' : ''} needed`,
      status: 'incomplete'
    };
  }

  if (cleanPin.length > 6) {
    return {
      isValidLength: false,
      isValidFormat: false,
      detectedState: null,
      detectedCity: null,
      possibleStates: [],
      isStateMatched: false,
      message: 'Indian PIN code must be exactly 6 digits.',
      status: 'invalid'
    };
  }

  // 6 digits entered
  const prefix2 = cleanPin.slice(0, 2);
  const prefix3 = cleanPin.slice(0, 3);

  const cityStateData = PINCODE_CITY_STATE_MAP[prefix3];
  const possibleStates = PIN_PREFIX_STATE_MAP[prefix2] || (cityStateData ? [cityStateData.state] : []);

  const detectedState = cityStateData?.state || (possibleStates.length > 0 ? possibleStates[0] : null);
  const detectedCity = cityStateData?.city || null;

  if (!possibleStates || possibleStates.length === 0) {
    return {
      isValidLength: true,
      isValidFormat: true,
      detectedState: null,
      detectedCity: null,
      possibleStates: [],
      isStateMatched: false,
      message: 'Unrecognized PIN code prefix.',
      status: 'invalid'
    };
  }

  // Normalize selected state for comparison
  const normSelectedState = (selectedState || '').trim().toLowerCase();
  const isMatch = possibleStates.some(s => s.toLowerCase() === normSelectedState);

  if (!normSelectedState) {
    return {
      isValidLength: true,
      isValidFormat: true,
      detectedState,
      detectedCity,
      possibleStates,
      isStateMatched: true,
      message: `Detected: ${detectedCity ? detectedCity + ', ' : ''}${detectedState}`,
      status: 'valid'
    };
  }

  if (isMatch) {
    return {
      isValidLength: true,
      isValidFormat: true,
      detectedState,
      detectedCity,
      possibleStates,
      isStateMatched: true,
      message: `Verified PIN for ${selectedState}${detectedCity ? ` (${detectedCity} Hub)` : ''}`,
      status: 'valid'
    };
  } else {
    return {
      isValidLength: true,
      isValidFormat: true,
      detectedState,
      detectedCity,
      possibleStates,
      isStateMatched: false,
      message: `PIN ${cleanPin} belongs to ${possibleStates.join(' / ')}, but "${selectedState}" is selected.`,
      status: 'mismatch'
    };
  }
}

// Fetch live Post Office & Locality info from Indian Postal API
export async function fetchLivePincodeData(pincode: string): Promise<{
  status: 'Success' | 'Error';
  postOffices: Array<{ name: string; district: string; state: string; block: string }>;
  district: string | null;
  state: string | null;
}> {
  try {
    const cleanPin = (pincode || '').trim();
    if (cleanPin.length !== 6 || !/^\d{6}$/.test(cleanPin)) {
      return { status: 'Error', postOffices: [], district: null, state: null };
    }

    const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`);
    if (!res.ok) throw new Error('Failed to reach Postal API');
    
    const data = await res.json();
    if (Array.isArray(data) && data[0]?.Status === 'Success' && Array.isArray(data[0]?.PostOffice)) {
      const pos = data[0].PostOffice.map((po: any) => ({
        name: po.Name,
        district: po.District,
        state: po.State,
        block: po.Block
      }));

      return {
        status: 'Success',
        postOffices: pos,
        district: pos[0]?.district || null,
        state: pos[0]?.state || null
      };
    }
  } catch (err) {
    console.warn('Pincode live lookup notice:', err);
  }

  return { status: 'Error', postOffices: [], district: null, state: null };
}
