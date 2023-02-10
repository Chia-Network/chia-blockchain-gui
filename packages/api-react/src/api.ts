import { createApi } from '@reduxjs/toolkit/query/react';

import chiaLazyBaseQuery from './chiaLazyBaseQuery';

export default createApi({
  reducerPath: 'chiaApi',
  baseQuery: chiaLazyBaseQuery,
  endpoints: () => ({}),
});
