import {
  Compiler,
  Inject,
  Injectable,
  Injector,
  NgModuleFactory,
  PLATFORM_ID,
} from '@angular/core';
import { CmsComponentMapping, CmsConfig } from '@spartacus/core';
import { Route } from '@angular/router';
import { isPlatformServer } from '@angular/common';
import { merge, Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { fromPromise } from 'rxjs/internal-compatibility';

/**
 * Please don't put that service in public API.
 * */
@Injectable({
  providedIn: 'root',
})
export class CmsMappingService {
  private missingComponents: string[] = [];

  private lazyConfigs = new Map();

  constructor(
    private config: CmsConfig,
    @Inject(PLATFORM_ID) private platformId: Object,
    private compiler: Compiler,
    private injector: Injector
  ) {}

  public getComponentMapping(
    componentType: string
  ): Observable<CmsComponentMapping> {
    const componentConfig = this.config.cmsComponents?.[componentType];

    if (!componentConfig) {
      if (!this.missingComponents.includes(componentType)) {
        this.missingComponents.push(componentType);
        console.warn(
          `No component implementation found for the CMS component type '${componentType}'.\n`,
          `Make sure you implement a component and register it in the mapper.`
        );
      }
    }

    if (componentConfig?.load) {
      if (!this.lazyConfigs.has(componentType)) {
        return fromPromise(this.getLazyConfig(componentConfig?.load)).pipe(
          map((lazyConfig) => ({
            ...lazyConfig.cmsComponents[componentType],
            ...componentConfig,
          })),
          tap((config) => this.lazyConfigs.set(componentType, config))
        );
      } else {
        return of(this.lazyConfigs.get(componentType));
      }
    }

    return of(componentConfig);
  }

  async getLazyConfig(loadFunc: () => Promise<any>): Promise<CmsConfig> {
    const lazyModule = await loadFunc();

    const moduleFactory =
      lazyModule instanceof NgModuleFactory
        ? lazyModule
        : await this.compiler.compileModuleAsync(lazyModule);
    const moduleRef = moduleFactory.create(this.injector);
    console.log('create moduleRe', moduleRef);
    const lazyConfig = moduleRef.injector.get('cms-config');
    console.log(lazyConfig);
    return lazyConfig;
  }

  isComponentEnabled(mapping?: CmsComponentMapping): boolean {
    const isSSR = isPlatformServer(this.platformId);
    return !(isSSR && mapping?.disableSSR);
  }

  public getMappings(
    componentTypes: string[]
  ): Observable<CmsComponentMapping> {
    return merge(
      ...componentTypes.map((type) => this.getComponentMapping(type))
    );
  }

  getRoutesForMappings(mappings: CmsComponentMapping[]): Route[] {
    const routes = [];
    for (const mapping of mappings) {
      if (this.isComponentEnabled(mapping)) {
        routes.push(...this.getRoutesForComponent(mapping));
      }
    }
    return routes;
  }

  getGuardsForMappings(mappings: CmsComponentMapping[]): any[] {
    const guards = new Set<any>();
    for (const mapping of mappings) {
      this.getGuardsForComponent(mapping).forEach((guard) => guards.add(guard));
    }
    return Array.from(guards);
  }

  getI18nKeysForMappings(mappings: CmsComponentMapping[]): string[] {
    const i18nKeys = new Set<string>();
    for (const mapping of mappings) {
      if (this.isComponentEnabled(mapping)) {
        this.getI18nKeysForComponent(mapping).forEach((key) =>
          i18nKeys.add(key)
        );
      }
    }
    return Array.from(i18nKeys);
  }

  private getRoutesForComponent(mapping?: CmsComponentMapping): Route[] {
    return mapping?.childRoutes ?? [];
  }

  private getGuardsForComponent(mapping?: CmsComponentMapping): any[] {
    return mapping?.guards ?? [];
  }

  private getI18nKeysForComponent(mapping?: CmsComponentMapping): string[] {
    return mapping?.i18nKeys ?? [];
  }

  // getRoutesForComponents(componentTypes: string[]): Observable<Route[]> {
  //   return this.getMappings(componentTypes).pipe(
  //     filter((mapping) => this.isComponentEnabled(mapping)),
  //     reduce((acc, mapping) => {
  //       acc.push(...this.getRoutesForComponent(mapping));
  //       return acc;
  //     }, [])
  //   );
  // }
  //
  // getGuardsForComponents(componentTypes: string[]): Observable<any[]> {
  //   return this.getMappings(componentTypes).pipe(
  //     reduce((guards, mapping) => {
  //       this.getGuardsForComponent(mapping).forEach((guard) =>
  //         guards.add(guard)
  //       );
  //       return guards;
  //     }, new Set<any>()),
  //     map((guards) => Array.from(guards))
  //   );
  // }
  //
  // getI18nKeysForComponents(componentTypes: string[]): Observable<string[]> {
  //   return this.getMappings(componentTypes).pipe(
  //     filter((mapping) => this.isComponentEnabled(mapping)),
  //     reduce((i18nKeys, mapping) => {
  //       this.getI18nKeysForComponent(mapping).forEach((key) =>
  //         i18nKeys.add(key)
  //       );
  //       return i18nKeys;
  //     }, new Set<any>()),
  //     map((i18nKeys) => Array.from(i18nKeys))
  //   );
  // }

  /*
    isComponentEnabled(componentType: string): Observable<boolean> {
    const isSSR = isPlatformServer(this.platformId);
    if (!isSSR) {
      return of(true);
    }
    return this.getComponentMapping(componentType).pipe(
      map((mapping) => !mapping?.disableSSR)
    );
  }

  getRoutesForComponents(componentTypes: string[]): Observable<Route[]> {
    const routes = [];
    for (const componentType of componentTypes) {
      if (this.isComponentEnabled(componentType)) {
        routes.push(...this.getRoutesForComponent(componentType));
      }
    }
    return routes;
  }

  getGuardsForComponents(componentTypes: string[]): Observable<any[]> {
    const guards = new Set<any>();
    for (const componentType of componentTypes) {
      this.getGuardsForComponent(componentType).forEach((guard) =>
        guards.add(guard)
      );
    }
    return Array.from(guards);
  }

  getI18nKeysForComponents(componentTypes: string[]): Observable<string[]> {
    const i18nKeys = new Set<string>();
    for (const componentType of componentTypes) {
      if (this.isComponentEnabled(componentType)) {
        this.getI18nKeysForComponent(componentType).forEach((key) =>
          i18nKeys.add(key)
        );
      }
    }
    return Array.from(i18nKeys);
  }

  private getRoutesForComponent(componentType: string): Observable<Route[]> {
    return this.getComponentMapping(componentType).pipe(
      map((mapping) => mapping?.childRoutes ?? [])
    );
  }

  private getGuardsForComponent(componentType: string): Observable<any[]> {
    return this.getComponentMapping(componentType).pipe(
      map((mapping) => mapping?.guards ?? [])
    );
  }

  private getI18nKeysForComponent(componentType: string): Observable<string[]> {
    return this.getComponentMapping(componentType).pipe(
      map((mapping) => mapping?.i18nKeys ?? [])
    );
  }

   */
}
