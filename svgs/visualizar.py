import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os

PROYECTO = '/Users/s/Library/Mobile Documents/com~apple~CloudDocs/PROYECTOS/agronomia'
df = pd.read_csv(os.path.join(PROYECTO, 'clima_peru_completo.csv'), index_col='fecha', parse_dates=True)

sns.set_theme(style="whitegrid")

# --- Gráfico 1: Temperatura media anual por región ---
temp_anual = df.groupby('region')['temp_media'].mean().sort_values()
fig, ax = plt.subplots(figsize=(12, 7))
bars = ax.barh(temp_anual.index, temp_anual.values, color=sns.color_palette("coolwarm", len(temp_anual)))
ax.set_title('Temperatura media (2015–2024) por región', fontsize=14, fontweight='bold')
ax.set_xlabel('°C')
for bar, val in zip(bars, temp_anual.values):
    ax.text(val + 0.1, bar.get_y() + bar.get_height()/2, f'{val:.1f}°C', va='center', fontsize=9)
plt.tight_layout()
plt.savefig(os.path.join(PROYECTO, 'grafico_temperatura_regiones.png'), dpi=150)
plt.close()
print("✓ grafico_temperatura_regiones.png")

# --- Gráfico 2: Precipitación mensual promedio por región ---
df['mes'] = df.index.month
lluvia_mensual = df.groupby(['region', 'mes'])['precipitacion_mm'].mean().unstack()
fig, ax = plt.subplots(figsize=(14, 8))
for region in ['Piura', 'Cusco', 'Lima', 'Loreto', 'Arequipa', 'Puno']:
    ax.plot(range(1, 13), lluvia_mensual.loc[region], marker='o', label=region, linewidth=2)
ax.set_xticks(range(1, 13))
ax.set_xticklabels(['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'])
ax.set_title('Precipitación mensual promedio por región', fontsize=14, fontweight='bold')
ax.set_ylabel('mm/día')
ax.legend()
plt.tight_layout()
plt.savefig(os.path.join(PROYECTO, 'grafico_lluvia_mensual.png'), dpi=150)
plt.close()
print("✓ grafico_lluvia_mensual.png")

# --- Gráfico 3: Evolución temperatura Lima vs Cusco vs Loreto ---
fig, ax = plt.subplots(figsize=(14, 5))
for region, color in [('Lima', '#E74C3C'), ('Cusco', '#3498DB'), ('Loreto', '#2ECC71')]:
    serie = df[df['region'] == region]['temp_media'].resample('ME').mean()
    ax.plot(serie.index, serie.values, label=region, color=color, linewidth=1.5)
ax.set_title('Temperatura media mensual 2015–2024', fontsize=14, fontweight='bold')
ax.set_ylabel('°C')
ax.legend()
plt.tight_layout()
plt.savefig(os.path.join(PROYECTO, 'grafico_evolucion_temperatura.png'), dpi=150)
plt.close()
print("✓ grafico_evolucion_temperatura.png")

# --- Gráfico 4: Mapa de calor temperatura por región y mes ---
pivot = df.groupby(['region', 'mes'])['temp_media'].mean().unstack()
fig, ax = plt.subplots(figsize=(13, 10))
sns.heatmap(pivot, cmap='RdYlBu_r', annot=True, fmt='.0f', linewidths=0.5,
            xticklabels=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
            ax=ax)
ax.set_title('Temperatura media °C por región y mes', fontsize=14, fontweight='bold')
ax.set_ylabel('')
plt.tight_layout()
plt.savefig(os.path.join(PROYECTO, 'grafico_heatmap_temperatura.png'), dpi=150)
plt.close()
print("✓ grafico_heatmap_temperatura.png")

print("\n✓ 4 gráficos guardados en tu carpeta de iCloud")
