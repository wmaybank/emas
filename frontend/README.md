# EMAS Weather Frontend

Sistema de Monitoreo y Alerta Ambiental - Interfaz de Usuario

Este es el frontend de la aplicación EMAS Weather, construido con React, TypeScript y TailwindCSS.

## Características

- **Dashboard en tiempo real** con datos meteorológicos
- **Gestión de estaciones** meteorológicas
- **Sistema de alertas** configurables
- **Reportes y análisis** de datos históricos
- **Gráficos interactivos** con Chart.js
- **Interfaz responsiva** con TailwindCSS

## Tecnologías

- React 19.x
- TypeScript 4.x
- TailwindCSS 3.x
- Chart.js / react-chartjs-2
- React Router DOM
- Axios para comunicación con API

## Instalación

```bash
npm install
```

## Scripts Disponibles

### `npm start`
Ejecuta la aplicación en modo desarrollo.
Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### `npm run build`
Compila la aplicación para producción en la carpeta `build`.

### `npm test`
Ejecuta las pruebas en modo interactivo.

## Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
REACT_APP_API_URL=http://localhost:3001/api
```

## Estructura del Proyecto

```
src/
├── components/     # Componentes reutilizables
├── hooks/          # Hooks personalizados
├── pages/          # Páginas de la aplicación
├── services/       # Servicios de API
├── types/          # Definiciones de TypeScript
└── index.css       # Estilos globales con TailwindCSS
```

## Contribución

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crea un Pull Request
