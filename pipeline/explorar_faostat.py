import requests
import pandas as pd
import zipfile
import io
import os

PROYECTO = '/Users/s/Library/Mobile Documents/com~apple~CloudDocs/PROYECTOS/agronomia'

print("Descargando datos de producción agrícola de Perú desde FAOSTAT (bulk)...")

# URL de descarga masiva pública de FAOSTAT
url = "https://bulks-faostat.fao.org/production/Production_Crops_Livestock_E_Americas.zip"

r = requests.get(url, stream=True)
print(f"Status: {r.status_code}")

if r.status_code == 200:
    print("Descomprimiendo...")
    z = zipfile.ZipFile(io.BytesIO(r.content))
    print(f"Archivos en el zip: {z.namelist()}")
    
    # Leer el archivo principal
    nombre = [f for f in z.namelist() if 'Americas' in f and f.endswith('.csv') and 'Flag' not in f and 'Note' not in f][0]
    print(f"Leyendo: {nombre}")
    df = pd.read_csv(z.open(nombre), encoding='latin1')
    
    # Filtrar solo Perú y producción en toneladas
    peru = df[
        (df['Area'] == 'Peru') & 
        (df['Element'] == 'Production')
    ].copy()
    
    # Año más reciente disponible
    anios = [c for c in peru.columns if c.startswith('Y') and c[1:].isdigit()]
    ultimo = anios[-1]
    print(f"Último año disponible: {ultimo}")
    
    peru_año = peru[['Item', 'Item Code', ultimo]].copy()
    peru_año.columns = ['Cultivo', 'Codigo', 'Toneladas']
    peru_año['Toneladas'] = pd.to_numeric(peru_año['Toneladas'], errors='coerce')
    peru_año = peru_año.dropna(subset=['Toneladas'])
    
    # Top 30
    top30 = peru_año.nlargest(30, 'Toneladas').reset_index(drop=True)
    top30.index += 1
    top30['Toneladas'] = top30['Toneladas'].apply(lambda x: f"{x:,.0f}")
    print("\nTop 30 cultivos de Perú por producción:")
    print(top30.to_string())
    
    # Guardar
    top30.to_csv(os.path.join(PROYECTO, 'top30_cultivos_peru.csv'))
    peru.to_csv(os.path.join(PROYECTO, 'produccion_peru_historica.csv'), index=False)
    print(f"\n✓ Guardados en iCloud")
else:
    print(f"Error: {r.status_code}")
