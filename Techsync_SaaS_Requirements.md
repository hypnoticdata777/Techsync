# TechSync — Requisitos Funcionales y No Funcionales
### Documento de Especificación para POC de Herramienta SaaS

**Versión:** 1.0
**Autor:** Carlos Sanchez Gonzalez
**Propósito:** Definir el alcance funcional y las cualidades técnicas del sistema para transformar TechSync (plataforma de gestión de servicio de campo) en un Proof of Concept viable como producto SaaS multi-tenant.

---

## 1. Contexto y Alcance

**El problema que TechSync resuelve:**
TechSync ingiere órdenes de trabajo (work orders) desde cualquier fuente — CSV, PDF, Excel, formularios web, correos electrónicos, webhooks de API — y las sincroniza inteligentemente con el técnico correcto basándose en rutas, prioridad y habilidades.

**Diferencia entre el MVP original y el POC SaaS:**
El MVP original fue diseñado para una sola organización (single-tenant), asumiendo un solo equipo de campo. Para convertirlo en un POC de SaaS, este documento añade los requisitos de **multi-tenencia, onboarding de organizaciones, roles por cliente, y monetización** — la capa que permite que múltiples empresas de servicio de campo usen la misma instancia de TechSync de forma aislada y segura.

**Stack técnico de referencia (ya definido):**
| Capa | Tecnología |
|---|---|
| Cliente móvil | React Native (CLI, no Expo) |
| Backend | Python FastAPI + Uvicorn |
| Base de datos | Supabase (PostgreSQL) |
| Validación | Pydantic |
| Migraciones | Alembic |
| Autenticación | JWT |
| Ingesta de datos | Make.com (pipeline de parsing) |

---

## 2. Requisitos Funcionales (RF)

Cada requisito incluye ID, prioridad (MoSCoW: Must/Should/Could/Won't) y criterio de aceptación.

### 2.1 Módulo: Autenticación y Gestión de Usuarios

| ID | Requisito | Prioridad | Criterio de aceptación |
|---|---|---|---|
| RF-01 | El sistema debe permitir registro e inicio de sesión mediante email y contraseña, con emisión de JWT (access + refresh token). | Must | Usuario recibe access token válido por 15 min y refresh token de 7 días. |
| RF-02 | El sistema debe soportar roles diferenciados: Admin de organización, Coordinador, Técnico de campo. | Must | Cada rol tiene permisos distintos verificados vía middleware. |
| RF-03 | El sistema debe permitir recuperación de contraseña vía email. | Should | Usuario recibe link de reseteo válido por 1 hora. |
| RF-04 | El sistema debe soportar autenticación desde la app móvil con almacenamiento seguro del token (Keychain/Keystore). | Must | Token persiste entre sesiones sin exponerse en almacenamiento plano. |

### 2.2 Módulo: Multi-tenencia y Onboarding (capa SaaS)

| ID | Requisito | Prioridad | Criterio de aceptación |
|---|---|---|---|
| RF-05 | El sistema debe aislar los datos de cada organización (tenant) mediante `organization_id` en cada tabla relevante, reforzado con Row Level Security (RLS) de Supabase. | Must | Una consulta de la Organización A nunca retorna filas de la Organización B, incluso con error de aplicación. |
| RF-06 | El sistema debe permitir que un nuevo cliente cree su organización mediante un flujo de onboarding self-service (nombre de empresa, industria, primer admin). | Must | Flujo completo toma menos de 5 minutos sin intervención manual. |
| RF-07 | El sistema debe permitir invitar usuarios adicionales a una organización vía email con rol pre-asignado. | Should | Invitado recibe link único, expira en 48 horas. |
| RF-08 | El sistema debe permitir configuración básica por organización (zona horaria, tipos de servicio, prioridades personalizadas). | Could | Configuración persiste y afecta lógica de negocio (ej. cálculo de SLA). |

### 2.3 Módulo: Ingesta de Datos (Data Ingestion Layer)

| ID | Requisito | Prioridad | Criterio de aceptación |
|---|---|---|---|
| RF-09 | El sistema debe aceptar work orders en formato CSV mediante carga manual. | Must | Archivo de 100 filas se procesa y crea work orders en <10s. |
| RF-10 | El sistema debe extraer campos clave (cliente, ubicación, urgencia, tipo de servicio) desde PDFs y formularios web. | Should | Extracción correcta en al menos 90% de un set de prueba de 20 documentos. |
| RF-11 | El sistema debe aceptar creación de work orders vía webhook de API (integración externa). | Must | Webhook documentado en OpenAPI, responde 202 y encola procesamiento. |
| RF-12 | El sistema debe validar y normalizar los datos entrantes antes de crear el registro (usando Pydantic). | Must | Datos inválidos son rechazados con mensaje de error específico por campo. |
| RF-13 | El sistema debe permitir ingesta vía reenvío de correo electrónico con adjuntos. | Could | Correo reenviado a dirección dedicada genera work order en <2 min. |

### 2.4 Módulo: Motor de Asignación (Matching Algorithm)

| ID | Requisito | Prioridad | Criterio de aceptación |
|---|---|---|---|
| RF-14 | El sistema debe asignar automáticamente un work order al técnico más adecuado según: proximidad de ruta, prioridad del trabajo, y habilidades/certificaciones del técnico. | Must | Algoritmo retorna una asignación en <2s para un pool de 50 técnicos. |
| RF-15 | El sistema debe permitir reasignación manual de un work order por un coordinador. | Must | Reasignación se refleja en tiempo real en la app del técnico. |
| RF-16 | El sistema debe notificar al técnico asignado de forma inmediata (push notification). | Should | Técnico recibe notificación en <30s tras la asignación. |
| RF-17 | El sistema debe permitir configurar reglas de prioridad por organización (ej. "emergencias de plomería siempre primero"). | Could | Regla configurada se aplica de forma consistente en el algoritmo. |

### 2.5 Módulo: Gestión de Work Orders

| ID | Requisito | Prioridad | Criterio de aceptación |
|---|---|---|---|
| RF-18 | El sistema debe permitir CRUD completo de work orders (crear, ver, actualizar estado, cerrar). | Must | Todos los estados (abierto, en progreso, completado, cancelado) son transicionables según reglas de negocio. |
| RF-19 | El sistema debe permitir adjuntar fotos/documentos a un work order desde la app móvil (evidencia de trabajo). | Must | Foto tomada con cámara se sube y asocia al work order correcto. |
| RF-20 | El sistema debe mantener un historial de actividad (audit log) por work order. | Should | Cada cambio de estado queda registrado con timestamp y usuario responsable. |
| RF-21 | El sistema debe permitir búsqueda y filtrado de work orders por estado, técnico, cliente, y rango de fechas. | Should | Filtro combinado retorna resultados correctos en <1s sobre 10,000 registros. |

### 2.6 Módulo: App Móvil para Técnicos de Campo

| ID | Requisito | Prioridad | Criterio de aceptación |
|---|---|---|---|
| RF-22 | La app debe mostrar al técnico su lista de work orders asignados, ordenados por prioridad/ruta. | Must | Lista carga en <2s en conexión 4G. |
| RF-23 | La app debe funcionar con conectividad intermitente, permitiendo consulta y actualización básica offline con sincronización posterior. | Should | Cambios hechos offline se sincronizan sin pérdida de datos al recuperar conexión. |
| RF-24 | La app debe permitir al técnico marcar un work order como completado, incluyendo foto y notas. | Must | Estado se refleja en el panel admin en tiempo real. |

### 2.7 Módulo: Panel Administrativo

| ID | Requisito | Prioridad | Criterio de aceptación |
|---|---|---|---|
| RF-25 | El panel debe mostrar un dashboard con métricas clave (work orders abiertos, SLA en riesgo, técnicos activos). | Should | Métricas se actualizan sin recargar la página (polling o websockets). |
| RF-26 | El panel debe permitir gestión de técnicos (alta, baja, habilidades, disponibilidad). | Must | Cambios se reflejan inmediatamente en el algoritmo de asignación. |

### 2.8 Módulo: Suscripción y Facturación (capa SaaS)

| ID | Requisito | Prioridad | Criterio de aceptación |
|---|---|---|---|
| RF-27 | El sistema debe soportar al menos un plan de suscripción (ej. "Free trial" de 14 días) por organización. | Should | Organización nueva inicia automáticamente en trial, sin tarjeta requerida. |
| RF-28 | El sistema debe integrar un proveedor de pagos (ej. Stripe) para manejar upgrade a plan pago. | Could | Checkout de Stripe en modo test procesa correctamente un pago simulado. |
| RF-29 | El sistema debe restringir funcionalidades según el plan (ej. límite de técnicos en plan gratuito). | Could | Organización en plan Free no puede exceder el límite configurado. |

---

## 3. Requisitos No Funcionales (RNF)

| ID | Categoría | Requisito | Métrica objetivo (POC) |
|---|---|---|---|
| RNF-01 | Rendimiento | Tiempo de respuesta de la API para operaciones CRUD estándar. | p95 < 300ms |
| RNF-02 | Rendimiento | Tiempo de procesamiento del algoritmo de matching. | < 2s por asignación |
| RNF-03 | Escalabilidad | El sistema debe soportar múltiples organizaciones sin degradación notable de performance a escala de POC. | Hasta 20 organizaciones / 500 work orders simultáneos |
| RNF-04 | Seguridad | Toda comunicación cliente-servidor debe ir cifrada. | HTTPS/TLS 1.2+ obligatorio, sin excepciones |
| RNF-05 | Seguridad | Los datos de cada tenant deben estar aislados a nivel de base de datos, no solo a nivel de aplicación. | RLS activo en todas las tablas multi-tenant |
| RNF-06 | Seguridad | Las contraseñas deben almacenarse con hash (bcrypt/argon2), nunca en texto plano. | Verificado en código y en base de datos |
| RNF-07 | Disponibilidad | El sistema debe estar disponible para demos y pruebas de forma consistente. | Uptime objetivo 99% durante fase de POC (no SLA productivo) |
| RNF-08 | Usabilidad | La app móvil debe ser utilizable por un técnico de campo sin capacitación previa extensa. | Onboarding de un técnico nuevo en <5 min sin soporte |
| RNF-09 | Mantenibilidad | El código backend debe seguir una estructura modular clara (routers, services, models separados) para facilitar extensión futura. | Revisión de arquitectura documentada en README |
| RNF-10 | Mantenibilidad | Las migraciones de base de datos deben ser versionadas y reproducibles. | Alembic aplica migraciones limpiamente en ambiente nuevo |
| RNF-11 | Portabilidad | El sistema debe poder desplegarse en un entorno de nube estándar sin dependencias de infraestructura propietaria fuera de Supabase. | Deploy documentado y reproducible (Docker + variables de entorno) |
| RNF-12 | Observabilidad | El sistema debe registrar logs estructurados de errores y eventos clave (ingesta, asignación, fallos de autenticación). | Logs consultables durante demo/debugging |
| RNF-13 | Cumplimiento de datos | El sistema debe permitir eliminación de datos de una organización a solicitud (alineado a principios básicos de privacidad, sin implicar cumplimiento legal formal en fase POC). | Endpoint de eliminación de tenant disponible para pruebas internas |
| RNF-14 | Compatibilidad | La app móvil debe funcionar en las versiones actuales de iOS y Android soportadas por React Native CLI. | Probado en al menos un dispositivo real por plataforma |

---

## 4. Notas de Alcance para el POC

- **Lo que SÍ entra en el POC:** autenticación multi-rol, aislamiento de tenant vía RLS, ingesta básica (CSV + webhook como mínimo), motor de asignación funcional (aunque sea con reglas simples al inicio), CRUD de work orders, app móvil básica funcional, dashboard con métricas mínimas.
- **Lo que se puede diferir post-POC:** integración de pagos real (Stripe puede quedar en modo test/mock), ingesta por PDF/email (son "Should/Could", no bloqueantes), reglas de prioridad configurables por organización, soporte offline robusto en la app.
- **Riesgo principal a vigilar:** el aislamiento multi-tenant (RF-05, RNF-05) es el requisito que más diferencia un "proyecto personal" de un "SaaS real" ante un entrevistador técnico. Si el tiempo es limitado, priorizar esto sobre features adicionales de ingesta.

---

*Documento vivo — actualizar conforme avance la implementación real del código.*
