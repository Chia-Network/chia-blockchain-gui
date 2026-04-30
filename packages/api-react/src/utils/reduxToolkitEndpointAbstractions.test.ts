import { query, mutation } from './reduxToolkitEndpointAbstractions';

const mockWithAllowUnsynced = jest.fn((_state: unknown, args: any) => ({ ...args, allowUnsynced: true }));
jest.mock('./withAllowUnsynced', () => ({
  __esModule: true,
  default: (...a: any[]) => mockWithAllowUnsynced(...a),
}));

function makeFakeBuild() {
  return {
    query: jest.fn((opts: any) => opts),
    mutation: jest.fn((opts: any) => opts),
  };
}

class FakeService {
  static isClient = false;
  static isDaemon = false;
  doSomething(_args: { walletId: number }) {
    return Promise.resolve({ ok: true });
  }
}

describe('reduxToolkitEndpointAbstractions', () => {
  beforeEach(() => {
    mockWithAllowUnsynced.mockClear();
  });

  describe('query helper', () => {
    it('uses query (not queryFn) when mergeAllowUnsynced is not set', () => {
      const build = makeFakeBuild();
      const endpoint = query(build as any, FakeService as any, 'doSomething', {}) as any;
      expect(endpoint.query).toBeDefined();
      expect(endpoint.queryFn).toBeUndefined();

      const result = endpoint.query({ walletId: 1 });
      expect(result).toEqual({
        service: FakeService,
        command: 'doSomething',
        args: { walletId: 1 },
      });
    });

    it('query does not receive a second api argument (RTK v1.9.5 contract)', () => {
      const build = makeFakeBuild();
      const endpoint = query(build as any, FakeService as any, 'doSomething', {}) as any;
      // Simulate RTK calling query(arg) with only one parameter
      const result = endpoint.query({ walletId: 1 });
      expect(result.args).toEqual({ walletId: 1 });
      expect(mockWithAllowUnsynced).not.toHaveBeenCalled();
    });

    it('uses queryFn when mergeAllowUnsynced is true (has access to api.getState)', async () => {
      const build = makeFakeBuild();
      const endpoint = query(build as any, FakeService as any, 'doSomething', {
        mergeAllowUnsynced: true,
      }) as any;
      expect(endpoint.queryFn).toBeDefined();
      expect(endpoint.query).toBeUndefined();

      const fakeState = { walletRpcPreferences: { allowUnsynced: true, usePeakHeightForHeightInfo: false } };
      const fakeApi = { getState: () => fakeState };
      const fakeBaseQuery = jest.fn().mockResolvedValue({ data: { ok: true } });

      const result = await endpoint.queryFn({ walletId: 1 }, fakeApi, {}, fakeBaseQuery);
      expect(result).toEqual({ data: { ok: true } });
      expect(mockWithAllowUnsynced).toHaveBeenCalledWith(fakeState, { walletId: 1 });
      expect(fakeBaseQuery).toHaveBeenCalledWith({
        service: FakeService,
        command: 'doSomething',
        args: { walletId: 1, allowUnsynced: true },
      });
    });

    it('queryFn propagates errors from baseQuery', async () => {
      const build = makeFakeBuild();
      const endpoint = query(build as any, FakeService as any, 'doSomething', {
        mergeAllowUnsynced: true,
      }) as any;

      const fakeApi = {
        getState: () => ({ walletRpcPreferences: { allowUnsynced: true, usePeakHeightForHeightInfo: false } }),
      };
      const fakeBaseQuery = jest.fn().mockResolvedValue({ error: { status: 500 } });

      const result = await endpoint.queryFn({ walletId: 1 }, fakeApi, {}, fakeBaseQuery);
      expect(result).toEqual({ error: { status: 500 } });
    });

    it('queryFn applies transformResponse', async () => {
      const build = makeFakeBuild();
      const endpoint = query(build as any, FakeService as any, 'doSomething', {
        mergeAllowUnsynced: true,
        transformResponse: (resp: any) => resp.ok,
      }) as any;

      const fakeApi = {
        getState: () => ({ walletRpcPreferences: { allowUnsynced: false, usePeakHeightForHeightInfo: false } }),
      };
      const fakeBaseQuery = jest.fn().mockResolvedValue({ data: { ok: true } });

      const result = await endpoint.queryFn({ walletId: 1 }, fakeApi, {}, fakeBaseQuery);
      expect(result).toEqual({ data: true });
    });

    it('preserves providesTags and onCacheEntryAdded', () => {
      const build = makeFakeBuild();
      const providesTags = jest.fn();
      const onCacheEntryAdded = jest.fn();
      const endpoint = query(build as any, FakeService as any, 'doSomething', {
        mergeAllowUnsynced: true,
        providesTags: providesTags as any,
        onCacheEntryAdded: onCacheEntryAdded as any,
      }) as any;
      expect(endpoint.providesTags).toBe(providesTags);
      expect(endpoint.onCacheEntryAdded).toBe(onCacheEntryAdded);
    });
  });

  describe('mutation helper', () => {
    it('uses query (not queryFn) when mergeAllowUnsynced is not set', () => {
      const build = makeFakeBuild();
      const endpoint = mutation(build as any, FakeService as any, 'doSomething', {}) as any;
      expect(endpoint.query).toBeDefined();
      expect(endpoint.queryFn).toBeUndefined();

      const result = endpoint.query({ walletId: 1 });
      expect(result).toEqual({
        service: FakeService,
        command: 'doSomething',
        args: { walletId: 1 },
      });
    });

    it('uses queryFn when mergeAllowUnsynced is true (has access to api.getState)', async () => {
      const build = makeFakeBuild();
      const endpoint = mutation(build as any, FakeService as any, 'doSomething', {
        mergeAllowUnsynced: true,
      }) as any;
      expect(endpoint.queryFn).toBeDefined();
      expect(endpoint.query).toBeUndefined();

      const fakeState = { walletRpcPreferences: { allowUnsynced: true, usePeakHeightForHeightInfo: false } };
      const fakeApi = { getState: () => fakeState };
      const fakeBaseQuery = jest.fn().mockResolvedValue({ data: { done: true } });

      const result = await endpoint.queryFn({ walletId: 1 }, fakeApi, {}, fakeBaseQuery);
      expect(result).toEqual({ data: { done: true } });
      expect(mockWithAllowUnsynced).toHaveBeenCalledWith(fakeState, { walletId: 1 });
    });

    it('queryFn propagates errors from baseQuery', async () => {
      const build = makeFakeBuild();
      const endpoint = mutation(build as any, FakeService as any, 'doSomething', {
        mergeAllowUnsynced: true,
      }) as any;

      const fakeApi = {
        getState: () => ({ walletRpcPreferences: { allowUnsynced: true, usePeakHeightForHeightInfo: false } }),
      };
      const fakeBaseQuery = jest.fn().mockResolvedValue({ error: { status: 400 } });

      const result = await endpoint.queryFn({ walletId: 1 }, fakeApi, {}, fakeBaseQuery);
      expect(result).toEqual({ error: { status: 400 } });
    });

    it('preserves invalidatesTags', () => {
      const build = makeFakeBuild();
      const invalidatesTags = [{ type: 'Wallets' as const, id: 'LIST' }];
      const endpoint = mutation(build as any, FakeService as any, 'doSomething', {
        mergeAllowUnsynced: true,
        invalidatesTags: invalidatesTags as any,
      }) as any;
      expect(endpoint.invalidatesTags).toBe(invalidatesTags);
    });
  });
});
