import json

# Load the GeoJSON file
with open("C:/Users/nikhi/CSE416/server/data/stony_brook_buildings.geojson", "r") as f:
    geojson_data = json.load(f)

# Refined building ID generation logic with uniqueness guarantee
def generate_building_id(name, existing_ids):
    if not name:
        return None
    words = name.replace(",", "").replace("(", "").replace(")", "").split()
    
    if len(words) >= 4:
        base_id = (words[0][0] + words[1][0] + words[2][0] + words[3][0]).upper()
    elif len(words) == 3:
        base_id = (words[0][0] + words[1][0] + words[2][0:2]).upper()
    elif len(words) == 2:
        base_id = (words[0][0:3] + words[1][0]).upper()
    else:
        base_id = words[0][0:4].upper()

    # Ensure it's 4 characters
    base_id = (base_id + "XXXX")[:4]

    # Handle duplicates
    candidate = base_id
    i = 1
    while candidate in existing_ids:
        # Modify last character to a digit or letter to differentiate
        suffix = str(i)
        candidate = (base_id[:4 - len(suffix)] + suffix).upper()
        i += 1
    existing_ids.add(candidate)
    return candidate

# Generate buildingIds with uniqueness
existing_ids = set()
for feature in geojson_data.get("features", []):
    name = feature["properties"].get("name")
    building_id = generate_building_id(name, existing_ids) if name else None
    if building_id:
        feature["properties"]["buildingId"] = building_id

# Save updated GeoJSON file
updated_path = "C:/Users/nikhi/CSE416/server/data/stony_brook_buildings.geojson"
with open(updated_path, "w") as f:
    json.dump(geojson_data, f, indent=2)

print(f"✅ Updated GeoJSON with unique 4-letter buildingIds saved to: {updated_path}")
