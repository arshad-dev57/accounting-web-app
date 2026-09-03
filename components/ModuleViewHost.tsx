'use client';

import React, {
  ComponentType,
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const ModulePageVisibilityContext = createContext(true);

export function useModulePageVisible() {
  return useContext(ModulePageVisibilityContext);
}

/** @deprecated Use useModulePageVisible */
export const useSalesPageVisible = useModulePageVisible;

type ViewModule = { default: ComponentType };

export type ModuleViewHostConfig = {
  routes: readonly string[];
  viewLoaders: Record<string, () => Promise<ViewModule>>;
  isKeepAliveRoute?: (pathname: string) => boolean;
};

const componentCache = new Map<string, ComponentType>();

export function preloadModuleView(
  config: ModuleViewHostConfig,
  path: string,
): void {
  const loader = config.viewLoaders[path];
  if (!loader || componentCache.has(path)) return;
  void loader().then((mod) => {
    componentCache.set(path, mod.default);
  });
}

export function isModuleViewCached(path: string): boolean {
  return componentCache.has(path);
}

function defaultIsKeepAliveRoute(
  routes: readonly string[],
  pathname: string,
): boolean {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function PageSkeleton() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#014582]" />
    </div>
  );
}

function ModulePageView({
  path,
  loader,
  active,
}: {
  path: string;
  loader: () => Promise<ViewModule>;
  active: boolean;
}) {
  const [Comp, setComp] = useState<ComponentType | null>(
    () => componentCache.get(path) ?? null,
  );

  useLayoutEffect(() => {
    const cached = componentCache.get(path);
    if (cached) {
      setComp(() => cached);
      return;
    }

    let cancelled = false;
    void loader().then((mod) => {
      if (cancelled) return;
      componentCache.set(path, mod.default);
      setComp(() => mod.default);
    });

    return () => {
      cancelled = true;
    };
  }, [path, loader]);

  if (!Comp) return <PageSkeleton />;
  return <Comp />;
}

export default function ModuleViewHost({
  children,
  config,
}: {
  children: React.ReactNode;
  config: ModuleViewHostConfig;
}) {
  const pathname = usePathname();
  const isKeepAliveRouteFn =
    config.isKeepAliveRoute ?? defaultIsKeepAliveRoute.bind(null, config.routes);
  const isKeepAlive = isKeepAliveRouteFn(pathname);
  const [visited, setVisited] = useState<string[]>([]);

  useLayoutEffect(() => {
    if (!isKeepAlive) return;
    setVisited((prev) => (prev.includes(pathname) ? prev : [...prev, pathname]));
  }, [pathname, isKeepAlive]);

  // Avoid blank scroll area from a previous (taller) page.
  useLayoutEffect(() => {
    if (!isKeepAlive && visited.length === 0) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, isKeepAlive, visited.length]);

  const activePaths = useMemo(() => {
    const paths = new Set(visited);
    if (isKeepAlive) paths.add(pathname);
    return Array.from(paths);
  }, [visited, pathname, isKeepAlive]);

  const useHost =
    isKeepAlive || visited.some((path) => isKeepAliveRouteFn(path));

  if (!useHost) {
    return <>{children}</>;
  }

  return (
    <div className="relative w-full overflow-x-hidden">
      {activePaths.map((path) => {
        const loader = config.viewLoaders[path];
        if (!loader) return null;
        const active = path === pathname;
        return (
          <div
            key={path}
            className={
              active
                ? 'relative z-[1] w-full'
                : 'pointer-events-none absolute inset-x-0 top-0 -z-10 h-0 max-h-0 overflow-hidden opacity-0 invisible'
            }
            aria-hidden={!active}
          >
            <ModulePageVisibilityContext.Provider value={active}>
              <ModulePageView path={path} loader={loader} active={active} />
            </ModulePageVisibilityContext.Provider>
          </div>
        );
      })}
    </div>
  );
}

export function isModuleKeepAliveRoute(
  routes: readonly string[],
  pathname: string,
): boolean {
  return defaultIsKeepAliveRoute(routes, pathname);
}
