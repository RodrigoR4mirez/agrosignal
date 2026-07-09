import requests
import pandas as pd
import zipfile
import io
import os

PROYECTO = '/Users/s/Library/Mobile Documents/com~apple~CloudDocs/PROYECTOS/agronomia'

# Cultivos reales sin agregados ni duplicados.
# v1.3.0 — CORRECCIÓN CRÍTICA de códigos FAOSTAT:
#   - Papaya: era 526 (Apricots/albaricoques) → correcto 600 (Papayas)
#   - Aceituna: era 568 (Cantaloupes and other melons) → correcto 260 (Olives)
#   - Se agregan Jengibre (720) y Aji_Rocoto (401), que estaban en el dashboard
#     pero faltaban en este diccionario
#   - Se retiran Quinua (89, código que además correspondía a Buckwheat) y
#     Cebada (59), que no forman parte de los 30 cultivos del dashboard
CULTIVOS = {
    156:  "Cana_azucar",
    116:  "Papa",
    27:   "Arroz",
    486:  "Platano",
    56:   "Maiz",
    254:  "Palma_aceitera",
    125:  "Yuca",
    560:  "Uva",
    572:  "Palta",
    495:  "Mandarina",
    403:  "Cebolla",
    574:  "Pina",
    490:  "Naranja",
    446:  "Maiz_choclo",
    497:  "Limon",
    656:  "Cafe",
    661:  "Cacao",
    367:  "Esparrago",
    388:  "Tomate",
    571:  "Mango",
    260:  "Aceituna",
    552:  "Arandano",
    720:  "Jengibre",
    401:  "Aji_Rocoto",
    15:   "Trigo",
    176:  "Frijol",
    181:  "Haba",
    122:  "Camote",
    366:  "Alcachofa",
    600:  "Papaya",
}

# Validación anti-error de mapeo: el nombre de ítem que devuelve FAOSTAT
# debe contener la palabra clave esperada. Si no, el script ABORTA en lugar
# de publicar datos de otro cultivo (bug de v1.0–v1.2 con Papaya y Aceituna).
PALABRA_CLAVE_ITEM = {
    "Cana_azucar": "sugar cane", "Papa": "potato", "Arroz": "rice",
    "Platano": "banana", "Maiz": "maize", "Palma_aceitera": "oil palm",
    "Yuca": "cassava", "Uva": "grape", "Palta": "avocado",
    "Mandarina": "mandarin", "Cebolla": "onion", "Pina": "pineapple",
    "Naranja": "orange", "Maiz_choclo": "green corn", "Limon": "lemon",
    "Cafe": "coffee", "Cacao": "cocoa", "Esparrago": "asparagus",
    "Tomate": "tomato", "Mango": "mango", "Aceituna": "olive",
    "Arandano": "blueberr", "Jengibre": "ginger", "Aji_Rocoto": "chillies",
    "Trigo": "wheat", "Frijol": "bean", "Haba": "broad bean",
    "Camote": "sweet potato", "Alcachofa": "artichoke", "Papaya": "papaya",
}

def validar_mapeo(df_largo):
    errores = []
    for cultivo, item in df_largo.groupby('Cultivo')['Item'].first().items():
        clave = PALABRA_CLAVE_ITEM.get(cultivo, '')
        if clave and clave not in str(item).lower():
            errores.append(f"  ✗ {cultivo}: código apunta a '{item}' (se esperaba algo con '{clave}')")
    if errores:
        raise SystemExit("ERROR DE MAPEO FAOSTAT — no se guardó nada:\n" + "\n".join(errores))
    print("✓ Validación de mapeo cultivo↔ítem FAOSTAT: OK")

print("Descargando ZIP de FAOSTAT...")
url = "https://bulks-faostat.fao.org/production/Production_Crops_Livestock_E_Americas.zip"
r = requests.get(url, stream=True)
z = zipfile.ZipFile(io.BytesIO(r.content))
df = pd.read_csv(z.open('Production_Crops_Livestock_E_Americas_NOFLAG.csv'), encoding='latin1')

# Filtrar Perú + producción + cultivos seleccionados
peru = df[
    (df['Area'] == 'Peru') &
    (df['Element'] == 'Production') &
    (df['Item Code'].isin(CULTIVOS.keys()))
].copy()

# Columnas de años
anios = [c for c in peru.columns if c.startswith('Y') and c[1:].isdigit()]

# Convertir a formato largo
peru_largo = peru.melt(
    id_vars=['Item', 'Item Code'],
    value_vars=anios,
    var_name='Año',
    value_name='Toneladas'
)
peru_largo['Año'] = peru_largo['Año'].str.replace('Y', '').astype(int)
peru_largo['Cultivo'] = peru_largo['Item Code'].map(CULTIVOS)
peru_largo['Toneladas'] = pd.to_numeric(peru_largo['Toneladas'], errors='coerce')
peru_largo = peru_largo.dropna(subset=['Toneladas'])
peru_largo = peru_largo[['Año', 'Cultivo', 'Item', 'Toneladas']].sort_values(['Cultivo', 'Año'])

# Validar ANTES de guardar
validar_mapeo(peru_largo)

# Guardar
archivo = os.path.join(PROYECTO, 'produccion_peru_30cultivos_historico.csv')
peru_largo.to_csv(archivo, index=False)

print(f"✓ {len(peru_largo)} registros guardados")
print(f"  Cultivos: {peru_largo['Cultivo'].nunique()}")
print(f"  Años: {peru_largo['Año'].min()} - {peru_largo['Año'].max()}")
print("\nResumen último año disponible:")
ultimo = peru_largo['Año'].max()
resumen = peru_largo[peru_largo['Año'] == ultimo].sort_values('Toneladas', ascending=False)
resumen['Toneladas'] = resumen['Toneladas'].apply(lambda x: f"{x:,.0f}")
print(resumen[['Cultivo', 'Toneladas']].to_string(index=False))
