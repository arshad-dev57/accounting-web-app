'use client';

import React, { createContext, useContext } from 'react';
import { hrWorkspaceService } from './hr-workspace-service';

/** Subset of workspace client used by shared document form controls. */
export type DocWorkspaceApi = Pick<
  typeof hrWorkspaceService,
  'detail' | 'linkOptions' | 'documentMeta' | 'create'
>;

const DocWorkspaceContext = createContext<DocWorkspaceApi>(hrWorkspaceService);

export function DocWorkspaceProvider({
  service,
  children
}: {
  service?: DocWorkspaceApi;
  children: React.ReactNode;
}) {
  return (
    <DocWorkspaceContext.Provider value={service ?? hrWorkspaceService}>
      {children}
    </DocWorkspaceContext.Provider>
  );
}

export function useDocWorkspace(): DocWorkspaceApi {
  return useContext(DocWorkspaceContext);
}
