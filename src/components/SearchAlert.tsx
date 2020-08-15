import React from 'react';
import { IonAlert } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';

class SearchAlert extends React.Component<RouteComponentProps> {
  constructor(props: any) {
    super(props);
    this.state = {
    };
  }

  render() {
    return (
      <IonAlert
      isOpen={(this.props as any).showSearchAlert}
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
          cssClass: 'secondary',
          handler: () => (this.props as any).searchCancel(),
        },
        {
          text: '確定',
          cssClass: 'primary',
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
