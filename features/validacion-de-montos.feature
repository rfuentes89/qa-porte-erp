# language: es
#
# Ejemplo de especificación en formato BDD / Gherkin.
#
# Este archivo describe COMPORTAMIENTO en lenguaje que puede leer negocio, sin
# tecnicismos. Su implementación ejecutable está en
# tests/bdd/validacion-de-montos.spec.ts, que sigue paso a paso estos escenarios.
#
# Corresponde a los defectos DEF-07 (ingresos) y DEF-08 (egresos): hoy estos
# escenarios FALLAN, porque el sistema acepta montos que deberían rechazarse.

Característica: Validación de montos en los movimientos de dinero
  Para que los reportes de caja y rentabilidad sean confiables
  Como responsable de administración
  Quiero que el sistema rechace montos imposibles al registrar cobros y pagos

  Antecedentes:
    Dado que ingresé como administrador

  Escenario: No se puede registrar un cobro con monto negativo
    Dado que estoy registrando un cobro sobre una venta existente
    Cuando cargo un monto de -500
    Y guardo el cobro
    Entonces el sistema debe rechazarlo
    Y el cobro no debe quedar registrado

  Escenario: No se puede registrar un pago con monto negativo
    Dado que estoy registrando un pago a un proveedor existente
    Cuando cargo un monto de -300
    Y guardo el pago
    Entonces el sistema debe rechazarlo
    Y el pago no debe quedar registrado

  Escenario: No se puede registrar un pago sin proveedor ni obra
    Dado que estoy registrando un pago
    Cuando dejo el monto en 0 y no indico proveedor ni obra
    Y guardo el pago
    Entonces el sistema debe rechazarlo
