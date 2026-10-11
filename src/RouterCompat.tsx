import React, { useMemo } from 'react';
import { Location, useLocation, useNavigate, useParams, useResolvedPath } from 'react-router-dom';

// Compatibility layer which keeps the React Router v5 style props
// (history, location, match) for class components on React Router v6.

type To = string | { pathname?: string; search?: string; hash?: string; state?: any };

export interface RouteHistory {
  push(to: To, state?: any): void;
  replace(to: To, state?: any): void;
  goBack(): void;
}

export interface RouteMatch<Params> {
  params: Params;
  url: string;
  path: string;
  isExact: boolean;
}

export interface RouteComponentProps<Params extends { [K in keyof Params]?: string } = {}> {
  history: RouteHistory;
  location: Location;
  match: RouteMatch<Params>;
}

export function RouteAdapter({ component: C, params }: {
  component: React.ComponentType<any>;
  // Extra params, e.g. a constant route type replacing v5 regex-constrained params.
  params?: { [key: string]: string };
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const routeParams = useParams();
  // Pathname of the matched route (correct even for views kept alive but hidden by Ionic).
  const url = useResolvedPath('.').pathname;

  const history = useMemo<RouteHistory>(() => {
    const go = (replace: boolean) => (to: To, state?: any) => {
      if (typeof to === 'string') {
        navigate(to, { replace, state });
      } else {
        navigate({ pathname: to.pathname, search: to.search, hash: to.hash }, { replace, state: to.state ?? state });
      }
    };
    return { push: go(false), replace: go(true), goBack: () => navigate(-1) };
  }, [navigate]);

  const match = { params: { tab: url.split('/')[1], ...routeParams, ...params }, url, path: url, isExact: true };

  return <C history={history} location={location} match={match} />;
}
