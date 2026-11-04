# 0003. Búsqueda en memoria en la Lambda

**Estado:** aceptada

**Contexto.** HU-09 pide ignorar tildes, ordenar por relevancia y responder en menos de 2 segundos
con 500 fichas. OpenSearch rompería la meta de costo (menos de USD 1 al mes).

**Decisión.** Cargar los metadatos de las fichas publicadas y puntuarlos con una función pura del
dominio, con caché de 60 segundos en la Lambda.

**Consecuencias.** Sin costo adicional. Una ficha nueva puede tardar hasta 60 segundos en aparecer
para instancias ya calientes. Revisar esta decisión si el catálogo supera unos miles de fichas.
