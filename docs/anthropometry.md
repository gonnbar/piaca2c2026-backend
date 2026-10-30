# Antropometría: Durnin-Womersley (1974) + Siri (1961)

Cálculo del porcentaje de grasa corporal a partir de cuatro pliegues cutáneos,
más IMC, masa grasa y masa libre de grasa. La lógica vive en
`src/services/anthropometryService.ts` y no depende de Express ni de Mongoose.

## Entradas

| Dato | Unidad | Requerido para |
| --- | --- | --- |
| Peso | kg | IMC, masa grasa, masa libre de grasa |
| Altura | cm | IMC |
| Bicipital | mm | % grasa |
| Tricipital | mm | % grasa |
| Subescapular | mm | % grasa |
| Suprailiaco | mm | % grasa |
| Fecha de nacimiento | fecha | % grasa (edad) |
| Sexo (`M`/`F`) | — | % grasa |
| Fecha de medición | fecha | % grasa (edad) |

Los otros cinco pliegues (`crural`, `abdominal`, `pectoral`, `axilar`,
`peroneoGemelar`) se almacenan pero no intervienen en esta ecuación.

## Fórmulas

1. Suma de pliegues: `S = bicipital + tricipital + subescapular + suprailiaco` (mm).
2. Transformación: `L = log10(S)`.
3. Densidad corporal: `D = C - M × L`.
4. Porcentaje de grasa (Siri, 1961): `%grasa = 495 / D - 450`.
5. IMC: `peso / altura(m)²`.
6. Masa grasa: `peso × %grasa / 100`.
7. Masa libre de grasa: `peso - masa grasa`.

No se redondea en pasos intermedios. La salida se redondea a 2 decimales:
IMC, porcentaje de grasa, masa grasa y masa libre de grasa.

## Coeficientes

| Edad (años) | Hombres C | Hombres M | Mujeres C | Mujeres M |
| --- | --- | --- | --- | --- |
| 17–19 | 1.1620 | 0.0630 | 1.1549 | 0.0678 |
| 20–29 | 1.1631 | 0.0632 | 1.1599 | 0.0717 |
| 30–39 | 1.1422 | 0.0544 | 1.1423 | 0.0632 |
| 40–49 | 1.1620 | 0.0700 | 1.1333 | 0.0612 |
| 50–72 | 1.1715 | 0.0779 | 1.1339 | 0.0645 |

## Restricciones y semántica “no calculable”

- Edad calculada en UTC a la fecha de la medición. Rango admitido: **17–72 años inclusive**.
- Sin fecha de nacimiento, fecha de medición inválida, edad fuera de rango o sexo
  distinto de `M`/`F` (`X` o ausente): el porcentaje de grasa no es calculable.
- Los cuatro pliegues deben estar presentes, ser numéricos, finitos y mayores que
  cero. Si falta o es inválido alguno, el porcentaje de grasa no es calculable.
- IMC requiere peso y altura numéricos y mayores que cero.
- Masa grasa y masa libre de grasa requieren peso válido y porcentaje de grasa calculable.
- Se valida que la densidad sea finita y mayor que cero, y que el porcentaje de
  grasa quede en `[0, 100]`.
- Un indicador no calculable no invalida los demás. Nunca se reemplaza por `0`.
- No se calcula porcentaje de músculo (`musclePercentage` se conserva sin usar).

Cada indicador se devuelve como:

```json
{ "calculable": true, "value": 16.17, "unit": "%" }
```

o

```json
{ "calculable": false, "reason": "Pliegues inválidos o faltantes: suprailiaco" }
```

## Persistencia

Campos planos en `Measurement`:

- `imc`
- `bodyFatPercentage`
- `fatMass`
- `leanMass`
- `bodyFatMethod` = `"Durnin-Womersley (1974) + Siri (1961)"`
- `bodyFatMethodVersion` = `"1.0.0"`

Solo se persisten valores calculables (los no calculables quedan en `null`). El
método y la versión también quedan en `null` cuando el porcentaje de grasa no es
calculable.

Los registros históricos no se recalculan automáticamente (sin backfill). El
cálculo se ejecuta al crear o editar una medición y al crear o editar una
consulta con medición, incluyendo cambios de fecha.

## Referencias

- Durnin, J. V. G. A. y Womersley, J. (1974). Body fat assessed from total body
  density and its estimation from skinfold thickness: measurements on 481 men and
  women aged from 16 to 72 years. *British Journal of Nutrition*, 32(1), 77–97.
  DOI: [10.1079/BJN19740060](https://doi.org/10.1079/BJN19740060)
- Siri, W. E. (1961). Body composition from fluid spaces and density: analysis of
  methods. En *Techniques for Measuring Body Composition* (pp. 223–244).
  National Academy of Sciences, Washington, DC.
