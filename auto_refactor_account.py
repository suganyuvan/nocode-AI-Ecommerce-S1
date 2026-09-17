import re
import subprocess

def run_tsc():
    result = subprocess.run(["npx", "tsc", "--noEmit"], capture_output=True, text=True)
    return result.stdout

def extract_missing_vars(tsc_output, file_path):
    missing_vars = set()
    for line in tsc_output.split('\n'):
        if file_path in line and "error TS2304: Cannot find name" in line:
            match = re.search(r"Cannot find name '([^']+)'.", line)
            if match:
                missing_vars.add(match.group(1))
    return list(missing_vars)

with open("src/views/MyAccountView.tsx", "r") as f:
    original_content = f.read()

start_marker = "  const [orders, setOrders] = useState<any[]>([]);"
end_marker = "  if (!customer) {"
start_idx = original_content.find(start_marker)
end_idx = original_content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Markers not found!")
    exit(1)

logic_block = original_content[start_idx:end_idx]

hook_imports = """import { useState, useEffect } from 'react';
import { Customer, Order, SupportTicket, TicketCategory, TicketPriority, SavedAddress, TicketMessage } from '../types';
import { supabase } from '../utils/supabaseClient';
import { getSavedAddressList, saveAddressToBook, deleteAddressFromBook, setDefaultAddressInBook } from '../utils/addressBookManager';
import { dispatchWebhookEvent } from '../utils/webhookDispatcher';
import { sendSupportTicketCreatedEmail } from '../utils/resendEmailEngine';

export interface UseAccountStateProps {
  customer: Customer | null;
  onLogout: () => void;
  setActiveTab: (tab: any) => void;
}

export const useAccountState = ({ customer, onLogout, setActiveTab }: UseAccountStateProps) => {
"""

hook_content = hook_imports + logic_block + "\n  return {};\n};\n"
with open("src/hooks/useAccountState.ts", "w") as f:
    f.write(hook_content)

new_view = original_content[:start_idx] + "  const state = useAccountState({ customer, onLogout, setActiveTab });\n" + original_content[end_idx:]
new_view = "import { useAccountState } from '../hooks/useAccountState';\n" + new_view

with open("src/views/MyAccountView.tsx", "w") as f:
    f.write(new_view)

print("Initial split done. Running tsc to find missing variables...")
output = run_tsc()
missing_vars = extract_missing_vars(output, "src/views/MyAccountView.tsx")
print(f"Found {len(missing_vars)} missing variables.")

if missing_vars:
    # Ensure state is returned
    missing_vars.append("activeSubTab")
    missing_vars = list(set(missing_vars)) # unique
    
    return_stmt = "  return {\n" + ",\n".join([f"    {v}" for v in missing_vars]) + "\n  };\n"
    hook_content = hook_content.replace("  return {};\n", return_stmt)
    with open("src/hooks/useAccountState.ts", "w") as f:
        f.write(hook_content)
    
    destructure = "  const {\n" + ",\n".join([f"    {v}" for v in missing_vars]) + "\n  } = state;\n"
    new_view = new_view.replace("  const state = useAccountState({ customer, onLogout, setActiveTab });\n", "  const state = useAccountState({ customer, onLogout, setActiveTab });\n" + destructure)
    with open("src/views/MyAccountView.tsx", "w") as f:
        f.write(new_view)
else:
    print("No missing vars found.")
    
print("Running tsc again to ensure it's clean")
print(run_tsc())

