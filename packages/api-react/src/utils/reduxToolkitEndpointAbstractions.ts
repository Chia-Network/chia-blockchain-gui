import { type EndpointBuilder } from '@reduxjs/toolkit/dist/query/endpointDefinitions';
import type { BaseQueryFn } from '@reduxjs/toolkit/query/react';

import type MethodFirstParameter from '../@types/MethodFirstParameter';
import type MethodReturnType from '../@types/MethodReturnType';
import type ServiceConstructor from '../@types/ServiceConstructor';

import withAllowUnsynced from './withAllowUnsynced';

// RTK v1.9.5 `query` receives only `(arg)` — the `api` object (with getState)
// is NOT passed. PR #2953 adds it but is not merged in v1.9.5.
// When we need store access (mergeAllowUnsynced), we use `queryFn` instead.

type QueryArgs<TClass extends ServiceConstructor, Method extends keyof InstanceType<TClass> & string> =
  MethodFirstParameter<TClass, Method> extends undefined ? void : MethodFirstParameter<TClass, Method>;

export function query<
  TagTypes extends string,
  ReducerPath extends string,
  Builder extends EndpointBuilder<BaseQueryFn, TagTypes, ReducerPath>,
  TClass extends ServiceConstructor,
  Method extends keyof InstanceType<TClass> & string,
  Transform extends (response: MethodReturnType<TClass, Method>) => any = (
    response: MethodReturnType<TClass, Method>,
  ) => MethodReturnType<TClass, Method>,
>(
  build: Builder,
  service: TClass,
  command: Method,
  options: {
    mergeAllowUnsynced?: boolean;
    transformResponse?: Transform;
    // Note: adding onCacheEntryAdded, providesTags, and invalidatesTags to this type
    // will allow typecsript to reject calls that use undeclared properties, but using
    // "[key: string]: any;" allows Javascript to pass through properties outside this
    // strictly defined type.
    [key: string]: any;
  } = {},
) {
  const { mergeAllowUnsynced, transformResponse = (data) => data, ...rest } = options;

  if (mergeAllowUnsynced) {
    return build.query<ReturnType<Transform>, QueryArgs<TClass, Method>>({
      ...rest,
      async queryFn(args, api, _extraOptions, baseQuery) {
        const mergedArgs = args && typeof args === 'object' ? withAllowUnsynced(api.getState(), args) : args;
        const result = await baseQuery({ service, command, args: mergedArgs });
        if (result.error) {
          return { error: result.error as any };
        }
        return { data: transformResponse(result.data as any) };
      },
    });
  }

  return build.query<ReturnType<Transform>, QueryArgs<TClass, Method>>({
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
    response: MethodReturnType<TClass, Method>,
  ) => MethodReturnType<TClass, Method>,
>(
  build: Builder,
  service: TClass,
  command: Method,
  options: {
    mergeAllowUnsynced?: boolean;
    transformResponse?: Transform;
  } = {}, // Omit<Parameters<typeof build.mutation<MethodReturnType<TClass, Method>, MethodFirstParameter<TClass, Method>>>[0], 'query'> = {}
) {
  const { mergeAllowUnsynced, transformResponse = (data) => data, ...rest } = options;

  if (mergeAllowUnsynced) {
    return build.mutation<ReturnType<Transform>, QueryArgs<TClass, Method>>({
      ...rest,
      async queryFn(args, api, _extraOptions, baseQuery) {
        const mergedArgs = args && typeof args === 'object' ? withAllowUnsynced(api.getState(), args) : args;
        const result = await baseQuery({ service, command, args: mergedArgs });
        if (result.error) {
          return { error: result.error as any };
        }
        return { data: transformResponse(result.data as any) };
      },
    });
  }

  return build.mutation<ReturnType<Transform>, QueryArgs<TClass, Method>>({
    transformResponse,
    ...rest,
    query: (args) => ({
      service,
      command,
      args,
    }),
  });
}
