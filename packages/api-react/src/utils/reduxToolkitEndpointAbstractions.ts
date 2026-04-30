import { type EndpointBuilder } from '@reduxjs/toolkit/dist/query/endpointDefinitions';
import type { BaseQueryFn } from '@reduxjs/toolkit/query/react';

import type MethodFirstParameter from '../@types/MethodFirstParameter';
import type MethodReturnType from '../@types/MethodReturnType';
import type ServiceConstructor from '../@types/ServiceConstructor';

import withAllowUnsynced from './withAllowUnsynced';

// RTK v1.9.5 `query` receives only `(arg)` — the `api` object (with getState)
// is NOT passed. PR #2953 adds it but is not merged in v1.9.5.
// When we need store access (mergeAllowUnsynced), we use `queryFn` instead.

// Tuple-wrap to prevent distributive conditional type behavior, and strip
// `undefined` from methods with optional parameters (e.g. `getHeightInfo(args?: {...})`)
// so RTK's `build.query<Result, Arg>` doesn't collapse the arg type to `void`.
type QueryArgs<TClass extends ServiceConstructor, Method extends keyof InstanceType<TClass> & string> = [
  MethodFirstParameter<TClass, Method>,
] extends [undefined]
  ? void
  : NonNullable<MethodFirstParameter<TClass, Method>>;

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
    // Derive the common RTK endpoint fields from `build.query`'s own options so
    // callbacks get proper contextual types (e.g. `providesTags` sees the actual
    // result type). Without this, callback parameters trip `noImplicitAny` under
    // the strict tsconfig.
    providesTags?: Parameters<typeof build.query<ReturnType<Transform>, QueryArgs<TClass, Method>>>[0]['providesTags'];
    invalidatesTags?: Parameters<
      typeof build.query<ReturnType<Transform>, QueryArgs<TClass, Method>>
    >[0]['invalidatesTags'];
    onCacheEntryAdded?: Parameters<
      typeof build.query<ReturnType<Transform>, QueryArgs<TClass, Method>>
    >[0]['onCacheEntryAdded'];
    onQueryStarted?: Parameters<
      typeof build.query<ReturnType<Transform>, QueryArgs<TClass, Method>>
    >[0]['onQueryStarted'];
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
    // Same rationale as in `query()`: derive the common RTK endpoint fields from
    // `build.mutation`'s own options so callback parameters get proper contextual
    // typing.
    providesTags?: Parameters<
      typeof build.mutation<ReturnType<Transform>, QueryArgs<TClass, Method>>
    >[0]['providesTags'];
    invalidatesTags?: Parameters<
      typeof build.mutation<ReturnType<Transform>, QueryArgs<TClass, Method>>
    >[0]['invalidatesTags'];
    onCacheEntryAdded?: Parameters<
      typeof build.mutation<ReturnType<Transform>, QueryArgs<TClass, Method>>
    >[0]['onCacheEntryAdded'];
    onQueryStarted?: Parameters<
      typeof build.mutation<ReturnType<Transform>, QueryArgs<TClass, Method>>
    >[0]['onQueryStarted'];
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
