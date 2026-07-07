import requests
import pandas as pd
import os
import time

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
    r = requests.get(url, params=params)
    if r.status_code != 200:
        print(f"  ✗ Error en {lugar}: {r.status_code}")
        return None
    data = r.json()
    df = pd.DataFrame(data["properties"]["parameter"])
    df.index = pd.to_datetime(df.index, format="%Y%m%d")
    df.index.name = "fecha"
    df.columns = ["temp_media", "temp_max", "temp_min", "precipitacion_mm", "humedad_%"]
    df["region"] = lugar
    archivo = os.path.join(PROYECTO, f"clima_{lugar}_20150101_20241231.csv")
    df.to_csv(archivo)
    print(f"  ✓ {lugar}: {len(df)} días guardados")
    return df

regiones = [
    ("Amazonas",          -6.23,  -77.87),
    ("Ancash",            -9.53,  -77.53),
    ("Apurimac",         -14.05,  -73.09),
    ("Ayacucho",         -13.16,  -74.22),
    ("Cajamarca",         -7.16,  -78.51),
    ("Callao",           -12.06,  -77.13),
    ("Cusco",            -13.52,  -71.97),
    ("Huancavelica",     -12.79,  -74.97),
    ("Huanuco",           -9.93,  -76.24),
    ("Ica",              -14.07,  -75.73),
    ("Junin",            -11.99,  -75.27),
    ("LaLibertad",        -8.11,  -79.03),
    ("Lambayeque",        -6.77,  -79.84),
    ("Lima",             -12.05,  -77.03),
    ("Loreto",            -3.75,  -73.25),
    ("MadreDeDios",      -12.59,  -69.19),
    ("Moquegua",         -17.19,  -70.93),
    ("Pasco",            -10.68,  -76.26),
    ("Piura",             -5.19,  -80.63),
    ("Puno",             -15.84,  -70.02),
    ("SanMartin",         -6.49,  -76.36),
    ("Tacna",            -18.01,  -70.25),
    ("Tumbes",            -3.57,  -80.45),
    ("Ucayali",           -8.38,  -74.55),
    ("Arequipa",         -16.40,  -71.54),
]

print(f"Descargando {len(regiones)} regiones del Perú (2015-2024)...\n")

dfs = []
for i, (nombre, lat, lon) in enumerate(regiones, 1):
    print(f"[{i}/{len(regiones)}] Descargando {nombre}...")
    df = descargar_clima(lat, lon, "20150101", "20241231", nombre)
    if df is not None:
        dfs.append(df)
    time.sleep(0.5)  # pausa para no saturar la API

# Archivo maestro unificado
maestro = pd.concat(dfs)
archivo_maestro = os.path.join(PROYECTO, "clima_peru_completo.csv")
maestro.to_csv(archivo_maestro)

print(f"\n{'='*50}")
print(f"✓ Descarga completa")
print(f"  Regiones: {len(dfs)}/25")
print(f"  Total filas: {len(maestro):,}")
print(f"  Archivo maestro: clima_peru_completo.csv")
