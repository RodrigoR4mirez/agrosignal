// Datos estructurados (schema.org) para buscadores. Escapa "<" para que un texto del usuario
// (cultivo, descripción) no pueda cerrar la etiqueta <script>.
export function JsonLd({ datos }: { datos: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datos).replace(/</g, '\\u003c') }} />
}
