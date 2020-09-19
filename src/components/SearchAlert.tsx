import React from 'react';
import { IonAlert } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';

interface Props {
  showSearchAlert: boolean;
}

interface PageProps extends Props, RouteComponentProps<{
  tab: string;
  path: string;
  label: string;
}> { }

class SearchAlert extends React.Component<PageProps> {
  /*constructor(props: any) {
    super(props);
  }*/

  render() {
    return (
      <IonAlert
        cssClass='uiFont'
        isOpen={this.props.showSearchAlert}
        header={'搜尋經文'}
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
            text: '取消',
            role: 'cancel',
            cssClass: 'secondary uiFont',
            handler: () => (this.props as any).searchCancel(),
          },
          {
            text: '確定',
            cssClass: 'primary uiFont',
            handler: (value) => {
              (this.props as any).searchOk(value.name0);
            },
          }
        ]}
      />
    );
  }
};

export default SearchAlert;
