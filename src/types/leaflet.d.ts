import { ComponentType, ReactNode } from 'react';
import { LatLngExpression, MapOptions, Map } from 'leaflet';

declare module 'react-leaflet' {
  interface MapContainerProps extends MapOptions {
    center: LatLngExpression;
    zoom: number;
    scrollWheelZoom?: boolean;
    className?: string;
    children?: ReactNode;
    whenCreated?: (map: Map) => void;
  }

  interface TileLayerProps {
    url: string;
    attribution?: string;
  }

  interface MarkerProps {
    position: LatLngExpression;
    children?: ReactNode;
  }

  interface PopupProps {
    children?: ReactNode;
  }

  interface CircleProps {
    center: LatLngExpression;
    radius: number;
    fillOpacity?: number;
    color?: string;
    fillColor?: string;
  }

  export const MapContainer: ComponentType<MapContainerProps>;
  export const TileLayer: ComponentType<TileLayerProps>;
  export const Marker: ComponentType<MarkerProps>;
  export const Popup: ComponentType<PopupProps>;
  export const Circle: ComponentType<CircleProps>;
  export const GeoJSON: ComponentType<any>;
} 