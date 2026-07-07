import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import os

PROYECTO = '/Users/s/Library/Mobile Documents/com~apple~CloudDocs/PROYECTOS/agronomia'

# --- Cargar datos ---
print("Cargando datos...")
df = pd.read_csv(os.path.join(PROYECTO, 'clima_vs_produccion.csv'))

# --- Definir "mala cosecha" = producción 15% por debajo de la media histórica ---
resultados = []
for cultivo in df['Cultivo'].unique():
    sub = df[df['Cultivo'] == cultivo].copy()
    media = sub['Toneladas'].mean()
    std = sub['Toneladas'].std()
    sub['mala_cosecha'] = (sub['Toneladas'] < media * 0.85).astype(int)
    sub['desviacion_%'] = ((sub['Toneladas'] - media) / media * 100).round(1)
    sub['media_historica'] = media
    resultados.append(sub)

df = pd.concat(resultados)

# --- Entrenar modelo por cultivo ---
print("Entrenando modelos de detección de riesgo...")
features = ['temp_media', 'temp_min', 'precipitacion_total', 'humedad_media']
modelos = {}
for cultivo in df['Cultivo'].unique():
    sub = df[df['Cultivo'] == cultivo].dropna()
    if len(sub) < 6:
        continue
    X = sub[features]
    y = sub['mala_cosecha']
    if y.sum() == 0:
        continue
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_scaled, y)
    modelos[cultivo] = {'model': clf, 'scaler': scaler, 'data': sub}

print(f"✓ {len(modelos)} modelos entrenados")

# --- Predecir riesgo para 2024 con clima promedio ---
print("Calculando riesgos 2024...")
clima = pd.read_csv(os.path.join(PROYECTO, 'clima_peru_completo.csv'),
                    index_col='fecha', parse_dates=True)
clima_2024 = clima[clima.index.year == 2024].groupby('region').agg(
    temp_media=('temp_media', 'mean'),
    temp_max=('temp_max', 'mean'),
    temp_min=('temp_min', 'mean'),
    precipitacion_total=('precipitacion_mm', 'sum'),
    humedad_media=('humedad_%', 'mean')
).reset_index()

region_cultivo = {
    'Papa': 'Puno', 'Cafe': 'SanMartin', 'Cacao': 'SanMartin',
    'Arroz': 'SanMartin', 'Maiz': 'LaLibertad', 'Maiz_choclo': 'Lima',
    'Palta': 'LaLibertad', 'Esparrago': 'LaLibertad', 'Uva': 'Ica',
    'Cebolla': 'Arequipa', 'Tomate': 'Lima', 'Mango': 'Piura',
    'Aceituna': 'Tacna', 'Arandano': 'LaLibertad', 'Cana_azucar': 'LaLibertad',
    'Platano': 'Loreto', 'Yuca': 'Loreto', 'Palma_aceitera': 'Loreto',
    'Mandarina': 'Junin', 'Naranja': 'Junin', 'Pina': 'Junin',
    'Limon': 'Piura', 'Camote': 'Lima', 'Trigo': 'Junin',
    'Haba': 'Junin', 'Frijol': 'Cajamarca', 'Alcachofa': 'Ica',
}

riesgos = []
for cultivo, modelo_info in modelos.items():
    region = region_cultivo.get(cultivo)
    if not region:
        continue
    clima_region = clima_2024[clima_2024['region'] == region]
    if clima_region.empty:
        continue
    X = clima_region[features].values
    X_scaled = modelo_info['scaler'].transform(X)
    prob = modelo_info['model'].predict_proba(X_scaled)[0]
    prob_riesgo = prob[1] if len(prob) > 1 else 0
    
    sub = modelo_info['data']
    ultima_prod = sub[sub['Año'] == sub['Año'].max()]['Toneladas'].values
    media = sub['media_historica'].values[0]
    
    riesgos.append({
        'Cultivo': cultivo.replace('_', ' '),
        'Region': region,
        'Riesgo_%': round(prob_riesgo * 100, 1),
        'Nivel': 'ALTO' if prob_riesgo > 0.6 else 'MEDIO' if prob_riesgo > 0.35 else 'BAJO',
        'Produccion_media_ton': round(media),
    })

riesgo_df = pd.DataFrame(riesgos).sort_values('Riesgo_%', ascending=False)
riesgo_df.to_csv(os.path.join(PROYECTO, 'riesgo_cosecha_2024.csv'), index=False)

# --- Dashboard HTML ---
print("Generando dashboard...")

colores = {'ALTO': '#E74C3C', 'MEDIO': '#F39C12', 'BAJO': '#27AE60'}
riesgo_df['Color'] = riesgo_df['Nivel'].map(colores)
riesgo_df_sorted = riesgo_df.sort_values('Riesgo_%', ascending=True)

fig = make_subplots(
    rows=2, cols=2,
    subplot_titles=(
        'Riesgo de mala cosecha por cultivo 2024',
        'Distribución por nivel de riesgo',
        'Producción histórica con años de mala cosecha — Papa',
        'Producción histórica con años de mala cosecha — Café'
    ),
    specs=[[{"type": "bar"}, {"type": "pie"}],
           [{"type": "scatter"}, {"type": "scatter"}]]
)

# Gráfico 1: Barras de riesgo
fig.add_trace(go.Bar(
    y=riesgo_df_sorted['Cultivo'],
    x=riesgo_df_sorted['Riesgo_%'],
    orientation='h',
    marker_color=riesgo_df_sorted['Color'],
    text=riesgo_df_sorted['Riesgo_%'].astype(str) + '%',
    textposition='outside',
    name='Riesgo'
), row=1, col=1)
fig.add_vline(x=60, line_dash="dash", line_color="red", opacity=0.5, row=1, col=1)
fig.add_vline(x=35, line_dash="dash", line_color="orange", opacity=0.5, row=1, col=1)

# Gráfico 2: Pie
conteo = riesgo_df['Nivel'].value_counts()
fig.add_trace(go.Pie(
    labels=conteo.index,
    values=conteo.values,
    marker_colors=['#E74C3C', '#F39C12', '#27AE60'],
    hole=0.4,
    name='Distribución'
), row=1, col=2)

# Gráfico 3 y 4: Serie histórica con malas cosechas marcadas
for i, cultivo_nombre in enumerate(['Papa', 'Cafe']):
    cultivo_key = cultivo_nombre
    if cultivo_key not in modelos:
        continue
    sub = modelos[cultivo_key]['data'].sort_values('Año')
    buenas = sub[sub['mala_cosecha'] == 0]
    malas = sub[sub['mala_cosecha'] == 1]
    
    fig.add_trace(go.Scatter(
        x=sub['Año'], y=sub['Toneladas']/1000,
        mode='lines', line=dict(color='steelblue', width=2),
        name=cultivo_nombre, showlegend=False
    ), row=2, col=i+1)
    
    fig.add_trace(go.Scatter(
        x=malas['Año'], y=malas['Toneladas']/1000,
        mode='markers', marker=dict(color='red', size=10, symbol='x'),
        name='Mala cosecha', showlegend=(i==0)
    ), row=2, col=i+1)
    
    fig.add_trace(go.Scatter(
        x=buenas['Año'], y=buenas['Toneladas']/1000,
        mode='markers', marker=dict(color='green', size=6),
        name='Buena cosecha', showlegend=(i==0)
    ), row=2, col=i+1)

fig.update_layout(
    title=dict(
        text='🌾 Sistema de Detección de Riesgo de Mala Cosecha — Perú 2024',
        font=dict(size=18)
    ),
    height=900,
    showlegend=True,
    template='plotly_white'
)
fig.update_xaxes(title_text='Riesgo (%)', row=1, col=1)
fig.update_xaxes(title_text='Año', row=2, col=1)
fig.update_xaxes(title_text='Año', row=2, col=2)
fig.update_yaxes(title_text='Miles de ton', row=2, col=1)
fig.update_yaxes(title_text='Miles de ton', row=2, col=2)

archivo_html = os.path.join(PROYECTO, 'dashboard_riesgo_cosecha.html')
fig.write_html(archivo_html)
print(f"✓ Dashboard guardado: dashboard_riesgo_cosecha.html")

print("\n--- RESUMEN RIESGO 2024 ---")
print(riesgo_df[['Cultivo', 'Region', 'Riesgo_%', 'Nivel']].to_string(index=False))
