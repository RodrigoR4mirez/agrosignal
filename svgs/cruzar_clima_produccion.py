import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os

PROYECTO = '/Users/s/Library/Mobile Documents/com~apple~CloudDocs/PROYECTOS/agronomia'

# --- Cargar datos ---
print("Cargando datos...")
clima = pd.read_csv(os.path.join(PROYECTO, 'clima_peru_completo.csv'), 
                    index_col='fecha', parse_dates=True)
prod = pd.read_csv(os.path.join(PROYECTO, 'produccion_peru_30cultivos_historico.csv'))

# Resumen climático anual por región
clima_anual = clima.groupby(['region', clima.index.year]).agg(
    temp_media=('temp_media', 'mean'),
    temp_max=('temp_max', 'mean'),
    temp_min=('temp_min', 'mean'),
    precipitacion_total=('precipitacion_mm', 'sum'),
    humedad_media=('humedad_%', 'mean')
).reset_index()
clima_anual.columns = ['region', 'Año', 'temp_media', 'temp_max', 'temp_min', 'precipitacion_total', 'humedad_media']

# Región principal por cultivo
region_cultivo = {
    'Papa':         'Puno',
    'Cafe':         'SanMartin',
    'Cacao':        'SanMartin',
    'Arroz':        'SanMartin',
    'Quinua':       'Puno',
    'Maiz':         'LaLibertad',
    'Maiz_choclo':  'Lima',
    'Palta':        'LaLibertad',
    'Esparrago':    'LaLibertad',
    'Uva':          'Ica',
    'Cebolla':      'Arequipa',
    'Tomate':       'Lima',
    'Mango':        'Piura',
    'Aceituna':     'Tacna',
    'Arandano':     'LaLibertad',
    'Cana_azucar':  'LaLibertad',
    'Platano':      'Loreto',
    'Yuca':         'Loreto',
    'Palma_aceitera':'Loreto',
    'Mandarina':    'Junin',
    'Naranja':      'Junin',
    'Pina':         'Junin',
    'Limon':        'Piura',
    'Camote':       'Lima',
    'Trigo':        'Junin',
    'Haba':         'Junin',
    'Frijol':       'Cajamarca',
    'Alcachofa':    'Ica',
    'Papaya':       'Loreto',
}

# Cruzar clima + producción para años disponibles (2015-2024)
print("Cruzando clima con producción...")
resultados = []
for cultivo, region in region_cultivo.items():
    prod_cultivo = prod[prod['Cultivo'] == cultivo][['Año', 'Toneladas']]
    clima_region = clima_anual[clima_anual['region'] == region][
        ['Año', 'temp_media', 'temp_min', 'precipitacion_total', 'humedad_media']
    ]
    merged = pd.merge(prod_cultivo, clima_region, on='Año')
    merged['Cultivo'] = cultivo
    merged['Region'] = region
    resultados.append(merged)

df = pd.concat(resultados).dropna()
df.to_csv(os.path.join(PROYECTO, 'clima_vs_produccion.csv'), index=False)
print(f"✓ Dataset cruzado: {len(df)} registros, {df['Cultivo'].nunique()} cultivos")

sns.set_theme(style="whitegrid")

# --- Gráfico 1: Producción histórica top 10 cultivos ---
print("Generando gráficos...")
top10 = prod[prod['Año'] >= 2000].groupby('Cultivo')['Toneladas'].mean().nlargest(10).index
fig, axes = plt.subplots(5, 2, figsize=(16, 20))
axes = axes.flatten()
for i, cultivo in enumerate(top10):
    data = prod[prod['Cultivo'] == cultivo]
    axes[i].plot(data['Año'], data['Toneladas']/1000, color='steelblue', linewidth=2)
    axes[i].fill_between(data['Año'], data['Toneladas']/1000, alpha=0.2, color='steelblue')
    axes[i].set_title(cultivo.replace('_', ' '), fontweight='bold')
    axes[i].set_ylabel('Miles de ton')
    axes[i].set_xlabel('')
plt.suptitle('Producción histórica top 10 cultivos del Perú (1961-2024)', 
             fontsize=16, fontweight='bold', y=1.01)
plt.tight_layout()
plt.savefig(os.path.join(PROYECTO, 'grafico_produccion_historica.png'), dpi=150, bbox_inches='tight')
plt.close()
print("✓ grafico_produccion_historica.png")

# --- Gráfico 2: Correlación clima vs producción por cultivo ---
correlaciones = []
for cultivo in df['Cultivo'].unique():
    sub = df[df['Cultivo'] == cultivo]
    if len(sub) < 5:
        continue
    correlaciones.append({
        'Cultivo': cultivo,
        'Temp vs Producción': sub['temp_media'].corr(sub['Toneladas']),
        'Lluvia vs Producción': sub['precipitacion_total'].corr(sub['Toneladas']),
        'Temp_min vs Producción': sub['temp_min'].corr(sub['Toneladas']),
    })

corr_df = pd.DataFrame(correlaciones).set_index('Cultivo')
fig, ax = plt.subplots(figsize=(12, 9))
sns.heatmap(corr_df, annot=True, fmt='.2f', cmap='RdYlGn', center=0,
            linewidths=0.5, ax=ax, vmin=-1, vmax=1)
ax.set_title('Correlación clima vs producción por cultivo\n(verde=positiva, rojo=negativa)', 
             fontsize=14, fontweight='bold')
plt.tight_layout()
plt.savefig(os.path.join(PROYECTO, 'grafico_correlacion_clima_produccion.png'), dpi=150, bbox_inches='tight')
plt.close()
print("✓ grafico_correlacion_clima_produccion.png")

# --- Gráfico 3: Scatter temp vs producción para 6 cultivos clave ---
cultivos_key = ['Papa', 'Cafe', 'Esparrago', 'Palta', 'Maiz', 'Uva']
fig, axes = plt.subplots(2, 3, figsize=(16, 10))
axes = axes.flatten()
for i, cultivo in enumerate(cultivos_key):
    sub = df[df['Cultivo'] == cultivo]
    if sub.empty:
        continue
    axes[i].scatter(sub['temp_media'], sub['Toneladas']/1000, 
                   color='steelblue', alpha=0.7, s=60)
    z = sub[['temp_media', 'Toneladas']].dropna()
    if len(z) > 2:
        m, b = pd.np.polyfit(z['temp_media'], z['Toneladas']/1000, 1) if hasattr(pd, 'np') else __import__('numpy').polyfit(z['temp_media'], z['Toneladas']/1000, 1)
        axes[i].plot(z['temp_media'], m*z['temp_media']+b, 'r--', linewidth=1.5)
    axes[i].set_title(cultivo.replace('_', ' '), fontweight='bold')
    axes[i].set_xlabel('Temp media (°C)')
    axes[i].set_ylabel('Miles de ton')
plt.suptitle('Temperatura vs Producción — cultivos clave', fontsize=14, fontweight='bold')
plt.tight_layout()
plt.savefig(os.path.join(PROYECTO, 'grafico_scatter_temp_produccion.png'), dpi=150, bbox_inches='tight')
plt.close()
print("✓ grafico_scatter_temp_produccion.png")

# --- Gráfico 4: Producción 2024 ranking ---
prod_2024 = prod[prod['Año'] == 2024].sort_values('Toneladas', ascending=True)
prod_2024 = prod_2024[prod_2024['Toneladas'] > 0]
fig, ax = plt.subplots(figsize=(12, 10))
bars = ax.barh(prod_2024['Cultivo'].str.replace('_', ' '), 
               prod_2024['Toneladas']/1000,
               color=sns.color_palette("viridis", len(prod_2024)))
ax.set_xlabel('Miles de toneladas')
ax.set_title('Ranking de producción agrícola Perú 2024', fontsize=14, fontweight='bold')
for bar, val in zip(bars, prod_2024['Toneladas']/1000):
    ax.text(val + 50, bar.get_y() + bar.get_height()/2, 
            f'{val:,.0f}', va='center', fontsize=8)
plt.tight_layout()
plt.savefig(os.path.join(PROYECTO, 'grafico_ranking_2024.png'), dpi=150, bbox_inches='tight')
plt.close()
print("✓ grafico_ranking_2024.png")

print("\n✓ 4 gráficos + dataset cruzado listos en iCloud")
print(f"\nArchivo clave: clima_vs_produccion.csv")
print(f"Úsalo para entrenar modelos predictivos")
