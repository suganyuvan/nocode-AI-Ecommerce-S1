import { SavedAddress, Customer } from '../types';
import { supabase } from './supabaseClient';

export function getCustomerStorageKey(customer?: Customer | null): string {
  let custKey = 'guest';
  if (customer && (customer.email || customer.id)) {
    custKey = (customer.email || customer.id).toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
  } else {
    try {
      const stored = localStorage.getItem('irisjev_customer_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.email || parsed.id) {
          custKey = (parsed.email || parsed.id).toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
        }
      }
    } catch (e) {}
  }
  return `irisjev_saved_addresses_list_${custKey}`;
}

export function getSavedAddressList(customer?: Customer | null): SavedAddress[] {
  const storageKey = getCustomerStorageKey(customer);

  // 1. If customer object has saved_addresses from Supabase, return and cache them
  if (customer && Array.isArray(customer.saved_addresses) && customer.saved_addresses.length > 0) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(customer.saved_addresses));
    } catch (e) {}
    return customer.saved_addresses;
  }

  // 2. Check customer-specific localStorage
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load saved address list:', e);
  }

  // 3. If no address list exists yet for this customer, construct default only if this customer has address info
  const initialList: SavedAddress[] = [];
  if (customer && (customer.address || customer.city)) {
    initialList.push({
      id: `addr-${Date.now()}`,
      label: 'Primary Residence (Home)',
      fullName: customer.full_name || 'Valued Collector',
      email: customer.email || '',
      phone: customer.phone ? customer.phone.replace(/\D/g, '') : '',
      address: customer.address || '',
      city: customer.city || 'Chennai',
      state: customer.state || 'Tamil Nadu',
      postalCode: customer.postal_code || '',
      country: 'India',
      isDefault: true,
    });
    try {
      localStorage.setItem(storageKey, JSON.stringify(initialList));
    } catch (e) {}
  }

  return initialList;
}

export function saveAddressToBook(addr: Omit<SavedAddress, 'id'> & { id?: string }, customer?: Customer | null): SavedAddress[] {
  const storageKey = getCustomerStorageKey(customer);
  const currentList = getSavedAddressList(customer);
  const addressId = addr.id || `addr-${Date.now()}`;
  
  let updatedList: SavedAddress[];
  const isDefault = addr.isDefault ?? (currentList.length === 0);

  const existingIdx = currentList.findIndex(a => a.id === addressId);

  const newEntry: SavedAddress = {
    ...addr,
    id: addressId,
    isDefault,
  };

  if (existingIdx >= 0) {
    updatedList = currentList.map(item => {
      if (item.id === addressId) {
        return newEntry;
      }
      return isDefault ? { ...item, isDefault: false } : item;
    });
  } else {
    updatedList = [
      ...currentList.map(item => (isDefault ? { ...item, isDefault: false } : item)),
      newEntry,
    ];
  }

  try {
    localStorage.setItem(storageKey, JSON.stringify(updatedList));
  } catch (e) {}
  
  // Also sync default address to active checkout delivery info
  if (isDefault) {
    const deliveryPayload = {
      customerName: newEntry.fullName,
      customerEmail: newEntry.email || '',
      countryCode: '+91',
      customerPhone: newEntry.phone,
      address: newEntry.address,
      city: newEntry.city,
      state: newEntry.state,
      postalCode: newEntry.postalCode,
      country: newEntry.country,
    };
    const custKey = (newEntry.email || customer?.email || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
    sessionStorage.setItem(`irisjev_saved_delivery_info_${custKey}`, JSON.stringify(deliveryPayload));
    localStorage.setItem(`irisjev_saved_delivery_info_${custKey}`, JSON.stringify(deliveryPayload));
  }

  syncAddressBookToSupabase(newEntry.email || customer?.email, customer?.id);
  return updatedList;
}

export function deleteAddressFromBook(id: string, customer?: Customer | null): SavedAddress[] {
  const storageKey = getCustomerStorageKey(customer);
  const currentList = getSavedAddressList(customer);
  const filtered = currentList.filter(a => a.id !== id);
  
  // Ensure at least one default remains if list is not empty
  if (filtered.length > 0 && !filtered.some(a => a.isDefault)) {
    filtered[0].isDefault = true;
  }

  try {
    localStorage.setItem(storageKey, JSON.stringify(filtered));
  } catch (e) {}

  syncAddressBookToSupabase(customer?.email, customer?.id);
  return filtered;
}

export function setDefaultAddressInBook(id: string, customer?: Customer | null): SavedAddress[] {
  const storageKey = getCustomerStorageKey(customer);
  const currentList = getSavedAddressList(customer);
  const updated = currentList.map(a => ({
    ...a,
    isDefault: a.id === id,
  }));

  try {
    localStorage.setItem(storageKey, JSON.stringify(updated));
  } catch (e) {}

  const def = updated.find(a => a.isDefault);
  if (def) {
    const deliveryPayload = {
      customerName: def.fullName,
      customerEmail: def.email || '',
      countryCode: '+91',
      customerPhone: def.phone,
      address: def.address,
      city: def.city,
      state: def.state,
      postalCode: def.postalCode,
      country: def.country,
    };
    const custKey = (def.email || customer?.email || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
    sessionStorage.setItem(`irisjev_saved_delivery_info_${custKey}`, JSON.stringify(deliveryPayload));
    localStorage.setItem(`irisjev_saved_delivery_info_${custKey}`, JSON.stringify(deliveryPayload));
  }

  syncAddressBookToSupabase(def?.email || customer?.email, customer?.id);
  return updated;
}

export async function syncAddressBookToSupabase(customerEmail?: string, customerId?: string) {
  try {
    let resolvedEmail = customerEmail;
    let resolvedId = customerId;
    if (!resolvedEmail && !resolvedId) {
      const stored = localStorage.getItem('irisjev_customer_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        resolvedEmail = parsed.email;
        resolvedId = parsed.id;
      }
    }

    const storageKey = getCustomerStorageKey({ email: resolvedEmail, id: resolvedId } as any);
    const raw = localStorage.getItem(storageKey);
    const currentList = raw ? JSON.parse(raw) : [];

    if (resolvedId && !resolvedId.startsWith('guest-') && !resolvedId.startsWith('cust-')) {
      await supabase.from('customers').update({ saved_addresses: currentList }).eq('id', resolvedId);
    } else if (resolvedEmail) {
      await supabase.from('customers').update({ saved_addresses: currentList }).eq('email', resolvedEmail.toLowerCase().trim());
    }
  } catch (e) {
    console.warn('Failed to sync address book to Supabase:', e);
  }
}
