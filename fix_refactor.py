import re
import subprocess

def run_tsc():
    result = subprocess.run(["npx", "tsc", "--noEmit"], capture_output=True, text=True)
    return result.stdout

with open("src/views/CheckoutView.tsx", "r") as f:
    checkout_content = f.read()
with open("src/hooks/useCheckoutState.ts", "r") as f:
    hook_content = f.read()

# Fix COUNTRY_OPTIONS in hook
hook_imports = "import { formatPrice } from '../utils/currency';\n"
hook_imports += "const COUNTRY_OPTIONS = [\n  { code: 'India', name: 'India', flag: '🇮🇳', dialCode: '+91' },\n  { code: 'United States', name: 'United States', flag: '🇺🇸', dialCode: '+1' },\n  { code: 'United Kingdom', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44' },\n  { code: 'United Arab Emirates', name: 'United Arab Emirates', flag: '🇦🇪', dialCode: '+971' },\n  { code: 'Singapore', name: 'Singapore', flag: '🇸🇬', dialCode: '+65' },\n  { code: 'Australia', name: 'Australia', flag: '🇦🇺', dialCode: '+61' },\n  { code: 'Canada', name: 'Canada', flag: '🇨🇦', dialCode: '+1' },\n  { code: 'Germany', name: 'Germany', flag: '🇩🇪', dialCode: '+49' },\n];\n"

if "formatPrice" not in hook_content.split("export const useCheckoutState")[0]:
    hook_content = hook_content.replace("import { useState, useEffect } from 'react';", "import { useState, useEffect } from 'react';\n" + hook_imports)

# Remove the missing variables that are NOT local state
hook_content = hook_content.replace("    formatPrice,\n", "")
hook_content = hook_content.replace("    COUNTRY_OPTIONS,\n", "")

checkout_content = checkout_content.replace("    formatPrice,\n", "")
checkout_content = checkout_content.replace("    COUNTRY_OPTIONS,\n", "")

# Fix missing state
if "    state," not in hook_content:
    hook_content = hook_content.replace("  return {", "  return {\n    state,")
if "    state," not in checkout_content:
    checkout_content = checkout_content.replace("  const {", "  const {\n    state,")

with open("src/views/CheckoutView.tsx", "w") as f:
    f.write(checkout_content)
with open("src/hooks/useCheckoutState.ts", "w") as f:
    f.write(hook_content)

print(run_tsc())
