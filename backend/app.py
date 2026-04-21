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
            cached_data = json.load(f)
            # If cache is stale/bad (e.g., every magnitude is N/A), rebuild it.
            if isinstance(cached_data, list) and cached_data:
                has_real_mag = any(item.get('mag') != 'N/A' for item in cached_data if isinstance(item, dict))
                if has_real_mag:
                    return jsonify(cached_data)
    
   
    
    simbad = Simbad()
    simbad.add_votable_fields('V', 'otype')

    # Query the Messier catalog first; if SIMBAD changes behavior, fall back to criteria-based queries.
    result_table = None
    try:
        result_table = simbad.query_catalog('M')
    except Exception:
        result_table = None

    if result_table is None or len(result_table) == 0:
        for criteria in ["id LIKE 'M %'", "main_id LIKE 'M %'"]:
            try:
                candidate = simbad.query_criteria(criteria)
                if candidate is not None and len(candidate) > 0:
                    result_table = candidate
                    break
            except Exception:
                continue

    if result_table is None:
        return jsonify({"error": "Catalog fetch failed"}), 500

    if len(result_table) == 0:
        return jsonify([])

    # 3. Clean the data for JSON (Astro tables use masked arrays which JSON hates)
    catalog_data = []

    def get_col(row, *names, default=""):
        for name in names:
            if name in row.colnames:
                return row[name]
        return default

    def safe_mag(value):
        if getattr(value, 'mask', False):
            return "N/A"
        try:
            return float(value)
        except (TypeError, ValueError):
            return "N/A"

    for row in result_table:
        object_id = str(get_col(row, 'MAIN_ID', 'main_id', 'ID', 'id', default='')).strip()
        if not object_id:
            continue

        catalog_data.append({
            "id": object_id,
            "type": str(get_col(row, 'OTYPE', 'otype', default='Unknown')),
            "ra": str(get_col(row, 'RA', 'ra', default='')),
            "dec": str(get_col(row, 'DEC', 'dec', default='')),
            "mag": safe_mag(get_col(row, 'V', 'v', 'FLUX_V', 'flux_V', 'flux(v)', default='N/A'))
        })
    
    with open('messier_cache.json', 'w') as f:
        json.dump(catalog_data, f)
    return jsonify(catalog_data)

@app.route('/api/object/<path:name>')
def get_object(name):
    search_name = name
    if name.upper().startswith('M') and name[1:].isdigit():
        search_name = f"M {name[1:]}"

    simbad = Simbad()
    simbad.add_votable_fields('V', 'otype', 'mesdistance')

    def get_col(row, *names, default=""):
        for field_name in names:
            if field_name in row.colnames:
                return row[field_name]
        return default

    def format_num(val, precision=2):
        if getattr(val, 'mask', False):
            return "N/A"
        try:
            return f"{float(val):.{precision}f}"
        except (ValueError, TypeError):
            return "N/A"
    
    try:
        result_table = simbad.query_object(search_name)
        if result_table is None:
            return jsonify({"error": "Object not found"}), 404

        row = result_table[0]

        alias_table = simbad.query_objectids(search_name)
        aliases = []
        if alias_table is not None:
            aliases = [str(alias_row['id']).strip() for alias_row in alias_table if str(alias_row['id']).strip()]
        
        # 3. Find a "Common Name" (usually the one that doesn't look like a catalog number)
        # Or just pick the first few
        common_name = next((n for n in aliases if "Galaxy" in n or "Nebula" in n or "NAME" in n), aliases[0] if aliases else search_name)
         
        if "NAME" in common_name:
            common_name = common_name.replace("NAME ", "").strip()
        data = {
            "name": search_name,
            "common_name": common_name,
            "aliases": aliases,
            "type": str(get_col(row, 'otype', 'OTYPE', default='Unknown')),
            "ra": format_num(get_col(row, 'ra', 'RA', default='N/A'), 4),
            "dec": format_num(get_col(row, 'dec', 'DEC', default='N/A'), 4),
            "mag": format_num(get_col(row, 'V', 'v', default='N/A'), 2),
            "distance": format_num(get_col(row, 'mesdistance.dist', default='N/A'), 2),
            "unit": str(get_col(row, 'mesdistance.unit', default=''))
        }
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
if __name__ == '__main__':
    # Local development settings
    app.run(host='127.0.0.1', port=5000, debug=True)