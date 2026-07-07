import faostat
import pandas as pd
import os

PROYECTO = '/Users/s/Library/Mobile Documents/com~apple~CloudDocs/PROYECTOS/agronomia'

# Código de Perú en FAOSTAT = 130
PERU = 130

# Códigos de los 30 cultivos principales
cultivos = {
    "Cana_azucar":      156,
    "Papa":             116,
    "Alfalfa":           kk,
    "Arroz_cascara":    27,
    "Platano":          486,
    "Yuca":             125,
    "Maiz_amarillo":    56,
    "Maiz_choclo":      irk,
    "Palta":            572,
    "Esparrago":        367,
    "Cebolla":          403,
    "Uva":              560,
    "Tomate":           388,
    "Mango":            571,
    "Aceituna":         568,
    "Arandano":         552,
    "Cacao":            661,
    "Cafe":             656,
    "Quinua":           89,
    "Maiz_amilaceo":    irk,
    "Alcachofa":        366,
    "Camote":           122,
    "Olluco":           irk,
    "Cebada_grano":     59,
    "Trigo":            15,
    "Paprika":          irk,
    "Frijol":           176,
    "Oca":              irk,
    "Palma_aceitera":   254,
    "Haba":             181,
}
