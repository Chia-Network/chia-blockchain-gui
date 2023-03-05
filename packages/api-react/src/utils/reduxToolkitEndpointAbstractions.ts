import { type EndpointBuilder } from '@reduxjs/toolkit/dist/query/endpointDefinitions';
import type { BaseQueryFn } from '@reduxjs/toolkit/query/react';

import type MethodFirstParameter from '../@types/MethodFirstParameter';
import type MethodReturnType from '../@types/MethodReturnType';

// after merge https://github.com/reduxjs/redux-toolkit/pull/2953 use this instead

export function query<
  TagTypes extends string,
  ReducerPath extends string,
  Builder extends EndpointBuilder<BaseQueryFn, TagTypes, ReducerPath>,
  TClass extends new (...args: any) => any,
  Method extends keyof InstanceType<TClass> & string,
  Transform extends (response: MethodReturnType<TClass, Method>) => any
>(
  build: Builder,
  service: TClass,
  command: Method,
  options: {
    transformResponse?: Transform;
    onCacheEntryAdded?: Parameters<
      typeof build.query<
        Transform extends undefined ? MethodReturnType<TClass, Method> : ReturnType<Transform>,
        MethodFirstParameter<TClass, Method>
      >
    >[0]['onCacheEntryAdded'];
    providesTags?: Parameters<
      typeof build.query<
        Transform extends undefined ? MethodReturnType<TClass, Method> : ReturnType<Transform>,
        MethodFirstParameter<TClass, Method>
      >
    >[0]['providesTags'];
    invalidatesTags?: Parameters<
      typeof build.query<
        Transform extends undefined ? MethodReturnType<TClass, Method> : ReturnType<Transform>,
        MethodFirstParameter<TClass, Method>
      >
    >[0]['invalidatesTags'];
  } = {}
) {
  type Response = Transform extends undefined ? MethodReturnType<TClass, Method> : ReturnType<Transform>;

  return build.query<Response, MethodFirstParameter<TClass, Method>>({
    ...options,
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
  TClass extends new (...args: any) => any,
  Method extends keyof InstanceType<TClass> & string,
  Transform extends (response: MethodReturnType<TClass, Method>) => any
>(
  build: Builder,
  service: TClass,
  command: Method,
  options: {
    transformResponse?: Transform;
    onCacheEntryAdded?: Parameters<
      typeof build.mutation<
        Transform extends undefined ? MethodReturnType<TClass, Method> : ReturnType<Transform>,
        MethodFirstParameter<TClass, Method>
      >
    >[0]['onCacheEntryAdded'];
    providesTags?: Parameters<
      typeof build.mutation<
        Transform extends undefined ? MethodReturnType<TClass, Method> : ReturnType<Transform>,
        MethodFirstParameter<TClass, Method>
      >
    >[0]['providesTags'];
    invalidatesTags?: Parameters<
      typeof build.mutation<
        Transform extends undefined ? MethodReturnType<TClass, Method> : ReturnType<Transform>,
        MethodFirstParameter<TClass, Method>
      >
    >[0]['invalidatesTags'];
  } = {} // Omit<Parameters<typeof build.mutation<MethodReturnType<TClass, Method>, MethodFirstParameter<TClass, Method>>>[0], 'query'> = {}
) {
  type Response = Transform extends undefined ? MethodReturnType<TClass, Method> : ReturnType<Transform>;
  return build.mutation<Response, MethodFirstParameter<TClass, Method>>({
    ...options,
    query: (args) => ({
      service,
      command,
      args,
    }),
  });
}
