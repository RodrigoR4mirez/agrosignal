import requests
import pandas as pd
import os

PROYECTO = '/Users/s/Library/Mobile Documents/com~apple~CloudDocs/PROYECTOS/agronomia'

def descargar_clima(lat, lon, fecha_inicio, fecha_fin, lugar="zona"):
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
        print(f"Error: {r.status_code}")
        return None
    data = r.json()
    df = pd.DataFrame(data["properties"]["parameter"])
    df.index = pd.to_datetime(df.index, format="%Y%m%d")
    df.index.name = "fecha"
    df.columns = ["temp_media", "temp_max", "temp_min", "precipitacion_mm", "humedad_%"]
    archivo = os.path.join(PROYECTO, f"clima_{lugar}_{fecha_inicio}_{fecha_fin}.csv")
    df.to_csv(archivo)
    print(f"✓ Guardado: {archivo} ({len(df)} días)")
    return df

df = descargar_clima(-12.05, -77.03, "20200101", "20241231", "Lima")
if df is not None:
    print(df.head())
