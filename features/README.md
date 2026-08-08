# Enfoque BDD (demostración)

Esta carpeta contiene una **muestra** de especificación en formato **BDD /
Gherkin**, agregada junto al catálogo de casos de uso existente — no lo
reemplaza. Sirve para comparar los dos estilos sobre el mismo proyecto.

## Qué hay acá

| Archivo | Qué es |
|---|---|
| [`validacion-de-montos.feature`](validacion-de-montos.feature) | Especificación legible por negocio, en lenguaje Dado / Cuando / Entonces. |
| [`../tests/bdd/validacion-de-montos.spec.ts`](../tests/bdd/validacion-de-montos.spec.ts) | Implementación ejecutable que sigue paso a paso ese `.feature`, usando Playwright. |

Ejecutar: `npx playwright test tests/bdd`

## Casos de uso vs. BDD — la diferencia en una mirada

**Caso de uso** (estilo del catálogo `CASOS_DE_USO_PORTE.md`):

> CU-EG-11 · Rechaza un egreso con monto negativo · P0 · Negativo
> Precondición: proveedor existente. Flujo: cargar monto −300, guardar.
> Resultado esperado: rechazo.

**BDD** (estilo Gherkin):

> Escenario: No se puede registrar un pago con monto negativo
>   Dado que estoy registrando un pago a un proveedor existente
>   Cuando cargo un monto de -300 y guardo el pago
>   Entonces el sistema debe rechazarlo

Dicen lo mismo. La diferencia: el escenario BDD está escrito en el **lenguaje
del negocio** y se lee igual que el reporte que recibe el equipo, cerrando la
brecha entre "lo que reporta QA" y "el test que lo prueba".

## Por qué es "BDD liviano" y no Cucumber

Un BDD "puro" usa una herramienta (Cucumber) que **ejecuta el `.feature`
directamente**, traduciendo cada línea a código mediante "step definitions".
Acá optamos por espejar el `.feature` en un test de Playwright con `test.step()`:

- **Ventaja:** los escenarios quedan legibles y trazables, sin sumar la capa de
  Cucumber ni su mantenimiento (que en una suite chica cuesta más de lo que
  aporta).
- **Costo:** el `.feature` y su implementación se mantienen sincronizados a
  mano, no automáticamente.

Si en el futuro la suite crece y el equipo quiere que negocio escriba los
escenarios y estos se ejecuten solos, el paso siguiente sería incorporar
`@cucumber/cucumber` sobre esta misma base.
