import requests
import pandas as pd
import os

PROYECTO = '/Users/s/Library/Mobile Documents/com~apple~CloudDocs/PROYECTOS/agronomia'

def descargar_clima(lat, lon, fecha_inicio, fecha_fin, lugar):
    url = "https://power.larc.nasa.gov/api/temporal/daily/point"
    params = {
        "parameters": "T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,RH2M",
        "community": "AG",
        "longitude": lon,
        "latitude": lat,
        "start": fecha_inicio,
        "end": fecha_fin,
        "format": "JSON"
    }
    print(f"Descargando {lugar}...")
    r = requests.get(url, params=params)
    if r.status_code != 200:
        print(f"Error en {lugar}: {r.status_code}")
        return None
    data = r.json()
    df = pd.DataFrame(data["properties"]["parameter"])
    df.index = pd.to_datetime(df.index, format="%Y%m%d")
    df.index.name = "fecha"
    df.columns = ["temp_media", "temp_max", "temp_min", "precipitacion_mm", "humedad_%"]
    df["region"] = lugar
    archivo = os.path.join(PROYECTO, f"clima_{lugar}_{fecha_inicio}_{fecha_fin}.csv")
    df.to_csv(archivo)
    print(f"  ✓ {len(df)} días guardados")
    return df

regiones = [
    ("Cusco",        -13.52, -71.97),
    ("Arequipa",     -16.40, -71.54),
    ("Piura",         -5.19, -80.63),
    ("Cajamarca",     -7.16, -78.51),
    ("Junin",        -11.99, -75.27),
    ("LaLibertad",    -8.11, -79.03),
    ("Iquitos",       -3.75, -73.25),
]

dfs = []
for nombre, lat, lon in regiones:
    df = descargar_clima(lat, lon, "20150101", "20241231", nombre)
    if df is not None:
        dfs.append(df)

# Unir todo en un solo archivo maestro
maestro = pd.concat(dfs)
archivo_maestro = os.path.join(PROYECTO, "clima_peru_todas_regiones.csv")
maestro.to_csv(archivo_maestro)
print(f"\n✓ Archivo maestro: {len(maestro)} filas totales")
print(f"  Regiones: {maestro['region'].unique()}")
