from flask import Flask, json, jsonify, request
from flask_cors import CORS
from astroquery.simbad import Simbad
import os

import urllib

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


def get_wiki_summary(name, common_name):
    """Fetches a brief description from Wikipedia."""
    # Prioritize the common name (e.g., "Crab Nebula" is better than "M 1")
    search_term = name #common_name if common_name and "NAME" not in common_name else name
    
    # Crucial Fix: Wikipedia thinks "M1" is a highway. 
    # We must format it as "Messier 1" to get the astronomical object.
    if search_term.upper().startswith('M') and search_term[1:].strip().isdigit():
        search_term = f"Messier {search_term[1:].strip()}"
        
    try:
        url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{urllib.parse.quote(search_term)}"
        headers = {'User-Agent': 'AstroApp/1.0 (Local Development)'}
        
        response = requests.get(url, headers=headers, timeout=5)
        if response.status_code == 200:
            wiki_data = response.json()
            # The 'extract' field contains the perfect 2-3 sentence summary
            return wiki_data.get('extract', 'No description available for this object.')
    except Exception as e:
        print(f"Wikipedia fetch failed: {e}")
        
    return "No description available for this object."



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
        # Try to query the name as-is
        result_table = Simbad.query_object(name)
        
        # If no result, try adding the 'M' space if it's a Messier
        if result_table is None and name.upper().startswith('M'):
            result_table = Simbad.query_object(f"M {name[1:]}")

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

        description = get_wiki_summary(search_name, common_name)

        data = {
            "name": search_name,
            "common_name": common_name,
            "description": description,
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
    

from astroquery.mast import Observations
from astroquery.skyview import SkyView
import requests
import urllib.parse
@app.route('/api/image/<path:name>')
def get_astronomy_image(name):
    search_name = name.strip()
    if name.upper().startswith('M') and name[1:].isdigit():
        search_name = f"M {name[1:]}"

    mode = request.args.get('mode', 'mono')
    
    # 1. Ask SIMBAD for coordinates & size
    Simbad.reset_votable_fields()
    Simbad.add_votable_fields('galDim_majAxis', 'ra', 'dec') 
    
    try:
        result_table = Simbad.query_object(search_name)
    except Exception as e:
        print(f"Simbad query failed: {e}")
        return jsonify({"url": "", "source": "Error"}), 404

    # If SIMBAD doesn't know where it is, we can't photograph it
    if not result_table or len(result_table) == 0:
        return jsonify({"url": "", "source": "Error"}), 404

    # Extract coordinates directly
    row = result_table[0]
    ra_deg = row['RA'] if 'RA' in row.colnames else row['ra']
    dec_deg = row['DEC'] if 'DEC' in row.colnames else row['dec']
    
    # Adaptive FOV calculation
    fov = 0.5
    try:
        major_axis = row['GALDIM_MAJAXIS']
        if major_axis and not hasattr(major_axis, 'mask'):
            fov = (float(major_axis) / 60.0) * 1.5
    except:
        pass

    fov = max(0.1, min(fov, 4.0)) 
    
    # 2. The Modern CDS HiPS FITS-to-JPG API
    # We use DSS2 Red for Mono, and DSS2 Color for... Color!
    survey = 'CDS/P/DSS2/color' if mode == 'color' else 'CDS/P/DSS2/red'

    # Notice how clean this URL is: it takes RA, Dec, FOV, and format=jpg directly.
    aladin_url = (
        f"https://alasky.cds.unistra.fr/hips-image-services/hips2fits?"
        f"hips={survey}&width=800&height=800&fov={fov}&projection=TAN"
        f"&coordsys=icrs&ra={ra_deg}&dec={dec_deg}&format=jpg"
    )

    # 3. Send the direct URL to React. It's so fast we don't even need a proxy!
    return jsonify({
        "url": aladin_url,
        "source": f"CDS Aladin ({'Color' if mode == 'color' else 'Monochrome'})",
        "fov_deg": round(fov, 2)
    })
   
if __name__ == '__main__':
    # Local development settings
    app.run(host='127.0.0.1', port=5000, debug=True)