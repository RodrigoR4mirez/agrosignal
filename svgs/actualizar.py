import requests
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import zipfile, io, os
from datetime import datetime, date
from dateutil.relativedelta import relativedelta

PROYECTO = '/Users/s/Library/Mobile Documents/com~apple~CloudDocs/PROYECTOS/agronomia'
LOG = os.path.join(PROYECTO, 'log_actualizaciones.txt')

def log(msg):
    linea = f"[{datetime.now().strftime('%Y-%m-%d %H:%M')}] {msg}"
    print(linea)
    with open(LOG, 'a') as f:
        f.write(linea + '\n')

log("=== Iniciando actualización mensual ===")

# --- 1. Actualizar clima hasta el mes pasado ---
log("Descargando clima actualizado...")
hoy = date.today()
fin = (hoy.replace(day=1) - relativedelta(days=1)).strftime('%Y%m%d')
inicio = "20150101"

regiones = [
    ("Amazonas",-6.23,-77.87),("Ancash",-9.53,-77.53),("Apurimac",-14.05,-73.09),
    ("Ayacucho",-13.16,-74.22),("Cajamarca",-7.16,-78.51),("Callao",-12.06,-77.13),
    ("Cusco",-13.52,-71.97),("Huancavelica",-12.79,-74.97),("Huanuco",-9.93,-76.24),
    ("Ica",-14.07,-75.73),("Junin",-11.99,-75.27),("LaLibertad",-8.11,-79.03),
    ("Lambayeque",-6.77,-79.84),("Lima",-12.05,-77.03),("Loreto",-3.75,-73.25),
    ("MadreDeDios",-12.59,-69.19),("Moquegua",-17.19,-70.93),("Pasco",-10.68,-76.26),
    ("Piura",-5.19,-80.63),("Puno",-15.84,-70.02),("SanMartin",-6.49,-76.36),
    ("Tacna",-18.01,-70.25),("Tumbes",-3.57,-80.45),("Ucayali",-8.38,-74.55),
    ("Arequipa",-16.40,-71.54),
]

dfs_clima = []
for nombre, lat, lon in regiones:
    url = "https://power.larc.nasa.gov/api/temporal/daily/point"
    params = {
        "parameters": "T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,RH2M",
        "community": "AG", "longitude": lon, "latitude": lat,
        "start": inicio, "end": fin, "format": "JSON"
    }
    r = requests.get(url, params=params)
    if r.status_code != 200:
        log(f"  ✗ Error {nombre}: {r.status_code}")
        continue
    data = r.json()
    df = pd.DataFrame(data["properties"]["parameter"])
    df.index = pd.to_datetime(df.index, format="%Y%m%d")
    df.index.name = "fecha"
    df.columns = ["temp_media","temp_max","temp_min","precipitacion_mm","humedad_%"]
    df["region"] = nombre
    dfs_clima.append(df)

clima = pd.concat(dfs_clima)
clima.to_csv(os.path.join(PROYECTO, 'clima_peru_completo.csv'))
log(f"✓ Clima actualizado: {len(clima)} registros hasta {fin}")

# --- 2. Actualizar producción desde FAOSTAT ---
log("Actualizando producción desde FAOSTAT...")
CULTIVOS = {
    156:"Cana_azucar",116:"Papa",27:"Arroz",486:"Platano",56:"Maiz",
    254:"Palma_aceitera",125:"Yuca",560:"Uva",572:"Palta",495:"Mandarina",
    403:"Cebolla",574:"Pina",490:"Naranja",446:"Maiz_choclo",497:"Limon",
    656:"Cafe",661:"Cacao",367:"Esparrago",388:"Tomate",571:"Mango",
    568:"Aceituna",552:"Arandano",89:"Quinua",59:"Cebada",15:"Trigo",
    176:"Frijol",181:"Haba",122:"Camote",366:"Alcachofa",526:"Papaya",
}
url_fao = "https://bulks-faostat.fao.org/production/Production_Crops_Livestock_E_Americas.zip"
r = requests.get(url_fao, stream=True)
z = zipfile.ZipFile(io.BytesIO(r.content))
df_fao = pd.read_csv(z.open('Production_Crops_Livestock_E_Americas_NOFLAG.csv'), encoding='latin1')
peru = df_fao[
    (df_fao['Area']=='Peru') &
    (df_fao['Element']=='Production') &
    (df_fao['Item Code'].isin(CULTIVOS.keys()))
].copy()
anios = [c for c in peru.columns if c.startswith('Y') and c[1:].isdigit()]
peru_largo = peru.melt(id_vars=['Item','Item Code'], value_vars=anios, var_name='Año', value_name='Toneladas')
peru_largo['Año'] = peru_largo['Año'].str.replace('Y','').astype(int)
peru_largo['Cultivo'] = peru_largo['Item Code'].map(CULTIVOS)
peru_largo['Toneladas'] = pd.to_numeric(peru_largo['Toneladas'], errors='coerce')
peru_largo = peru_largo.dropna(subset=['Toneladas'])
peru_largo.to_csv(os.path.join(PROYECTO, 'produccion_peru_30cultivos_historico.csv'), index=False)
log(f"✓ Producción actualizada: {len(peru_largo)} registros")

# --- 3. Cruzar clima + producción ---
log("Cruzando datos...")
region_cultivo = {
    'Papa':'Puno','Cafe':'SanMartin','Cacao':'SanMartin','Arroz':'SanMartin',
    'Maiz':'LaLibertad','Maiz_choclo':'Lima','Palta':'LaLibertad','Esparrago':'LaLibertad',
    'Uva':'Ica','Cebolla':'Arequipa','Tomate':'Lima','Mango':'Piura','Aceituna':'Tacna',
    'Arandano':'LaLibertad','Cana_azucar':'LaLibertad','Platano':'Loreto','Yuca':'Loreto',
    'Palma_aceitera':'Loreto','Mandarina':'Junin','Naranja':'Junin','Pina':'Junin',
    'Limon':'Piura','Camote':'Lima','Trigo':'Junin','Haba':'Junin',
    'Frijol':'Cajamarca','Alcachofa':'Ica','Papaya':'Loreto',
}
clima_anual = clima.groupby(['region', clima.index.year]).agg(
    temp_media=('temp_media','mean'),
    temp_min=('temp_min','mean'),
    precipitacion_total=('precipitacion_mm','sum'),
    humedad_media=('humedad_%','mean')
).reset_index()
clima_anual.columns = ['region','Año','temp_media','temp_min','precipitacion_total','humedad_media']

cruces = []
for cultivo, region in region_cultivo.items():
    prod_c = peru_largo[peru_largo['Cultivo']==cultivo][['Año','Toneladas']]
    clim_r = clima_anual[clima_anual['region']==region]
    merged = pd.merge(prod_c, clim_r, on='Año')
    merged['Cultivo'] = cultivo
    merged['Region'] = region
    cruces.append(merged)
df_cruce = pd.concat(cruces).dropna()
df_cruce.to_csv(os.path.join(PROYECTO, 'clima_vs_produccion.csv'), index=False)

# --- 4. Reentrenar modelos y calcular riesgos ---
log("Reentrenando modelos...")
features = ['temp_media','temp_min','precipitacion_total','humedad_media']
modelos = {}
for cultivo in df_cruce['Cultivo'].unique():
    sub = df_cruce[df_cruce['Cultivo']==cultivo].copy()
    media = sub['Toneladas'].mean()
    sub['mala_cosecha'] = (sub['Toneladas'] < media * 0.85).astype(int)
    sub['media_historica'] = media
    if len(sub) < 6 or sub['mala_cosecha'].sum() == 0:
        continue
    X = StandardScaler().fit_transform(sub[features])
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(sub[features])
    clf.fit(X_scaled, sub['mala_cosecha'])
    modelos[cultivo] = {'model':clf,'scaler':scaler,'data':sub,'media':media}

clima_actual = clima[clima.index.year == hoy.year].groupby('region').agg(
    temp_media=('temp_media','mean'),
    temp_min=('temp_min','mean'),
    precipitacion_total=('precipitacion_mm','sum'),
    humedad_media=('humedad_%','mean')
).reset_index()

riesgos = []
for cultivo, info in modelos.items():
    region = region_cultivo.get(cultivo)
    if not region:
        continue
    cr = clima_actual[clima_actual['region']==region]
    if cr.empty:
        continue
    X = info['scaler'].transform(cr[features].values)
    prob = info['model'].predict_proba(X)[0]
    prob_riesgo = prob[1] if len(prob) > 1 else 0
    riesgos.append({
        'Cultivo': cultivo.replace('_',' '),
        'Region': region,
        'Riesgo_%': round(prob_riesgo*100,1),
        'Nivel': 'ALTO' if prob_riesgo>0.6 else 'MEDIO' if prob_riesgo>0.35 else 'BAJO',
        'Media_historica_ton': round(info['media']),
    })

riesgo_df = pd.DataFrame(riesgos).sort_values('Riesgo_%', ascending=False)
riesgo_df.to_csv(os.path.join(PROYECTO, 'riesgo_cosecha_actual.csv'), index=False)

# --- 5. Regenerar dashboard ---
log("Regenerando dashboard...")
colores = {'ALTO':'#E74C3C','MEDIO':'#F39C12','BAJO':'#27AE60'}
riesgo_df['Color'] = riesgo_df['Nivel'].map(colores)
riesgo_sorted = riesgo_df.sort_values('Riesgo_%', ascending=True)

fig = make_subplots(
    rows=1, cols=2,
    subplot_titles=('Riesgo de mala cosecha — año actual','Distribución por nivel'),
    specs=[[{"type":"bar"},{"type":"pie"}]]
)
fig.add_trace(go.Bar(
    y=riesgo_sorted['Cultivo'], x=riesgo_sorted['Riesgo_%'],
    orientation='h', marker_color=riesgo_sorted['Color'],
    text=riesgo_sorted['Riesgo_%'].astype(str)+'%', textposition='outside',
), row=1, col=1)
fig.add_vline(x=60, line_dash="dash", line_color="red", opacity=0.5, row=1, col=1)
fig.add_vline(x=35, line_dash="dash", line_color="orange", opacity=0.5, row=1, col=1)
conteo = riesgo_df['Nivel'].value_counts()
fig.add_trace(go.Pie(
    labels=conteo.index, values=conteo.values,
    marker_colors=['#E74C3C','#F39C12','#27AE60'], hole=0.4,
), row=1, col=2)

mes_actual = datetime.now().strftime('%B %Y')
fig.update_layout(
    title=f'🌾 Riesgo de Mala Cosecha — Perú {mes_actual} (actualizado automáticamente)',
    height=600, template='plotly_white', showlegend=False
)
fig.write_html(os.path.join(PROYECTO, 'dashboard_riesgo_cosecha.html'))

log(f"✓ Dashboard actualizado — {len(riesgo_df)} cultivos analizados")
log("=== Actualización completada ===\n")
