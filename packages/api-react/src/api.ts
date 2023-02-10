import { createApi } from '@reduxjs/toolkit/query/react';

import baseQuery from './chiaLazyBaseQuery';

export { baseQuery };

export default createApi({
  reducerPath: 'chiaApi',
  baseQuery,
  endpoints: () => ({}),
});
