import React from 'react';
import { IonAlert } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import Globals from '../Globals';

interface Props {
  showSearchAlert: boolean;
  finish: Function;
}

interface PageProps extends Props, RouteComponentProps<{
  tab: string;
  path: string;
}> { }

class SearchAlert extends React.Component<PageProps> {
  /*constructor(props: any) {
    super(props);
  }*/

  render() {
    return (
      <IonAlert
        cssClass='uiFont'
        backdropDismiss={false}
        isOpen={this.props.showSearchAlert}
        header={'搜尋經書'}
        subHeader='輸入搜尋'
        inputs={[
          {
            name: 'name0',
            type: 'search',
            placeholder: '例:金剛般若'
          },
        ]}
        buttons={[
          {
            text: '搜尋目錄',
            cssClass: 'primary uiFont',
            handler: (value) => {
              this.props.finish();
              this.props.history.push(`${Globals.pwaUrl}/catalog/search/${value.name0}`);
            },
          },
          {
            text: '全文檢索',
            cssClass: 'primary uiFont',
            handler: (value) => {
              this.props.finish();
              this.props.history.push(`${Globals.pwaUrl}/catalog/fulltextsearch/${value.name0}`);
            },
          },
          {
            text: '取消',
            role: 'cancel',
            cssClass: 'secondary uiFont',
            handler: () => this.props.finish(),
          },
        ]}
      />
    );
  }
};

export default SearchAlert;
