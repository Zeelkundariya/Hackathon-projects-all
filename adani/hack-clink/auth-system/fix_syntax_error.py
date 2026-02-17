"""
Quick fix for syntax error in optimization_results.py
"""

import re

# Read the file
with open('ui/optimization_results.py', 'r') as f:
    content = f.read()

# Fix the syntax error on line 82
# Change f"{run_id[:8]} to f"{run_id[:8]}
fixed_content = content.replace('f"{run_id[:8]}', 'f"{run_id[:8]}')

# Write the fixed content back
with open('ui/optimization_results.py', 'w') as f:
    f.write(fixed_content)

print("✅ Syntax error fixed in optimization_results.py")
print("Changed: f\"{run_id[:8]} → f\"{run_id[:8]}")
