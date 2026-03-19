import os
import subprocess

with open("frontend/.env.production") as f:
    for line in f:
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        if "=" not in line:
            continue
            
        k, v = line.split("=", 1)
        k = k.strip()
        v = v.strip()
        
        print(f"Fixing {k} in Vercel production environment...")
        
        # Remove existing if any (ignore errors)
        subprocess.run(f"npx --yes vercel env rm {k} production -y", shell=True, cwd="frontend", capture_output=True)
        
        # Add the new value using printf to avoid trailing newlines
        result = subprocess.run(f"printf '%s' '{v}' | npx --yes vercel env add {k} production", shell=True, cwd="frontend", capture_output=True, text=True)
        if result.returncode != 0:
            print(f"Warning mapping {k}: {result.stderr}")
        else:
            print(f"Successfully fixed {k}")
