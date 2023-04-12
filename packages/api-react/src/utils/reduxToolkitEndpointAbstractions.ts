import { type EndpointBuilder } from '@reduxjs/toolkit/dist/query/endpointDefinitions';
import type { BaseQueryFn } from '@reduxjs/toolkit/query/react';

import type MethodFirstParameter from '../@types/MethodFirstParameter';
import type MethodReturnType from '../@types/MethodReturnType';
import type ServiceConstructor from '../@types/ServiceConstructor';

// after merge https://github.com/reduxjs/redux-toolkit/pull/2953 use this instead

export function query<
  TagTypes extends string,
  ReducerPath extends string,
  Builder extends EndpointBuilder<BaseQueryFn, TagTypes, ReducerPath>,
  TClass extends ServiceConstructor,
  Method extends keyof InstanceType<TClass> & string,
  Transform extends (response: MethodReturnType<TClass, Method>) => any = (
    response: MethodReturnType<TClass, Method>
  ) => MethodReturnType<TClass, Method>
>(
  build: Builder,
  service: TClass,
  command: Method,
  options: {
    transformResponse?: Transform;
    onCacheEntryAdded?: Parameters<
      typeof build.query<ReturnType<Transform>, MethodFirstParameter<TClass, Method>>
    >[0]['onCacheEntryAdded'];
    providesTags?: Parameters<
      typeof build.query<ReturnType<Transform>, MethodFirstParameter<TClass, Method>>
    >[0]['providesTags'];
    invalidatesTags?: Parameters<
      typeof build.query<ReturnType<Transform>, MethodFirstParameter<TClass, Method>>
    >[0]['invalidatesTags'];
  } = {}
) {
  const { transformResponse = (data) => data, ...rest } = options;

  return build.query<
    ReturnType<Transform>,
    MethodFirstParameter<TClass, Method> extends undefined ? void : MethodFirstParameter<TClass, Method>
  >({
    transformResponse,
    ...rest,
    query: (args) => ({
      service,
      command,
      args,
    }),
  });
}

export function mutation<
  TagTypes extends string,
  ReducerPath extends string,
  Builder extends EndpointBuilder<BaseQueryFn, TagTypes, ReducerPath>,
  TClass extends ServiceConstructor,
  Method extends keyof InstanceType<TClass> & string,
  Transform extends (response: MethodReturnType<TClass, Method>) => any = (
    response: MethodReturnType<TClass, Method>
  ) => MethodReturnType<TClass, Method>
>(
  build: Builder,
  service: TClass,
  command: Method,
  options: {
    transformResponse?: Transform;
    onCacheEntryAdded?: Parameters<
      typeof build.mutation<ReturnType<Transform>, MethodFirstParameter<TClass, Method>>
    >[0]['onCacheEntryAdded'];
    providesTags?: Parameters<
      typeof build.mutation<ReturnType<Transform>, MethodFirstParameter<TClass, Method>>
    >[0]['providesTags'];
    invalidatesTags?: Parameters<
      typeof build.mutation<ReturnType<Transform>, MethodFirstParameter<TClass, Method>>
    >[0]['invalidatesTags'];
  } = {} // Omit<Parameters<typeof build.mutation<MethodReturnType<TClass, Method>, MethodFirstParameter<TClass, Method>>>[0], 'query'> = {}
) {
  const { transformResponse = (data) => data, ...rest } = options;

  return build.mutation<
    ReturnType<Transform>,
    MethodFirstParameter<TClass, Method> extends undefined ? void : MethodFirstParameter<TClass, Method>
  >({
    transformResponse,
    ...rest,
    query: (args) => ({
      service,
      command,
      args,
    }),
  });
}
