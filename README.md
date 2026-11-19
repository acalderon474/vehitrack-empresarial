# Vehitrack Empresarial

**Plataforma web para la gestión operativa y el análisis de rentabilidad de pequeñas empresas de transporte especial turístico y hotelero.**

## 1. Descripción del proyecto

Vehitrack Empresarial es una propuesta tecnológica orientada a mejorar la gestión de vehículos, conductores, solicitudes y asignaciones de servicios de transporte.

Su principal objetivo es apoyar la toma de decisiones mediante la comparación de costos operativos, kilómetros recorridos sin pasajeros y márgenes de rentabilidad estimados y reales.

El proyecto utiliza **Angular 22** para el frontend y contempla su integración con una **API desarrollada en Go**, respaldada por PostgreSQL/PostGIS.

La arquitectura inicial de Angular ya se encuentra preparada y dispone de pruebas automatizadas. Las funcionalidades empresariales y su integración real con el backend se desarrollarán progresivamente.

## 2. Tecnologías utilizadas

| Tecnología | Uso |
|---|---|
| Angular 22 | Desarrollo del frontend |
| TypeScript | Lógica, modelos y contratos de datos |
| SCSS | Estilos de la aplicación |
| Node.js 24 | Entorno recomendado de desarrollo |
| Vitest | Pruebas automatizadas |
| Git y GitHub | Control de versiones y colaboración |
| GitHub Actions | Validación continua |
| GitHub Pages | Publicación del frontend |
| Go | Backend desarrollado por el equipo |
| PostgreSQL/PostGIS | Base de datos y procesamiento geoespacial |

## 3. Instalación y ejecución

### Requisitos previos

Tener instalados:

- Git.
- Node.js 24.
- Visual Studio Code o un editor compatible.

No es necesario instalar Angular CLI globalmente, porque el proyecto incluye las dependencias correspondientes.

### Descargar el repositorio

Ejecutar los siguientes comandos en la terminal:

1. `git clone https://github.com/acalderon474/vehitrack-empresarial.git`
2. `cd vehitrack-empresarial`
3. `npm ci`
4. `npm start`

La aplicación estará disponible en:

http://localhost:4200

El comando `npm ci` instalará las dependencias definidas en `package-lock.json`.

**Importante:** las pantallas pueden ejecutarse localmente sin que todos los endpoints empresariales estén disponibles. La comunicación real con el VPS requiere configurar los servicios y mecanismos de acceso correspondientes.

## 4. Estructura del proyecto

La estructura principal de Angular es:

- `src/app/features/`: componentes de los módulos funcionales.
- `src/app/core/models/`: modelos TypeScript utilizados internamente.
- `src/app/core/dto/`: contratos JSON para intercambiar información con la API.
- `src/app/core/adapters/`: transformación entre modelos Angular y DTO.
- `src/app/core/services/`: servicios de comunicación HTTP.
- `src/app/layout/`: estructura visual y navegación principal.
- `src/environments/`: configuración de entornos.
- `.github/workflows/`: automatización de pruebas, compilación y despliegue.

Los módulos de navegación son Dashboard, Vehículos, Conductores, Solicitudes, Asignaciones, Recorridos y Reportes.

## 5. Distribución de responsabilidades

| Integrante | Responsabilidad |
|---|---|
| Ángel | Dashboard, coordinación técnica, revisión e integración |
| Luis | API Go, PostgreSQL/PostGIS y servicios empresariales |
| Diego | Vehículos y Conductores |
| Alejandro | Solicitudes y Asignaciones |
| Juan Carlos | Recorridos, gastos y Reportes |

Cada integrante desarrollará las funcionalidades asignadas y coordinará las modificaciones que involucren componentes compartidos.

## 6. Trabajo colaborativo con Git

La rama `main` representa la versión principal del proyecto y está protegida.

Cada integrante debe trabajar en una rama independiente creada desde `main`, previamente actualizada.

### Ramas sugeridas

| Responsable | Rama |
|---|---|
| Diego | `feature/vehiculos-conductores-diego` |
| Alejandro | `feature/solicitudes-asignaciones-alejandro` |
| Juan Carlos | `feature/recorridos-reportes-juancarlos` |

### Crear una rama

Con el directorio de trabajo limpio, ejecutar:

1. `git switch main`
2. `git pull --ff-only origin main`
3. `git switch -c nombre-de-la-rama`

Reemplazar `nombre-de-la-rama` por el nombre correspondiente.

### Guardar y publicar cambios

Después de desarrollar y probar una funcionalidad:

1. Revisar los archivos modificados con `git status`.
2. Agregar únicamente los archivos relacionados mediante `git add ruta-del-archivo`.
3. Crear un commit descriptivo con `git commit -m "Descripción del cambio"`.
4. Publicar la rama utilizando `git push -u origin nombre-de-la-rama`.

No realizar modificaciones directas en `main`.

## 7. Pruebas y compilación

Antes de presentar un pull request se deben ejecutar las siguientes comprobaciones.

**Pruebas automatizadas:**

`npm test -- --watch=false`

**Compilación de producción:**

`npm run build -- --configuration production --base-href /vehitrack-empresarial/`

La arquitectura base cuenta inicialmente con **55 pruebas automatizadas aprobadas**. Este número aumentará conforme se incorporen nuevas funcionalidades y pruebas.

Cada integrante debe verificar que sus cambios no afecten el funcionamiento de los demás módulos.

## 8. Pull requests e integración

Una vez publicados los cambios:

1. Abrir la pestaña **Pull requests** del repositorio.
2. Crear un nuevo pull request desde la rama de trabajo hacia `main`.
3. Describir las funcionalidades implementadas.
4. Indicar las pruebas realizadas y las posibles dependencias.
5. Revisar que GitHub Actions finalice correctamente.

Ángel será el responsable de revisar los aportes, solicitar ajustes cuando corresponda y realizar la integración final a `main`.

Las comprobaciones automáticas son obligatorias. Aunque el administrador dispone de permisos excepcionales, deberá verificar que las pruebas y la compilación hayan finalizado satisfactoriamente antes de realizar una integración.

## 9. Contratos API y coordinación con el backend

La matriz técnica y Product Owner aprobada por el equipo constituye la referencia para las funcionalidades y los contratos de comunicación.

Se deben respetar especialmente:

- **Columna I:** métodos HTTP y endpoints.
- **Columna J:** parámetros y cuerpos JSON enviados desde Angular.
- **Columna K:** estructuras JSON que devuelve la API.

Los modelos, DTO y adaptadores compartidos deben utilizarse como punto de partida para evitar incompatibilidades.

Cuando un endpoint todavía no esté implementado, pueden utilizarse datos de prueba para desarrollar las interfaces.

Los servicios reales se integrarán conforme Luis confirme su disponibilidad, URL HTTPS, contratos efectivos y requisitos de acceso.

Los cálculos económicos definitivos deberán realizarse en el backend, según las reglas aprobadas.

**Seguridad:** nunca publicar contraseñas, credenciales, claves API privadas ni información sensible en el repositorio. Los secretos del backend no deben incluirse en el código público de Angular.

## 10. Recomendaciones de colaboración

Antes de modificar modelos, DTO, rutas, servicios compartidos o reglas económicas, comunicarlo al equipo.

Los cambios deben ser pequeños, identificables y acompañados de pruebas cuando corresponda.

Si el desarrollo de un módulo requiere ajustes en el backend, coordinar previamente los contratos y las estructuras involucradas.

El objetivo es desarrollar los módulos de manera simultánea, evitar duplicar esfuerzos y conservar una versión principal estable para la presentación de Vehitrack Empresarial.

---

**Proyecto — Emprendimiento de Base Tecnológica**

Repositorio: https://github.com/acalderon474/vehitrack-empresarial

Aplicación publicada: https://acalderon474.github.io/vehitrack-empresarial/