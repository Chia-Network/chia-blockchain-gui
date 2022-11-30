import React from 'react';
import { Route, RouteProps } from 'react-router-dom';

type Props = RouteProps;

export default function PrivateRoute(props: Props) {
  return <Route {...props} />;
}
