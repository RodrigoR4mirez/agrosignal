import requests
import pandas as pd
import zipfile
import io
import os

PROYECTO = '/Users/s/Library/Mobile Documents/com~apple~CloudDocs/PROYECTOS/agronomia'

# Cultivos reales sin agregados ni duplicados
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
    568:  "Aceituna",
    552:  "Arandano",
    89:   "Quinua",
    59:   "Cebada",
    15:   "Trigo",
    176:  "Frijol",
    181:  "Haba",
    122:  "Camote",
    366:  "Alcachofa",
    526:  "Papaya",
}

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

# Guardar
archivo = os.path.join(PROYECTO, 'produccion_peru_30cultivos_historico.csv')
peru_largo.to_csv(archivo, index=False)

print(f"✓ {len(peru_largo)} registros guardados")
print(f"  Cultivos: {peru_largo['Cultivo'].nunique()}")
print(f"  Años: {peru_largo['Año'].min()} - {peru_largo['Año'].max()}")
print("\nResumen 2024:")
resumen = peru_largo[peru_largo['Año'] == 2024].sort_values('Toneladas', ascending=False)
resumen['Toneladas'] = resumen['Toneladas'].apply(lambda x: f"{x:,.0f}")
print(resumen[['Cultivo', 'Toneladas']].to_string(index=False))
