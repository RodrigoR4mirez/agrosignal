# Créditos de fotos de los lotes de ejemplo

Fotos de dominio público o CC0 obtenidas vía [Openverse](https://openverse.org), redimensionadas a 1600 px como máximo y subidas al bucket `fotos-lotes`. No requieren atribución; se documentan por trazabilidad. Se descartaron las de rawpixel porque Openverse sirve versiones con marca de agua. Se borran junto con los datos de ejemplo (`scripts/limpiar-ejemplos.sql`).

| Archivo | Título | Autor | Licencia | Fuente |
|---|---|---|---|---|
| alcachofa-1.jpg | Cynara scolymus Globe Artichoke | ksblack99 | PDM | [flickr](https://www.flickr.com/photos/91064752@N03/14243936510) |
| arandano-1.jpg | Blueberries Blueberry | veeterzy | CC0 | [stocksnap](https://stocksnap.io/photo/blueberries-blueberry-89KAK10OJI) |
| arandano-2.jpg | Blueberries Blueberry | Katie Chase | CC0 | [stocksnap](https://stocksnap.io/photo/blueberries-blueberry-NZLZEO52W7) |
| banano-1.jpg | A shell house with black iron sheets is covered by coffee an | Kanyike Simon Peter Kiviiri | CC0 | [wordpress](https://wordpress.org/photos/photo/39768eead9/) |
| cacao-1.jpg | Cacao in Kona | Plant pests and diseases | CC0 | [flickr](https://www.flickr.com/photos/62295966@N07/8292225598) |
| cafe-1.jpg | A close-up image of ripe and unripe coffee cherries on a bra | Francisco Herrera | CC0 | [wordpress](https://wordpress.org/photos/photo/301666ac5b/) |
| cebolla-1.jpg | A pile of fresh red onions stacked for sale, showing natural | Bigul Malayi | CC0 | [wordpress](https://wordpress.org/photos/photo/5668ea31b2/) |
| cebolla-2.jpg | red onions in a typical Indonesian rice field | Ahmad Syarifuddin Latif | CC0 | [wordpress](https://wordpress.org/photos/photo/605653d121/) |
| jengibre-1.jpg | P7110167 | Plant pests and diseases | CC0 | [flickr](https://www.flickr.com/photos/62295966@N07/8427831416) |
| jengibre-2.jpg | Fresh ginger roots piled together in the hypermarket in Kozh | Bigul Malayi | CC0 | [wordpress](https://wordpress.org/photos/photo/760692582a/) |
| mandarina-1.jpg | Shopping for lunar new year - lime and mandarin oranges | GeorgeTan#5 | CC0 | [flickr](https://www.flickr.com/photos/198109102@N06/53475241398) |
| mandarina-2.jpg | Mandarin Orange | chooyutshing | PDM | [flickr](https://www.flickr.com/photos/25802865@N08/55101008087) |
| mango-1.jpg | Sunflower and Mango tree which is showing the natural beauty | Md. Russel Hussain | CC0 | [wordpress](https://wordpress.org/photos/photo/6986501859/) |
| mango-2.jpg | A massive African mango tree with a dense rounded canopy sta | Mohammed Kateregga | CC0 | [wordpress](https://wordpress.org/photos/photo/22269d222b/) |
| palta-1.jpg | 20190715-OSEC-LSC-1087 | USDAgov | PDM | [flickr](https://www.flickr.com/photos/41284017@N08/48298750091) |
| palta-2.jpg | Avocado: Anthracnose | Plant pests and diseases | CC0 | [flickr](https://www.flickr.com/photos/62295966@N07/13976016288) |
| papa-1.jpg | Mini potato harvest | Mary Hutchison | PDM | [flickr](https://www.flickr.com/photos/25828087@N05/10779704966) |
| papa-2.jpg | food-healthy-vegetables-potatoes | pixellaphoto | CC0 | [flickr](https://www.flickr.com/photos/137643065@N06/23958160949) |
| quinua-1.jpg | ch'iva, ch'ivaqhora [chile], chula, quingua, quinoa, quínoa, | Philipp | CC0 | [inaturalist](https://www.inaturalist.org/photos/143908949) |
| uva-1.jpg | Nature Vines | Rohit Tandon | CC0 | [stocksnap](https://stocksnap.io/photo/nature-vines-XDTXWYRRZI) |

## Fotos de la landing (`public/landing/`)

Copias de seis de las fotos anteriores, para que la landing (`app/page.tsx`) no
dependa de los datos de ejemplo, que pueden borrarse. Mismos autores y licencias
que en la tabla: `cafe-1.jpg`, `arandano-1.jpg`, `banano-1.jpg`, `palta-1.jpg`,
`mango-1.jpg` y `papa-1.jpg`. La landing también usa las dos fotos de Pexels de
`public/marketplace/` (créditos en `app/marketplace/README.md`).
