import {Location} from 'history';

export interface RouteComponentProps<PageParams> {
    params: PageParams;
    navigate: Function;
    location: Location;
}
