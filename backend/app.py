from flask import Flask, json, jsonify
from flask_cors import CORS
from astroquery.simbad import Simbad
import os

app = Flask(__name__)
CORS(app) # Vital for local React-to-Flask communication

@app.route('/api/catalog/messier')
def get_messier_catalog():

    if os.path.exists('messier_cache.json'):
        with open('messier_cache.json', 'r') as f:
            return jsonify(json.load(f))
    
   
    
    # 1. Define the fields we want in our table
    Simbad.add_votable_fields('flux(V)', 'otype', 'distance')
    
    # 2. Query the 'M' catalog (Messier)
    # Note: SIMBAD might require a criteria query for specifically 'M' objects
    result_table = Simbad.query_criteria("main_id = 'M *'")
    
    if result_table is None:
        return jsonify({"error": "Catalog fetch failed"}), 500

    # 3. Clean the data for JSON (Astro tables use masked arrays which JSON hates)
    catalog_data = []
    for row in result_table:
        catalog_data.append({
            "id": str(row['MAIN_ID']),
            "type": str(row['OTYPE']),
            "ra": str(row['RA']),
            "dec": str(row['DEC']),
            "mag": float(row['FLUX_V']) if not hasattr(row['FLUX_V'], 'mask') else "N/A"
        })
    
    with open('messier_cache.json', 'w') as f:
        json.dump(catalog_data, f)
    return jsonify(catalog_data)

@app.route('/api/object/<name>')
def get_object(name):
    search_name = name
    if name.upper().startswith('M') and name[1:].isdigit():
        search_name = f"M {name[1:]}"

    # Add 'ids' to the fields
    Simbad.reset_votable_fields()
    Simbad.add_votable_fields('V', 'otype', 'mesdistance', 'ids')
    
    try:
        result_table = Simbad.query_object(search_name)
        if result_table is None:
            return jsonify({"error": "Object not found"}), 404

        row = result_table[0]
        
        # 1. Get the raw ID string
        raw_ids = str(row['IDS']) if 'IDS' in row.colnames else ""
        # 2. Split by '|' and clean up spaces
        aliases = [id.strip() for id in raw_ids.split('|')] if raw_ids else []
        
        # 3. Find a "Common Name" (usually the one that doesn't look like a catalog number)
        # Or just pick the first few
        common_name = next((n for n in aliases if "Galaxy" in n or "Nebula" in n), aliases[0] if aliases else search_name)

        def format_num(val, precision=2):
            try:
                return f"{float(val):.{precision}f}"
            except (ValueError, TypeError):
                return val

        data = {
            "name": search_name,
            "common_name": common_name,
            "aliases": aliases[:10], # Send the first 10 aliases to React
            "type": str(row['otype']),
            "ra": format_num(row['ra'], 4),
            "dec": format_num(row['dec'], 4),
            "mag": format_num(row['V'], 2),
            "distance": format_num(row['mesdistance.dist'], 2),
            "unit": str(row['mesdistance.unit'])
        }
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
if __name__ == '__main__':
    # Local development settings
    app.run(host='127.0.0.1', port=5000, debug=True)