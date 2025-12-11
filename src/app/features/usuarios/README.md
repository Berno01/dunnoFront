# Módulo de Usuarios (Dashboard de Análisis de Vendedores)

## Descripción

Módulo completo para análisis de desempeño de vendedores con filtros avanzados de fecha y selección dinámica de vendedores.

## Estructura de Archivos

```
usuarios/
├── models/
│   └── usuarios.models.ts          # Interfaces TypeScript
├── services/
│   └── usuarios.service.ts         # Servicio HTTP
├── usuarios.component.ts           # Lógica del componente
└── usuarios.component.html         # Template HTML
```

## Características Implementadas

### 1. Filtros de Fecha

- **Modo Día Específico**: Selecciona un día y se envía como startDate y endDate
- **Modo Rango**: Selecciona fecha inicio y fin
- **Opciones Rápidas**: Hoy, Últimos 7 días, Este Mes
- **Personalizado**: Selector de fechas custom

### 2. Filtrado por Vendedor

- Click en vendedor para filtrar sus datos específicos
- Visual feedback con borde y fondo resaltado
- Click nuevamente para deseleccionar y volver a datos globales
- Lista con ranking por total vendido

### 3. Optimización con RxJS

- `switchMap` para cancelar peticiones pendientes
- `debounceTime(300ms)` para evitar múltiples llamadas
- Previene condiciones de carrera

### 4. Interfaz Gráfica

#### Sección Izquierda: Ranking de Vendedores

- Avatar con iniciales
- Iconos de posición (🥇🥈🥉)
- Total vendido y cantidad de ventas
- Click para filtrar

#### Sección Derecha: Análisis

- **KPIs de Descuentos**: 4 tarjetas con gradientes

  - Total Descontado
  - Cantidad de Descuentos
  - Promedio por Descuento
  - % sobre Ventas Brutas

- **Gráficos Top**:
  - Top Categorías (📚)
  - Top Modelos (👕)
  - Top Colores (🎨)
  - Distribución de Tallas (📏)

## API Endpoint

**URL**: `http://localhost:8080/api/dashboard/sales-rep-analysis`  
**Método**: GET  
**Headers**: `X-Usuario-Id: {userId}`  
**Query Params**:

- `startDate` (required): YYYY-MM-DD
- `endDate` (required): YYYY-MM-DD
- `salesRepId` (optional): number

## Uso

### Navegación

- **Desktop**: Navbar superior, sección "USUARIOS" (solo admin)
- **Mobile**: Menú hamburguesa, opción "USUARIOS"

### Flujo de Usuario

1. Seleccionar modo de fecha (Día/Rango)
2. Elegir fecha(s) o usar opciones rápidas
3. (Opcional) Click en vendedor para filtrar
4. Ver análisis actualizado
5. Click nuevamente en vendedor o botón "Ver todos" para resetear

## Helpers Implementados

- `getInitials()`: Genera iniciales para avatar
- `getAvatarColor()`: Asigna color al avatar por índice
- `getPositionIcon()`: Retorna emoji según posición
- `formatCurrency()`: Formatea a Bs. con separadores
- `formatPercentage()`: Formatea a porcentaje con 2 decimales

## Seguridad

- Protegido con `authGuard`
- Solo visible para administradores
- Usuario ID obtenido de SessionService

## Estilos

- Tailwind CSS
- Responsive (mobile-first)
- Skeleton loader durante carga
- Transiciones suaves
- Hover states
