import urllib.request
import json
import csv
import os

def download_seattle_data():
    url = "https://data.kingcounty.gov/resource/f29f-zza5.json?$limit=5000&$where=city='SEATTLE'"
    print(f"Fetching from {url} ...")
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
    except Exception as e:
        print(f"Failed to fetch data: {e}")
        return

    out_path = os.path.expanduser("~/Desktop/seattle_establishments.csv")
    with open(out_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "business_id", "business_name", "business_address", "business_postal_code", "Facility Type", "risk_category",
            "inspection_date", "inspection_type", "inspection_result", "violation_points", "inspection_serial_num"
        ])
        writer.writeheader()
        count = 0
        for row in data:
            b_id = row.get("business_id")
            if not b_id: continue
            
            desc = row.get("description", "").upper()
            
            risk = "Medium"
            if "RISK CATEGORY I" in desc and "III" not in desc and "II" not in desc:
                risk = "Low"
            elif "RISK CATEGORY III" in desc:
                risk = "High"
                
            fac_type = "Restaurant"
            if "GROCERY" in desc or "MARKET" in desc:
                fac_type = "Grocery"
            elif "MOBILE" in desc or "TRUCK" in desc or "CART" in desc:
                fac_type = "Mobile"

            writer.writerow({
                "business_id": b_id,
                "business_name": row.get("name", "Unknown"),
                "business_address": row.get("address", "Unknown"),
                "business_postal_code": row.get("zip_code", ""),
                "Facility Type": fac_type,
                "risk_category": risk,
                "inspection_date": row.get("inspection_date", ""),
                "inspection_type": row.get("inspection_type", ""),
                "inspection_result": row.get("inspection_result", ""),
                "violation_points": row.get("violation_points", ""),
                "inspection_serial_num": row.get("inspection_serial_num", "")
            })
            count += 1
            
    print(f"Exported {count} inspections to {out_path}")

if __name__ == "__main__":
    download_seattle_data()
