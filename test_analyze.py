import pandas as pd
import tempfile
import io

# Simulate the analyze_csv_headers logic
csv_content = """License #,DBA Name,Address,Facility Type,Risk,Zip
10001,Green Apron Cafe,123 Espresso Lane,Restaurant,Risk 1 (High),60601
10002,Daily Grind,456 Mocha Blvd,Restaurant,Risk 2 (Medium),60602
10003,Healthy Harvests,789 Celery St,Grocery Store,Risk 3 (Low),60603
10004,Vagabond Tacos,Mobile Food Truck,Mobile Food Preparer,Risk 1 (High),60604"""

file_stream = io.BytesIO(csv_content.encode('utf-8'))

try:
    print("Reading first 5 rows...")
    df = pd.read_csv(file_stream, nrows=5)
    headers = df.columns.tolist()
    print("Headers:", headers)
    
    print("Seeking to 0...")
    file_stream.seek(0)
    
    print("Reading full dataframe...")
    df_full = pd.read_csv(file_stream)
    print("Full dataframe loaded. Rows:", len(df_full))
    
    fd, temp_path = tempfile.mkstemp(suffix=".csv")
    df_full.to_csv(temp_path, index=False)
    print("Saved to temp:", temp_path)
except Exception as e:
    print("Error caught:", str(e))
