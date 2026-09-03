import type { ModuleViewHostConfig } from '../../components/ModuleViewHost';
import {
  isModuleKeepAliveRoute,
  preloadModuleView,
} from '../../components/ModuleViewHost';

type KeepAliveLinkProps = {
  'data-keep-alive-nav'?: '';
  scroll?: false;
  onMouseEnter?: () => void;
  onFocus?: () => void;
};

export function keepAliveLinkProps(
  routes: readonly string[],
  path: string,
): KeepAliveLinkProps {
  if (!isModuleKeepAliveRoute(routes, path)) return {};
  return { 'data-keep-alive-nav': '', scroll: false };
}

/** Sidebar link props with hover/focus preload for faster first open. */
export function keepAliveNavProps(
  config: ModuleViewHostConfig,
  path: string,
): KeepAliveLinkProps {
  if (!isModuleKeepAliveRoute(config.routes, path)) return {};
  const preload = () => preloadModuleView(config, path);
  return {
    'data-keep-alive-nav': '',
    scroll: false,
    onMouseEnter: preload,
    onFocus: preload,
  };
}
