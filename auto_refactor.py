import re
import os
import subprocess

def run_tsc():
    result = subprocess.run(["npx", "tsc", "--noEmit"], capture_output=True, text=True)
    return result.stdout

def extract_missing_vars(tsc_output):
    # Looking for: error TS2304: Cannot find name 'isProcessing'.
    missing_vars = set()
    for line in tsc_output.split('\n'):
        if "error TS2304: Cannot find name" in line:
            match = re.search(r"Cannot find name '([^']+)'.", line)
            if match:
                missing_vars.add(match.group(1))
    return missing_vars

with open("src/views/CheckoutView.tsx", "r") as f:
    original_content = f.read()

start_marker = "  const [isProcessing, setIsProcessing] = useState(false);"
end_marker = "  const handleInvoiceClose = () => {"
start_idx = original_content.find(start_marker)
end_idx = original_content.find(end_marker)

logic_block = original_content[start_idx:end_idx]

# Imports needed for the hook
hook_imports = """import { useState, useEffect } from 'react';
import { CartItem, Currency, Customer, Coupon, SavedAddress, ActiveTab } from '../types';
import { supabase } from '../utils/supabaseClient';
import { loadRazorpayScript, createRazorpayOrder, verifyRazorpayPayment } from '../utils/razorpay';
import { PINCODE_CITY_STATE_MAP, DEFAULT_SHIPPING_PAYMENT_SETTINGS, ALL_INDIAN_STATES } from '../admin/views/ShippingManager';
import { validateIndianPincode, validateCityWithState, validateStreetAddress, fetchLivePincodeData } from '../utils/pincodeValidator';
import { validateCoupon, recordCouponUsage } from '../utils/couponEngine';
import { getSavedAddressList, saveAddressToBook } from '../utils/addressBookManager';
import { dispatchWebhookEvent } from '../utils/webhookDispatcher';
import { sendOrderConfirmationEmail } from '../utils/resendEmailEngine';
import { trackCheckoutStart } from '../utils/pageViewAnalyticsEngine';

export interface UseCheckoutStateProps {
  cartItems: CartItem[];
  currency: Currency;
  onClearCart: () => void;
  setActiveTab: (tab: ActiveTab) => void;
  customer?: Customer | null;
}

export const useCheckoutState = ({ cartItems, currency, onClearCart, setActiveTab, customer }: UseCheckoutStateProps) => {
"""

hook_content = hook_imports + logic_block + "\n  return {};\n};\n"
with open("src/hooks/useCheckoutState.ts", "w") as f:
    f.write(hook_content)

# Update CheckoutView.tsx
new_checkout = original_content[:start_idx] + "  const state = useCheckoutState({ cartItems, currency, onClearCart, setActiveTab, customer });\n" + original_content[end_idx:]
new_checkout = "import { useCheckoutState } from '../hooks/useCheckoutState';\n" + new_checkout

with open("src/views/CheckoutView.tsx", "w") as f:
    f.write(new_checkout)

print("Initial split done. Running tsc to find missing variables...")
output = run_tsc()
missing_vars = extract_missing_vars(output)
print(f"Found {len(missing_vars)} missing variables.")

if missing_vars:
    # Add to return statement
    return_stmt = "  return {\n" + ",\n".join([f"    {v}" for v in missing_vars]) + "\n  };\n"
    hook_content = hook_content.replace("  return {};\n", return_stmt)
    with open("src/hooks/useCheckoutState.ts", "w") as f:
        f.write(hook_content)
    
    # Destructure in CheckoutView
    destructure = "  const {\n" + ",\n".join([f"    {v}" for v in missing_vars]) + "\n  } = useCheckoutState({ cartItems, currency, onClearCart, setActiveTab, customer });\n"
    new_checkout = new_checkout.replace("  const state = useCheckoutState({ cartItems, currency, onClearCart, setActiveTab, customer });\n", destructure)
    with open("src/views/CheckoutView.tsx", "w") as f:
        f.write(new_checkout)

print("Done phase 1!")
