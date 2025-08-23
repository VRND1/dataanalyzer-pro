declare module 'next/dynamic' {
  import { ComponentType } from 'react';

  interface DynamicOptions {
    ssr?: boolean;
    loading?: () => JSX.Element;
  }

  type DynamicImport<P = {}> = () => Promise<{ default: ComponentType<P> } | ComponentType<P>>;

  function dynamic<P = {}>(
    dynamicOptions: DynamicOptions | DynamicImport<P>,
    options?: DynamicOptions
  ): ComponentType<P>;

  export default dynamic;
} 